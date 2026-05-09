import axios from "axios";

const BASE = "http://localhost:3000";

export async function analyzeRepo(dir: string, files: string[]) {
    const res = await axios.post(`${BASE}/analyze`, { dir, files });
    return res.data;
}

export async function fetchGraph(dir: string) {
    const res = await axios.get(`${BASE}/graph`, { params: { dir } });
    return res.data;
}

export async function analyzePR(prUrl: string) {
    const res = await axios.post(`${BASE}/analyze-pr`, { prUrl });
    return res.data;
}

export async function fetchHistory(repoUrl: string) {
    const res = await axios.get(`${BASE}/history`, { params: { repoUrl } });
    return res.data;
}