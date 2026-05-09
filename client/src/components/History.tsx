import { useState } from "react";
import { fetchHistory } from "../api";

type CriticalFile = {
    path: string;
    score: number;
    valueExports: number;
    typeExports: number;
    isInCycle: boolean;
};

type AnalysisRecord = {
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

export default function History() {
    const [repoUrl, setRepoUrl] = useState("");
    const [records, setRecords] = useState<AnalysisRecord[]>([]);

    const handleFetch = async () => {
        const data = await fetchHistory(repoUrl);
        setRecords(data);
    };

    return (
        <div style={{ padding: "1rem" }}>
            <h3>Analysis History</h3>
            <div>
                <input
                    value={repoUrl}
                    onChange={e => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                />
                <button onClick={handleFetch}>Fetch History</button>
            </div>

            {records.length === 0 && <p>No history yet.</p>}

            {records.map(record => (
                <div key={record.id} style={{ 
                    borderTop: "1px solid #ccc", 
                    marginTop: "1rem",
                    paddingTop: "1rem" 
                }}>
                    <p><strong>{new Date(record.analyzed_at).toLocaleString()}</strong></p>
                    {record.pr_url && <p>PR: <a href={record.pr_url}>{record.pr_url}</a></p>}
                    <p>Score: {record.score.toFixed(2)}</p>
                    <p>Direct: {record.direct_dependents} | Indirect: {record.indirect_dependents} | Max depth: {record.max_depth}</p>
                    <p>Critical files: {record.critical_files.map((f: CriticalFile) => f.path.split("/").pop()).join(", ") || "none"}</p>
                </div>
            ))}
        </div>
    );
}