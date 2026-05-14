import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { fetchFileHistory } from "../api";

type CriticalFile = {
    path: string;
    score: number;
    valueExports: number;
    typeExports: number;
    isInCycle: boolean;
};

type DataPoint = {
    analyzed_at: string;
    score: number;
};

type Props = {
    repoUrl: string;
    criticalFiles: CriticalFile[];
};

export default function TrendChart({ repoUrl, criticalFiles }: Props) {
    const [selectedFile, setSelectedFile] = useState("");
    const [data, setData] = useState<DataPoint[]>([]);

    const handleFetch = async () => {
        if (!selectedFile || !repoUrl) return;
        const raw = await fetchFileHistory(repoUrl, selectedFile);
        setData(raw.map((r: DataPoint) => ({
            analyzed_at: new Date(r.analyzed_at).toLocaleDateString(),
            score: r.score
        })));
    };

    return (
        <div style={{ padding: "1rem" }}>
            <h3>Risk Score Trend</h3>

            {criticalFiles.length === 0 && <p>No critical files yet.</p>}

            {criticalFiles.length > 0 && (
                <div>
                    <select
                        value={selectedFile}
                        onChange={e => setSelectedFile(e.target.value)}
                    >
                        <option value="">Select a critical file</option>
                        {criticalFiles.map(f => (
                            <option key={f.path} value={f.path}>
                                {f.path.split("/").pop()}
                            </option>
                        ))}
                    </select>
                    <button onClick={handleFetch}>Show Trend</button>
                </div>
            )}

            {data.length === 0 && selectedFile && <p>No trend data yet — run more analyses.</p>}

            {data.length > 0 && (
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="analyzed_at" />
                        <YAxis />
                        <Tooltip />
                        <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#ff4444"
                            strokeWidth={2}
                            dot={true}
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}