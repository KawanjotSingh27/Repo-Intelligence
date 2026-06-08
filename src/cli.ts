#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import path from "path";
import { analyze } from "./analyzer";

const program = new Command();

program
    .name("repointel")
    .description("Analyze impact of changes in a TypeScript project")
    .version("1.0.0");

program
    .command("analyze <dir>")
    .description("Analyze impact of changed files in a directory")
    .option("-f, --files <files...>", "target files to analyze impact for")
    .option("-t, --threshold <number>", "exit with code 1 if score exceeds this value")
    .option("--format <format>", "output format: text or json", "text")
    .action((dir: string, options: { files: string[]; threshold?: string; format: string }) => {
        if (!options.files || options.files.length === 0) {
            console.error(chalk.red("Error: at least one file is required (use --files)"));
            process.exit(1);
        }

        const dirAbs = path.resolve(dir);
        const filesAbs = options.files.map(f => path.resolve(f));

        try {
            const result = analyze(dirAbs, filesAbs);

            if (options.format === "json") {
                console.log(JSON.stringify({
                    summary: result.summary,
                    criticalFiles: result.criticalFiles,
                    combinedImpact: Object.fromEntries(result.combinedImpact)
                }, null, 2));
            } else {
                printTextReport(result, dirAbs);
            }

            if (options.threshold) {
                const threshold = parseFloat(options.threshold);
                if (result.summary.score > threshold) {
                    console.log(chalk.red(`\nScore ${result.summary.score.toFixed(2)} exceeds threshold ${threshold} — exiting with code 1`));
                    process.exit(1);
                }
            }
        } catch (err) {
            console.error(chalk.red("Analysis failed:"), err);
            process.exit(1);
        }
    });

function getRiskLevel(score: number): string {
    if (score > 15) return "CRITICAL";
    if (score > 8) return "HIGH";
    if (score > 4) return "MEDIUM";
    return "LOW";
}

function getRiskColor(level: string) {
    switch (level) {
        case "CRITICAL": return chalk.red.bold;
        case "HIGH": return chalk.red;
        case "MEDIUM": return chalk.yellow;
        default: return chalk.green;
    }
}

function printTextReport(result: ReturnType<typeof analyze>, dir: string) {
    const { summary, criticalFiles, combinedImpact } = result;
    const riskLevel = getRiskLevel(summary.score);
    const colorFn = getRiskColor(riskLevel);

    console.log("\n" + chalk.bold("RepoIntel Analysis"));
    console.log("─".repeat(40));

    console.log(chalk.bold("\nRisk Level:  ") + colorFn(riskLevel));
    console.log(chalk.bold("Score:       ") + summary.score.toFixed(2));

    console.log(chalk.bold("\nBlast Radius:"));
    console.log(`  Direct dependents:   ${summary.direct}`);
    console.log(`  Indirect dependents: ${summary.indirect}`);
    console.log(`  Max depth:           ${summary.maxDepth}`);

    if (criticalFiles.length > 0) {
        console.log(chalk.bold("\nCritical Files:"));
        for (const f of criticalFiles) {
            const name = f.path.replace(dir + "/", "");
            const cycle = f.isInCycle ? chalk.yellow(" ↻ circular") : "";
            console.log(`  ${chalk.red("⚠")} ${name} ${chalk.gray(`(score: ${f.score.toFixed(2)}, exports: ${f.valueExports})`)}${cycle}`);
        }
    } else {
        console.log(chalk.bold("\nCritical Files: ") + chalk.green("None detected"));
    }

    console.log(chalk.bold("\nImpacted Files:"));
    const byDepth = new Map<number, string[]>();
    for (const [file, depth] of combinedImpact) {
        const name = file.replace(dir + "/", "");
        if (!byDepth.has(depth)) byDepth.set(depth, []);
        byDepth.get(depth)!.push(name);
    }
    for (const [depth, files] of [...byDepth.entries()].sort()) {
        console.log(`  ${chalk.gray(`depth ${depth}:`)} ${files.join(", ")}`);
    }

    console.log("");
}

program.parse();