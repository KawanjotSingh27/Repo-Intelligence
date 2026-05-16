import { useState } from "react";
import { fetchRepoFiles } from "../api";

type Props = {
    onSubmit: (clonedDir: string, files: string[]) => void;
    onSubmitPR: (prUrl: string) => void;
    initialPrUrl?: string;
};

export default function FileInput({ onSubmit, onSubmitPR, initialPrUrl = "" }: Props) {
    const [mode, setMode] = useState<"repo" | "pr">("pr");
    const [prUrl, setPrUrl] = useState(initialPrUrl);
    const [repoUrl, setRepoUrl] = useState("");
    const [repoFiles, setRepoFiles] = useState<string[]>([]);
    const [clonedDir, setClonedDir] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [loadingFiles, setLoadingFiles] = useState(false);

    const handleFetchFiles = async () => {
        setLoadingFiles(true);
        try {
            const data = await fetchRepoFiles(repoUrl);
            setRepoFiles(data.files);
            setClonedDir(data.clonedDir);
        } catch (err) {
            console.error("Failed to fetch files:", err);
        } finally {
            setLoadingFiles(false);
        }
    };

    const toggleFile = (file: string) => {
        setSelectedFiles(prev =>
            prev.includes(file)
                ? prev.filter(f => f !== file)
                : [...prev, file]
        );
    };

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (mode === "pr") {
            onSubmitPR(prUrl);
        } else {
            onSubmit(clonedDir, selectedFiles);
        }
    };

    const filteredFiles = repoFiles.filter(f =>
        f.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <form onSubmit={handleSubmit}>
            <div className="btn-tabs">
                <button
                    type="button"
                    className={`btn btn-tab ${mode === "pr" ? "active" : ""}`}
                    onClick={() => setMode("pr")}
                >PR URL</button>
                <button
                    type="button"
                    className={`btn btn-tab ${mode === "repo" ? "active" : ""}`}
                    onClick={() => setMode("repo")}
                >Repo URL</button>
            </div>

            {mode === "pr" ? (
                <div className="input-group">
                    <label className="input-label">GitHub PR URL</label>
                    <input
                        className="input"
                        value={prUrl}
                        onChange={e => setPrUrl(e.target.value)}
                        placeholder="https://github.com/owner/repo/pull/1"
                    />
                </div>
            ) : (
                <>
                    <div className="input-group">
                        <label className="input-label">GitHub Repo URL</label>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input
                                className="input"
                                value={repoUrl}
                                onChange={e => setRepoUrl(e.target.value)}
                                placeholder="https://github.com/owner/repo"
                            />
                            <button
                                type="button"
                                className="btn btn-tab"
                                onClick={handleFetchFiles}
                                disabled={loadingFiles}
                            >
                                {loadingFiles ? "..." : "Load"}
                            </button>
                        </div>
                    </div>

                    {repoFiles.length > 0 && (
                        <div className="input-group">
                            <label className="input-label">
                                Select target files ({selectedFiles.length} selected)
                            </label>
                            <input
                                className="input"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search files..."
                                style={{ marginBottom: "0.5rem" }}
                            />
                            <div style={{
                                maxHeight: "180px",
                                overflowY: "auto",
                                background: "var(--surface2)",
                                border: "1px solid var(--border)",
                                borderRadius: "6px"
                            }}>
                                {filteredFiles.map(file => (
                                    <div
                                        key={file}
                                        onClick={() => toggleFile(file)}
                                        style={{
                                            padding: "0.4rem 0.75rem",
                                            cursor: "pointer",
                                            fontSize: "12px",
                                            fontFamily: "var(--font-mono)",
                                            background: selectedFiles.includes(file)
                                                ? "#4d9eff22"
                                                : "transparent",
                                            color: selectedFiles.includes(file)
                                                ? "var(--accent)"
                                                : "var(--text)",
                                            borderBottom: "1px solid var(--border)"
                                        }}
                                    >
                                        {file}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            <button
                type="submit"
                className="btn btn-primary"
                disabled={mode === "repo" && selectedFiles.length === 0}
            >
                Analyze
            </button>
        </form>
    );
}