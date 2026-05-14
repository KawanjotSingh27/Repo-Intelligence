import { useState } from "react";
import FileInput from "./components/FileInput";
import Sidebar from "./components/Sidebar";
import GraphView from "./components/GraphView";
import { analyzeRepo, fetchGraph, analyzePR, fetchHistory } from "./api";
import History from "./components/History";
import TrendChart from "./components/TrendChart";

type Summary = {
    direct: number;
    indirect: number;
    maxDepth: number;
    score: number;
};

type CriticalFile = {
    path: string;
    score: number;
    valueExports: number;
    typeExports: number;
    isInCycle: boolean;
};

type GraphData = {
    [key: string]: {
        imports: string[];
        dependents: string[];
    };
};

export type AnalysisRecord = {
    id: number;
    repo_url: string;
    pr_url: string | null;
    analyzed_at: string;
    direct_dependents: number;
    indirect_dependents: number;
    max_depth: number;
    score: number;
    critical_files: CriticalFile[];
};

function extractRepoUrlFromPR(prUrl: string): string {
    const match = prUrl.match(/github\.com\/(.+?)\/(.+?)\/pull/);
    if (!match) return "";
    return `https://github.com/${match[1]}/${match[2]}`;
}

export default function App() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [criticalFiles, setCriticalFiles] = useState<CriticalFile[]>([]);
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [combinedImpact, setCombinedImpact] = useState<{ [key: string]: number }>({});
    const [changedFiles, setChangedFiles] = useState<string[]>([]);
    const [historyRecords, setHistoryRecords] = useState<AnalysisRecord[]>([]);
    const [repoUrl, setRepoUrl] = useState("");
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
            setCombinedImpact(analysis.combinedImpact);
        } catch (err) {
            console.error("Analysis failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitPR = async (prUrl: string) => {
        setLoading(true);
        try {
            const repo = extractRepoUrlFromPR(prUrl);
            const [analysis, history] = await Promise.all([
                analyzePR(prUrl),
                fetchHistory(repo)
            ]);

            setSummary(analysis.summary);
            setCriticalFiles(analysis.criticalFiles);
            setGraphData(analysis.graph);
            setCombinedImpact(analysis.combinedImpact);
            setChangedFiles(analysis.prFiles.map((f: string) =>
                Object.keys(analysis.graph).find(k => k.endsWith(f)) ?? f
            ));
            setRepoUrl(repo);
            setHistoryRecords(history);
        } catch (err) {
            console.error("PR analysis failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            <h1 style={{ padding: "1rem" }}>RepoIntel</h1>
            <FileInput onSubmit={handleSubmit} onSubmitPR={handleSubmitPR} />
            {loading && <p style={{ padding: "1rem" }}>Analyzing...</p>}
            <div style={{ display: "flex", flex: 1 }}>
                <Sidebar summary={summary} criticalFiles={criticalFiles} />
                <GraphView
                    graphData={graphData}
                    criticalFiles={criticalFiles.map(f => f.path)}
                    impactedFiles={Object.keys(combinedImpact)}
                    changedFiles={changedFiles}
                />
                <div style={{ display: "flex", flexDirection: "column", width: "350px" }}>
                    <History records={historyRecords} />
                    <TrendChart repoUrl={repoUrl} criticalFiles={criticalFiles} />
                </div>
            </div>
        </div>
    );
}