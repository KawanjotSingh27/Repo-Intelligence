import { useState } from "react";
import FileInput from "./components/FileInput";
import Sidebar from "./components/Sidebar";
import GraphView from "./components/GraphView";
import { analyzeRepo, fetchGraph } from "./api";

type Summary = {
    direct: number;
    indirect: number;
    maxDepth: number;
    score: number;
};

type CriticalFile = {
    path: string;
    score: number;
};

export default function App() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [criticalFiles, setCriticalFiles] = useState<CriticalFile[]>([]);
    const [graphData, setGraphData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (dir: string, files: string[]) => {
        setLoading(true);
        try {
            const [analysis, graph] = await Promise.all([
                analyzeRepo(dir, files),
                fetchGraph(dir)
            ]);
            setSummary(analysis.summary);
            setCriticalFiles(analysis.criticalFiles);
            setGraphData(graph);
        } catch (err) {
            console.error("Analysis failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            <h1 style={{ padding: "1rem" }}>RepoIntel</h1>
            <FileInput onSubmit={handleSubmit} />
            {loading && <p style={{ padding: "1rem" }}>Analyzing...</p>}
            <div style={{ display: "flex", flex: 1 }}>
                <Sidebar summary={summary} criticalFiles={criticalFiles} />
                <GraphView graphData={graphData} />
            </div>
        </div>
    );
}