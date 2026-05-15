import { Pool } from "pg";
import type { ScoreNode } from "./scorer";

export const pool = new Pool({
    host: "localhost",
    port: 5432,
    database: "repointel",
    user: "repointel_user",
    password: "password123"
});

export async function initDb(): Promise<void> {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            github_id INTEGER UNIQUE NOT NULL,
            username TEXT NOT NULL,
            avatar_url TEXT,
            access_token TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS analyses (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            repo_url TEXT NOT NULL,
            pr_url TEXT,
            analyzed_at TIMESTAMP DEFAULT NOW(),
            direct_dependents INTEGER,
            indirect_dependents INTEGER,
            max_depth INTEGER,
            score FLOAT,
            critical_files JSONB,
            pr_files JSONB
        )
    `);
}

export async function upsertUser(githubId: number, username: string, avatarUrl: string, accessToken: string) {
    const result = await pool.query(
        `INSERT INTO users (github_id, username, avatar_url, access_token)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (github_id) DO UPDATE
         SET username = $2, avatar_url = $3, access_token = $4
         RETURNING *`,
        [githubId, username, avatarUrl, accessToken]
    );
    return result.rows[0];
}

export async function getUserById(id: number) {
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
    return result.rows[0] ?? null;
}

export async function saveAnalysis(
    repoUrl: string,
    prUrl: string | null,
    dir: string,
    summary: { direct: number; indirect: number; maxDepth: number; score: number },
    criticalFiles: ScoreNode[],
    prFiles: string[],
    userId?: number
): Promise<void> {
    const normalizedCritical = criticalFiles.map(f => ({
        ...f,
        path: f.path.replace(dir, "").replace(/^\//, "")
    }));

    await pool.query(
        `INSERT INTO analyses 
        (user_id, repo_url, pr_url, direct_dependents, indirect_dependents, max_depth, score, critical_files, pr_files)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
            userId ?? null,
            repoUrl,
            prUrl,
            summary.direct,
            summary.indirect,
            summary.maxDepth,
            summary.score,
            JSON.stringify(normalizedCritical),
            JSON.stringify(prFiles)
        ]
    );
}

export async function getAnalysisHistory(repoUrl: string): Promise<any[]> {
    const result = await pool.query(
        `SELECT * FROM analyses 
         WHERE repo_url = $1 
         ORDER BY analyzed_at DESC 
         LIMIT 10`,
        [repoUrl]
    );
    return result.rows;
}