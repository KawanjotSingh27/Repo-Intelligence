import express from "express";
import path from "path";
import { analyze } from "./analyzer";
import { getAllFiles, buildGraph, graph } from "./graph";
import cors from "cors";
import { cloneRepo, cleanupRepo, extractRepoUrl, getPRFiles } from "./github";
import fs from "fs";
import {pool, initDb, saveAnalysis, getAnalysisHistory } from "./db";

const app = express();
app.use(cors());
app.use(express.json());

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
    res.json(obj);
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

app.post("/analyze-pr", async (req, res) => {
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
        const node = graph.get(filesAbs[0]);
        console.log("Graph node for first PR file:", node);
        console.log("Dependents:", node?.dependents);
        console.log("PR files:", filesAbs);
        console.log("File exists:", filesAbs.map(f => fs.existsSync(f)));
        await saveAnalysis(
            extractRepoUrl(prUrl),
            prUrl,
            dir!,
            result.summary,
            result.criticalFiles,
            prFiles
        );
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
            )
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