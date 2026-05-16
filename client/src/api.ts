import axios from "axios";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function getHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function analyzeRepo(dir: string, files: string[]) {
    const res = await axios.post(`${BASE}/analyze`, { dir, files }, { headers: getHeaders() });
    return res.data;
}

export async function fetchGraph(dir: string) {
    const res = await axios.get(`${BASE}/graph`, { params: { dir }, headers: getHeaders() });
    return res.data;
}

export async function analyzePR(prUrl: string) {
    const res = await axios.post(`${BASE}/analyze-pr`, { prUrl }, { headers: getHeaders() });
    return res.data;
}

export async function fetchHistory(repoUrl: string) {
    const res = await axios.get(`${BASE}/history`, { params: { repoUrl }, headers: getHeaders() });
    return res.data;
}

export async function fetchFileHistory(repoUrl: string, filePath: string) {
    const res = await axios.get(`${BASE}/file-history`, { params: { repoUrl, filePath }, headers: getHeaders() });
    return res.data;
}

export async function fetchUserAnalyses() {
    const res = await axios.get(`${BASE}/user-analyses`, { headers: getHeaders() });
    return res.data;
}

export async function fetchAnalysis(id: number) {
    const res = await axios.get(`${BASE}/analyses/${id}`, { headers: getHeaders() });
    return res.data;
}

export async function fetchRepoFiles(repoUrl: string) {
    const res = await axios.post(`${BASE}/repo-files`, { repoUrl }, { headers: getHeaders() });
    return res.data;
}

export async function analyzeLocal(clonedDir: string, files: string[]) {
    const res = await axios.post(`${BASE}/analyze-local`, { clonedDir, files }, { headers: getHeaders() });
    return res.data;
}

export async function cleanupClonedRepo(clonedDir: string) {
    await axios.post(`${BASE}/cleanup`, { clonedDir }, { headers: getHeaders() });
}