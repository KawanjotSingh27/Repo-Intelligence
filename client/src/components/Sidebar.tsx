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

type Props = {
    summary: Summary | null;
    criticalFiles: CriticalFile[];
};

function getRiskLevel(score: number): string {
    if (score > 15) return "CRITICAL";
    if (score > 8) return "HIGH";
    if (score > 4) return "MEDIUM";
    return "LOW";
}

export default function Sidebar({ summary, criticalFiles }: Props) {
    if (!summary) return (
        <div className="section">
            <div className="empty">
                <div className="empty-icon">⬡</div>
                <p className="empty-text">No analysis yet</p>
                <p className="empty-sub">Paste a PR URL to get started</p>
            </div>
        </div>
    );

    const risk = getRiskLevel(summary.score);

    return (
        <>
            <div className="section">
                <p className="section-title">Impact Summary</p>
                <div className="stat-grid">
                    <div className="stat-card">
                        <div className="stat-value mono">{summary.direct}</div>
                        <div className="stat-label">Direct</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value mono">{summary.indirect}</div>
                        <div className="stat-label">Indirect</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value mono">{summary.maxDepth}</div>
                        <div className="stat-label">Max Depth</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value mono">{summary.score.toFixed(1)}</div>
                        <div className="stat-label">Score</div>
                    </div>
                    <div className="stat-score">
                        <span className="stat-label">Risk Level</span>
                        <span className={`risk-badge risk-${risk}`}>{risk}</span>
                    </div>
                </div>
            </div>

            <div className="section">
                <p className="section-title">Critical Files</p>
                {criticalFiles.length === 0
                    ? <p style={{ fontSize: 12, color: 'var(--muted)' }}>None detected</p>
                    : criticalFiles.map(f => (
                        <div key={f.path} className="critical-file">
                            <span className="critical-file-name">
                                {f.path.split("/").pop()}
                            </span>
                            <span className="critical-file-score">
                                {f.score.toFixed(1)}
                                {f.isInCycle && " ↻"}
                            </span>
                        </div>
                    ))
                }
            </div>
        </>
    );
}