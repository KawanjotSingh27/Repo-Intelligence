import { useState } from "react";

type Props = {
    onSubmit: (dir: string, files: string[]) => void;
};

export default function FileInput({ onSubmit }: Props) {
    const [dir, setDir] = useState("");
    const [files, setFiles] = useState("");

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        const filesArray = files.split(",").map(f => f.trim());
        onSubmit(dir, filesArray);
    };

    return (
        <form onSubmit={handleSubmit} style={{ padding: "1rem" }}>
            <div>
                <label>Project directory</label>
                <input value={dir} onChange={e => setDir(e.target.value)} placeholder="./test" />
            </div>
            <div>
                <label>Target files (comma separated)</label>
                <input value={files} onChange={e => setFiles(e.target.value)} placeholder="./test/utils/index.ts" />
            </div>
            <button type="submit">Analyze</button>
        </form>
    );
}