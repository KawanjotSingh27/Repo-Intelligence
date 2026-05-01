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

type Props = {
    summary: Summary | null;
    criticalFiles: CriticalFile[];
};

export default function Sidebar({ summary, criticalFiles }: Props) {
    if (!summary) return <div style={{ padding: "1rem" }}>No analysis yet.</div>;

    return (
        <div style={{ padding: "1rem", width: "300px", borderRight: "1px solid #ccc" }}>
            <h3>Summary</h3>
            <p>Direct dependents: {summary.direct}</p>
            <p>Indirect dependents: {summary.indirect}</p>
            <p>Max depth: {summary.maxDepth}</p>
            <p>Score: {summary.score.toFixed(2)}</p>

            <h3>Critical Files</h3>
            {criticalFiles.length === 0
                ? <p>None detected</p>
                : criticalFiles.map(f => (
                    <div key={f.path} style={{ color: "red", marginBottom: "0.5rem" }}>
                        <p>{f.path.split("/").pop()}</p>
                        <small>score: {f.score.toFixed(2)}</small>
                    </div>
                ))
            }
        </div>
    );
}