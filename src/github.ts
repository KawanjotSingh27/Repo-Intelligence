import simpleGit from "simple-git";
import path from "path";
import fs from "fs";
import os from "os";

export async function cloneRepo(repoUrl: string): Promise<string> {
    const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),"repointel-"));
    await simpleGit().clone(repoUrl,tempDir);
    return tempDir;
}

export function cleanupRepo(dir: string): void {
    fs.rmSync(dir, { recursive: true, force: true });
}

export function extractRepoUrl(prUrl: string): string {
    const match = prUrl.match(/github\.com\/(.+?)\/(.+?)\/pull/);
    if (!match) throw new Error("Invalid PR URL");
    return `https://github.com/${match[1]}/${match[2]}`;
}

export async function getPRFiles(prUrl: string): Promise<string[]> {
    const match = prUrl.match(/github\.com\/(.+?)\/(.+?)\/pull\/(\d+)/);
    if (!match) throw new Error("Invalid PR URL");

    const [, owner, repo, prNumber] = match;

    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
        { headers: { Accept: "application/vnd.github.v3+json" } }
    );

    const data = await response.json() as { filename: string }[];
    return data.map(f => f.filename);
}