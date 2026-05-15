import jwt from "jsonwebtoken";
import { upsertUser, getUserById } from "./db";

const JWT_SECRET = process.env.JWT_SECRET!;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;

export function getGithubAuthUrl(): string {
    const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        scope: "read:user"
    });
    return `https://github.com/login/oauth/authorize?${params}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
    const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code
        })
    });
    const data = await response.json() as { access_token: string };
    return data.access_token;
}

export async function getGithubUser(accessToken: string) {
    const response = await fetch("https://api.github.com/user", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json"
        }
    });
    return response.json() as Promise<{ id: number; login: string; avatar_url: string }>;
}

export function createJWT(userId: number): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyJWT(token: string): { userId: number } | null {
    try {
        return jwt.verify(token, JWT_SECRET) as { userId: number };
    } catch {
        return null;
    }
}

export async function handleOAuthCallback(code: string) {
    const accessToken = await exchangeCodeForToken(code);
    const githubUser = await getGithubUser(accessToken);
    const user = await upsertUser(
        githubUser.id,
        githubUser.login,
        githubUser.avatar_url,
        accessToken
    );
    const token = createJWT(user.id);
    return { token, user };
}