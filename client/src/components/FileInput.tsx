import { useState } from "react";

type Props = {
    onSubmit: (dir: string, files: string[]) => void;
    onSubmitPR: (prUrl: string) => void;
};

export default function FileInput({ onSubmit, onSubmitPR }: Props) {
    const [dir, setDir] = useState("");
    const [files, setFiles] = useState("");
    const [prUrl, setPrUrl] = useState("");
    const [mode, setMode] = useState<"manual" | "pr">("manual");

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (mode === "manual") {
            const filesArray = files.split(",").map(f => f.trim());
            onSubmit(dir, filesArray);
        } else {
            onSubmitPR(prUrl);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ padding: "1rem" }}>
            <div style={{ marginBottom: "1rem" }}>
                <button type="button" onClick={() => setMode("manual")}>Manual</button>
                <button type="button" onClick={() => setMode("pr")}>PR URL</button>
            </div>

            {mode === "manual" ? (
                <>
                    <div>
                        <label>Project directory</label>
                        <input value={dir} onChange={e => setDir(e.target.value)} placeholder="./test" />
                    </div>
                    <div>
                        <label>Target files (comma separated)</label>
                        <input value={files} onChange={e => setFiles(e.target.value)} placeholder="./test/utils/index.ts" />
                    </div>
                </>
            ) : (
                <div>
                    <label>GitHub PR URL</label>
                    <input value={prUrl} onChange={e => setPrUrl(e.target.value)} placeholder="https://github.com/owner/repo/pull/123" />
                </div>
            )}

            <button type="submit">Analyze</button>
        </form>
    );
}