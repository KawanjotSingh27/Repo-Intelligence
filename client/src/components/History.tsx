import type { AnalysisRecord } from "../App";

type Props = {
    records: AnalysisRecord[];
};

export default function History({ records }: Props) {
    return (
        <div style={{ padding: "1rem", overflowY: "auto", maxHeight: "400px" }}>
            <h3>Analysis History</h3>

            {records.length === 0 && <p>No history yet — run a PR analysis first.</p>}

            {records.map(record => (
                <div key={record.id} style={{
                    borderTop: "1px solid #ccc",
                    marginTop: "1rem",
                    paddingTop: "1rem"
                }}>
                    <p><strong>{new Date(record.analyzed_at).toLocaleString()}</strong></p>
                    {record.pr_url && (
                        <p>PR: <a href={record.pr_url} target="_blank" rel="noreferrer">
                            {record.pr_url.split("/").pop()}
                        </a></p>
                    )}
                    <p>Score: {record.score.toFixed(2)}</p>
                    <p>Direct: {record.direct_dependents} | Indirect: {record.indirect_dependents} | Depth: {record.max_depth}</p>
                    <p>Critical: {record.critical_files.map(f => f.path.split("/").pop()).join(", ") || "none"}</p>
                </div>
            ))}
        </div>
    );
}