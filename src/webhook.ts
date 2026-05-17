import { Webhooks } from "@octokit/webhooks";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { analyze } from "./analyzer";
import { getAllFiles } from "./graph";
import { cloneRepo, cleanupRepo } from "./github";
import path from "path";

const webhooks = new Webhooks({
    secret: process.env.GITHUB_WEBHOOK_SECRET!
});

async function getInstallationOctokit(installationId: number) {
    const auth = createAppAuth({
        appId: process.env.GITHUB_APP_ID!,
        privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
        installationId
    });
    const { token } = await auth({ type: "installation" });
    return new Octokit({ auth: token });
}

async function getPRChangedFiles(octokit: Octokit, owner: string, repo: string, prNumber: number): Promise<string[]> {
    const { data } = await octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber
    });
    return data.map(f => f.filename);
}

async function postComment(octokit: Octokit, owner: string, repo: string, prNumber: number, body: string) {
    await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body
    });
}

function formatComment(
    summary: { direct: number; indirect: number; maxDepth: number; score: number },
    criticalFiles: { path: string; score: number; isInCycle: boolean }[],
    changedFiles: string[]
): string {
    const riskLevel = summary.score > 15 ? "🔴 CRITICAL"
        : summary.score > 8 ? "🟠 HIGH"
        : summary.score > 4 ? "🟡 MEDIUM"
        : "🟢 LOW";

    const criticalSection = criticalFiles.length === 0
        ? "_None detected_"
        : criticalFiles.map(f =>
            `- \`${f.path.split("/").pop()}\` — score: ${f.score.toFixed(2)}${f.isInCycle ? " _(circular dependency)_" : ""}`
        ).join("\n");

    return `## RepoIntel Risk Analysis

**Risk Level:** ${riskLevel}
**Score:** ${summary.score.toFixed(2)}
**Changed Files:** ${changedFiles.map(f => `\`${f.split("/").pop()}\``).join(", ")}

### Blast Radius
| Metric | Value |
|--------|-------|
| Direct dependents | ${summary.direct} |
| Indirect dependents | ${summary.indirect} |
| Max depth | ${summary.maxDepth} |

### Critical Dependencies
${criticalSection}

### Recommendation
${criticalFiles.length === 0
    ? "✅ Low risk change. Standard review process applies."
    : `⚠️ This PR touches high-impact files. Request review from engineers familiar with ${criticalFiles.map(f => `\`${f.path.split("/").pop()}\``).join(", ")} before merging.`
}

---
_Analyzed by [RepoIntel](https://repo-intelligence-gamma.vercel.app)_`;
}

webhooks.on("pull_request.opened", async ({ payload }) => {
    const { repository, pull_request, installation } = payload;
    if (!installation) return;

    const owner = repository.owner.login;
    const repo = repository.name;
    const prNumber = pull_request.number;
    const cloneUrl = repository.clone_url;

    let dir: string | null = null;
    try {
        const octokit = await getInstallationOctokit(installation.id);
        const [prFiles, clonedDir] = await Promise.all([
            getPRChangedFiles(octokit, owner, repo, prNumber),
            cloneRepo(cloneUrl)
        ]);
        dir = clonedDir;

        const filesAbs = prFiles.map(f => path.resolve(dir!, f));
        const result = analyze(dir, filesAbs);

        const comment = formatComment(result.summary, result.criticalFiles, prFiles);
        await postComment(octokit, owner, repo, prNumber, comment);
    } catch (err) {
        console.error("Webhook handler error:", err);
    } finally {
        if (dir) cleanupRepo(dir);
    }
});

export { webhooks };