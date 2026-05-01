import express from "express";
import path from "path";
import { analyze } from "./analyzer";
import { getAllFiles, buildGraph, graph } from "./graph";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

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

app.listen(3000, () => {
    console.log("RepoIntel server running on port 3000");
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