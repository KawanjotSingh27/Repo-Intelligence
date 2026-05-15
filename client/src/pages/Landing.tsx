import { Navigate } from "react-router-dom";
import { useAuth } from "../useAuth";

export default function Landing() {
    const { user } = useAuth();

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="landing">
            <nav className="landing-nav">
                <span className="header-logo">Repo<span>Intel</span></span>
                <a href="http://localhost:3000/auth/github" className="btn btn-primary landing-btn">
                    Login with GitHub
                </a>
            </nav>

            <div className="landing-hero">
                <div className="landing-badge">TypeScript · Static Analysis · Risk Scoring</div>
                <h1 className="landing-title">
                    Know the blast radius<br />before you merge
                </h1>
                <p className="landing-sub">
                    RepoIntel analyzes your pull requests and maps the dependency impact of every change — so your team reviews with context, not guesswork.
                </p>
                <a href="http://localhost:3000/auth/github" className="btn btn-primary landing-cta">
                    Analyze your first PR →
                </a>
            </div>

            <div className="landing-features">
                <div className="feature-card">
                    <div className="feature-icon">⬡</div>
                    <h3>Dependency Graph</h3>
                    <p>Visualize how every file in your codebase connects. See import chains, circular dependencies, and isolated modules at a glance.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">⚠</div>
                    <h3>Risk Scoring</h3>
                    <p>Every file gets a risk score based on its export surface, dependent count, and position in the dependency tree.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">↗</div>
                    <h3>PR Analysis</h3>
                    <p>Paste a GitHub PR URL and instantly see which files are at risk, which are critical, and what the full blast radius looks like.</p>
                </div>
            </div>
        </div>
    );
}
