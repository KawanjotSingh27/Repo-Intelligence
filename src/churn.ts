import { execSync } from "child_process";
import path from "path";

export type ChurnData = {
    [filePath: string]: number;
};

export function getChurnData(repoDir: string, files: string[], commitLimit: number = 50): ChurnData {
    const churn: ChurnData = {};

    for (const file of files) {
        const relativePath = file.replace(repoDir + "/", "");
        try {
            const output = execSync(
                `git log --oneline -${commitLimit} -- "${relativePath}"`,
                { cwd: repoDir, encoding: "utf-8" }
            );
            const commitCount = output.trim().split("\n").filter(Boolean).length;
            churn[file] = commitCount;
        } catch {
            churn[file] = 0;
        }
    }

    return churn;
}

export function normalizeChurn(churn: ChurnData): ChurnData {
    const values = Object.values(churn);
    const max = Math.max(...values, 1);

    const normalized: ChurnData = {};
    for (const [file, count] of Object.entries(churn)) {
        normalized[file] = count / max;
    }
    return normalized;
}