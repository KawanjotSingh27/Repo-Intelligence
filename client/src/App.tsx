import { useEffect, useState, useRef} from "react";
import FileInput from "./components/FileInput";
import Sidebar from "./components/Sidebar";
import GraphView from "./components/GraphView";
import { analyzeRepo, fetchGraph, analyzePR, fetchHistory } from "./api";
import History from "./components/History";
import TrendChart from "./components/TrendChart";
import { useNavigate, useLocation } from "react-router-dom";

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
    pr_files: string[];
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
    const [report, setReport] = useState<string>("");
    const [viewingRecord, setViewingRecord] = useState<AnalysisRecord | null>(null);


    const hasAutoRun = useRef(false);

    const navigate = useNavigate();
    const location=useLocation();

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
            setReport(analysis.report);
        } catch (err) {
            console.error("PR analysis failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const state = location.state as { 
            prUrl?: string;
            record?: AnalysisRecord;
            mode?: "view" | "reanalyze"
        } | null;

        if (!state || hasAutoRun.current) return;
        hasAutoRun.current = true;

        if (state.mode === "view" && state.record) {
            setViewingRecord(state.record);
            const record = state.record;
            setSummary({
                direct: record.direct_dependents,
                indirect: record.indirect_dependents,
                maxDepth: record.max_depth,
                score: record.score
            });
            setCriticalFiles(record.critical_files);
            setReport("");
        } else if (state.prUrl) {
            handleSubmitPR(state.prUrl);
        }
    }, []);

    return (
        <div className="app">
            <header className="header">
                <span className="header-logo" onClick={()=>navigate("/dashboard")} style={{cursor:"pointer"}}>Repo<span>Intel</span></span>
            </header>

            <aside className="panel-left">
                <div className="section">
                    <FileInput onSubmit={handleSubmit} onSubmitPR={handleSubmitPR} />
                </div>
                {viewingRecord?.pr_url && (
                    <div className="section">
                        <p className="section-title">Viewing saved result</p>
                        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: '0.75rem' }}>
                            {new Date(viewingRecord.analyzed_at).toLocaleString()}
                        </p>
                        <button 
                            className="btn btn-primary"
                            onClick={() => {
                                setViewingRecord(null);
                                handleSubmitPR(viewingRecord.pr_url!);
                            }}
                        >
                            Re-analyze →
                        </button>
                    </div>
                )}
                {loading && (
                    <div className="loading">
                        <div className="loading-dot" />
                        Analyzing...
                    </div>
                )}
                <Sidebar summary={summary} criticalFiles={criticalFiles} />
            </aside>

            <main className="panel-center">
                <GraphView
                    graphData={graphData}
                    criticalFiles={criticalFiles.map(f => f.path)}
                    impactedFiles={Object.keys(combinedImpact)}
                    changedFiles={changedFiles}
                />
            </main>

            <aside className="panel-right">
                {report && (
                    <div className="section">
                        <p className="section-title">PR Report</p>
                        <pre className="report-pre">{report}</pre>
                    </div>
                )}
                <History records={historyRecords} />
                <TrendChart repoUrl={repoUrl} criticalFiles={criticalFiles} />
            </aside>
        </div>
    );
}