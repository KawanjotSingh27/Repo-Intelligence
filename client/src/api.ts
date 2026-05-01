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