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
        <div className="section">
            <p className="section-title">Risk Trend</p>
            {criticalFiles.length === 0
                ? <p style={{ fontSize: 12, color: 'var(--muted)' }}>No critical files yet</p>
                : <>
                    <select
                        className="trend-select"
                        value={selectedFile}
                        onChange={e => setSelectedFile(e.target.value)}
                    >
                        <option value="">Select file</option>
                        {criticalFiles.map(f => (
                            <option key={f.path} value={f.path}>
                                {f.path.split("/").pop()}
                            </option>
                        ))}
                    </select>
                    <button className="btn btn-secondary" onClick={handleFetch}>
                        Show Trend
                    </button>
                    {data.length > 0 && (
                        <ResponsiveContainer width="100%" height={150}>
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" />
                                <XAxis dataKey="analyzed_at" tick={{ fontSize: 10, fill: '#6b6b8a', fontFamily: 'JetBrains Mono' }} />
                                <YAxis tick={{ fontSize: 10, fill: '#6b6b8a', fontFamily: 'JetBrains Mono' }} />
                                <Tooltip
                                    contentStyle={{ background: '#13131f', border: '1px solid #1e1e30', borderRadius: 6, fontSize: 12 }}
                                />
                                <Line type="monotone" dataKey="score" stroke="#4d9eff" strokeWidth={2} dot={{ fill: '#4d9eff' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </>
            }
        </div>
    );
}