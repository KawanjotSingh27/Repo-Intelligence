import {useEffect,useState } from "react";
import { useAuth } from "../useAuth";
import { useNavigate } from "react-router-dom";
import { fetchUserAnalyses } from "../api";
import type { AnalysisRecord } from "../App";

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [recentAnalyses, setRecentAnalyses] = useState<AnalysisRecord[]>([]);

    useEffect(() => {
        fetchUserAnalyses().then(setRecentAnalyses).catch(console.error);
    },[]);

    function getRiskLevel(score: number): string {
        if (score > 15) return "CRITICAL";
        if (score > 8) return "HIGH";
        if (score > 4) return "MEDIUM";
        return "LOW";
    }

    return (
        <div className="dashboard">
            <nav className="landing-nav">
                <span className="header-logo">Repo<span>Intel</span></span>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <img
                        src={user?.avatar_url}
                        alt={user?.username}
                        style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--border)" }}
                    />
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>{user?.username}</span>
                    <button className="btn btn-tab" onClick={logout}>Logout</button>
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="dashboard-header">
                    <div>
                        <h1 style={{ fontSize: 24, marginBottom: "0.25rem" }}>
                            Welcome back, {user?.username}
                        </h1>
                        <p style={{ color: "var(--muted)", fontSize: 13 }}>
                            Analyze a PR or view your recent analyses below
                        </p>
                    </div>
                    <button
                        className="btn btn-primary landing-btn"
                        onClick={() => navigate("/analyze")}
                    >
                        New Analysis →
                    </button>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <p className="section-title">Recent Analyses</p>
                        {recentAnalyses.length === 0 ? (
                            <div className="empty">
                                <div className="empty-icon">⬡</div>
                                <p className="empty-text">No analyses yet</p>
                                <p className="empty-sub">Analyze your first PR to get started</p>
                                <button
                                    className="btn btn-primary landing-btn"
                                    style={{ marginTop: "1rem" }}
                                    onClick={() => navigate("/analyze")}
                                >
                                    Analyze a PR
                                </button>
                            </div>
                        ) : (
                            recentAnalyses.map(record => (
                                <div key={record.id} className="history-item">
                                    <div className="history-time">
                                        {new Date(record.analyzed_at).toLocaleString()}
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                                        <span className="history-score mono">{record.score.toFixed(1)}</span>
                                        <span className={`risk-badge risk-${getRiskLevel(record.score)}`}>
                                            {getRiskLevel(record.score)}
                                        </span>
                                    </div>
                                    {record.pr_url && (
                                        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
                                            {record.pr_url}
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="dashboard-card">
                        <p className="section-title">Quick Stats</p>
                        <div className="stat-grid">
                            <div className="stat-card">
                                <div className="stat-value mono">{recentAnalyses.length}</div>
                                <div className="stat-label">Total Analyses</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value mono">
                                    {recentAnalyses.filter(r => r.score > 8).length}
                                </div>
                                <div className="stat-label">High Risk PRs</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value mono">
                                    {recentAnalyses.length > 0
                                        ? (recentAnalyses.reduce((acc, r) => acc + r.score, 0) / recentAnalyses.length).toFixed(1)
                                        : "—"
                                    }
                                </div>
                                <div className="stat-label">Avg Score</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value mono">
                                    {new Set(recentAnalyses.map(r => r.repo_url)).size}
                                </div>
                                <div className="stat-label">Repos Analyzed</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}