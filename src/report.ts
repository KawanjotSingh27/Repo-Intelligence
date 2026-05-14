type ReportInput = {
    repoUrl: string;
    prUrl: string;
    prFiles: string[];
    summary: {
        direct: number;
        indirect: number;
        maxDepth: number;
        score: number;
    };
    criticalFiles: {
        path: string;
        score: number;
        valueExports: number;
        typeExports: number;
        isInCycle: boolean;
    }[];
};

export function generateReport(input: ReportInput): string {
    const { repoUrl, prUrl, prFiles, summary, criticalFiles } = input;

    const prNumber = prUrl.split("/").pop();
    const repoName = repoUrl.replace("https://github.com/", "");

    const riskLevel = summary.score > 15
        ? "CRITICAL"
        : summary.score > 8
        ? "HIGH"
        : summary.score > 4
        ? "MEDIUM"
        : "LOW";

    const changedFileNames = prFiles.map(f => f.split("/").pop()).join(", ");

    const criticalSection = criticalFiles.length === 0
        ? "  None detected"
        : criticalFiles.map(f =>
            `  ⚠ ${f.path.split("/").pop()} (score: ${f.score.toFixed(2)}, exports: ${f.valueExports}, in cycle: ${f.isInCycle ? "yes" : "no"})`
        ).join("\n");

    const recommendation = criticalFiles.length === 0
        ? "  Low risk change. Standard review process applies."
        : `  This PR touches a high-impact file. Request review from\n  engineers familiar with ${criticalFiles.map(f => f.path.split("/").pop()).join(", ")} before merging.`;

    return `
PR Risk Report — ${repoName} #${prNumber}
${"─".repeat(50)}
Risk Level:     ${riskLevel}
Score:          ${summary.score.toFixed(2)}
Changed Files:  ${changedFileNames}

Blast Radius:   ${summary.direct + summary.indirect} files affected
  Direct:       ${summary.direct} files
  Indirect:     ${summary.indirect} files
  Max Depth:    ${summary.maxDepth} levels

Critical Dependencies:
${criticalSection}

Recommendation:
${recommendation}
`.trim();
}