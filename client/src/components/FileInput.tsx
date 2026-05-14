import { useState } from "react";

type Props = {
    onSubmit: (dir: string, files: string[]) => void;
    onSubmitPR: (prUrl: string) => void;
};

export default function FileInput({ onSubmit, onSubmitPR }: Props) {
    const [mode, setMode] = useState<"manual" | "pr">("pr");
    const [dir, setDir] = useState("");
    const [files, setFiles] = useState("");
    const [prUrl, setPrUrl] = useState("");

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (mode === "manual") {
            onSubmit(dir, files.split(",").map(f => f.trim()));
        } else {
            onSubmitPR(prUrl);
        }
    };

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
                    className={`btn btn-tab ${mode === "manual" ? "active" : ""}`}
                    onClick={() => setMode("manual")}
                >Manual</button>
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
                        <label className="input-label">Project directory</label>
                        <input
                            className="input"
                            value={dir}
                            onChange={e => setDir(e.target.value)}
                            placeholder="./my-project"
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Target files (comma separated)</label>
                        <input
                            className="input"
                            value={files}
                            onChange={e => setFiles(e.target.value)}
                            placeholder="./src/utils.ts, ./src/core.ts"
                        />
                    </div>
                </>
            )}

            <button type="submit" className="btn btn-primary">
                Analyze
            </button>
        </form>
    );
}