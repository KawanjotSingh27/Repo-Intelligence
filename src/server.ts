import dotenv from "dotenv";
dotenv.config();
import express from "express";
import path from "path";
import { analyze } from "./analyzer";
import { getAllFiles, buildGraph, graph } from "./graph";
import cors from "cors";
import { cloneRepo, cleanupRepo, extractRepoUrl, getPRFiles } from "./github";
import fs from "fs";
import {pool, initDb, saveAnalysis, getAnalysisHistory } from "./db";
import { generateReport } from "./report";
import { scoreMap } from "./scorer";
import { getGithubAuthUrl, handleOAuthCallback, verifyJWT } from "./auth";
import { getUserById } from "./db";

const app = express();
app.use(cors());
app.use(express.json());
export function authMiddleware(req: any, res: any, next: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        req.userId = null;
        return next();
    }
    const token = authHeader.replace("Bearer ", "");
    const payload = verifyJWT(token);
    req.userId = payload?.userId ?? null;
    next();
}

app.use(authMiddleware);

app.get("/auth/github", (req, res) => {
    res.redirect(getGithubAuthUrl());
});

app.get("/auth/callback", async (req, res) => {
    const code = req.query.code as string;
    if (!code) {
        res.status(400).json({ error: "No code provided" });
        return;
    }
    try {
        const { token, user } = await handleOAuthCallback(code);
        // redirect to frontend with token in query param
        res.redirect(`http://localhost:5173/auth?token=${token}&username=${user.username}&avatar=${user.avatar_url}`);
    } catch (err) {
        res.status(500).json({ error: "Auth failed" });
    }
});

app.get("/auth/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: "No token" });
        return;
    }
    const token = authHeader.replace("Bearer ", "");
    const payload = verifyJWT(token);
    if (!payload) {
        res.status(401).json({ error: "Invalid token" });
        return;
    }
    const user = await getUserById(payload.userId);
    res.json(user);
});

app.get("/user-analyses", async (req: any, res) => {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const result = await pool.query(
        `SELECT * FROM analyses WHERE user_id = $1 ORDER BY analyzed_at DESC LIMIT 20`,
        [req.userId]
    );
    res.json(result.rows);
});

app.get("/history", async (req, res) => {
    const { repoUrl } = req.query;
    if (!repoUrl) {
        res.status(400).json({ error: "repoUrl is required" });
        return;
    }
    const history = await getAnalysisHistory(repoUrl as string);
    res.json(history);
});

app.post("/analyze", (req, res) => {
    const {dir,files}=req.body;
    if (!dir || !files) {
        res.status(400).json({ error: "dir and files are required" });
        return;
    }
    const dirPath=path.resolve(dir);
    const filesPath = files.map((f: string) => path.resolve(f));
    const obj = analyze(dirPath, filesPath);
    res.json({
        summary: obj.summary,
        criticalFiles: obj.criticalFiles,
        combinedImpact: Object.fromEntries(obj.combinedImpact)
    });
});

app.get("/graph", (req, res) => {
    const dir = req.query.dir as string;
    if (!dir) {
        res.status(400).json({ error: "dir is required" });
        return;
    }
    const files = getAllFiles(path.resolve(dir));
    buildGraph(files);

    const serializable = Object.fromEntries(
        Array.from(graph.entries()).map(([file, node]) => [
            file,
            {
                imports: Array.from(node.imports),
                dependents: Array.from(node.dependents)
            }
        ])
    );

    res.json(serializable);
});

app.post("/analyze-repo", async (req, res) => {
    const { repoUrl, files } = req.body;
    if (!repoUrl) {
        res.status(400).json({ error: "repoUrl is required" });
        return;
    }
    let dir: string | null = null;
    try {
        dir = await cloneRepo(repoUrl);
        const filesAbs = files ? files.map((f: string) => path.resolve(dir!, f)) : [];
        const result = analyze(dir, filesAbs);
        res.json({
            summary: result.summary,
            criticalFiles: result.criticalFiles,
            combinedImpact: Object.fromEntries(result.combinedImpact)
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to clone or analyze repo" });
    } finally {
        if (dir) cleanupRepo(dir);
    }
});

app.post("/analyze-pr", async (req:any, res) => {
    const { prUrl } = req.body;
    if (!prUrl) {
        res.status(400).json({ error: "prUrl is required" });
        return;
    }
    let dir: string | null = null;
    try {
        const [prFiles, clonedDir] = await Promise.all([
            getPRFiles(prUrl),
            cloneRepo(extractRepoUrl(prUrl))
        ]);
        dir = clonedDir;
        const filesAbs = prFiles.map(f => path.resolve(dir!, f));
        const result = analyze(dir, filesAbs);
        const scores = Array.from(scoreMap.entries()).map(([p, node]) => ({
            file: p.split("/").pop(),
            score: node.score
        }));
        const node = graph.get(filesAbs[0]);
        await saveAnalysis(
            extractRepoUrl(prUrl),
            prUrl,
            dir!,
            result.summary,
            result.criticalFiles,
            prFiles,
            req.userId
        );
        const report = generateReport({
            repoUrl: extractRepoUrl(prUrl),
            prUrl,
            prFiles,
            summary: result.summary,
            criticalFiles: result.criticalFiles
        });
        res.json({
            summary: result.summary,
            criticalFiles: result.criticalFiles,
            combinedImpact: Object.fromEntries(result.combinedImpact),
            prFiles: prFiles,
            graph: Object.fromEntries(
                Array.from(graph.entries()).map(([file, node]) => [
                    file,
                    {
                        imports: Array.from(node.imports),
                        dependents: Array.from(node.dependents)
                    }
                ])
            ),
            report
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to analyze PR" });
    } finally {
        if (dir) cleanupRepo(dir);
    }
});

app.get("/file-history", async (req, res) => {
    const { repoUrl, filePath } = req.query;
    if (!repoUrl || !filePath) {
        res.status(400).json({ error: "repoUrl and filePath are required" });
        return;
    }
    try {
        const result = await pool.query(
            `SELECT analyzed_at, score, critical_files
             FROM analyses
             WHERE repo_url = $1
             AND critical_files::text LIKE $2
             ORDER BY analyzed_at ASC`,
            [repoUrl, `%${(filePath as string).split("/").pop()}%`]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch file history" });
    }
});

initDb().then(() => {
    console.log("Database initialized");
}).catch(err => {
    console.error("Database initialization failed:", err);
});

app.listen(3000, () => {
    console.log("RepoIntel server running on port 3000");
});