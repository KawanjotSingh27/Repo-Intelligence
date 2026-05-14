import type { AnalysisRecord } from "../App";

type Props = {
    records: AnalysisRecord[];
};

function getRiskLevel(score: number): string {
    if (score > 15) return "CRITICAL";
    if (score > 8) return "HIGH";
    if (score > 4) return "MEDIUM";
    return "LOW";
}

export default function History({ records }: Props) {
    return (
        <div className="section">
            <p className="section-title">History</p>
            {records.length === 0
                ? <p style={{ fontSize: 12, color: 'var(--muted)' }}>No history yet</p>
                : records.map(record => (
                    <div key={record.id} className="history-item">
                        <div className="history-time">
                            {new Date(record.analyzed_at).toLocaleString()}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                            <span className="history-score mono">
                                {record.score.toFixed(1)}
                            </span>
                            <span className={`risk-badge risk-${getRiskLevel(record.score)}`}>
                                {getRiskLevel(record.score)}
                            </span>
                        </div>
                        {record.critical_files.length > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                                ⚠ {record.critical_files.map(f => f.path.split("/").pop()).join(", ")}
                            </div>
                        )}
                    </div>
                ))
            }
        </div>
    );
}