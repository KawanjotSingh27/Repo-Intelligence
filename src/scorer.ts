import { graph, getAffectedFilesWithDepth, detectCycles } from "./graph";
import { analyzeExports } from "./exports";

type FilePath = string;
export type ScoreNode = {
    path: FilePath;
    score: number;
    valueExports: number;
    typeExports: number;
    isInCycle: boolean;
};

export const scoreMap = new Map<FilePath, ScoreNode>();

export function resetScores(): void {
    scoreMap.clear();
}

export function summarizeImpact(impact: Map<FilePath, number>) {
    let direct = 0;
    let indirect = 0;
    let maxDepth = 0;
    for (const depth of impact.values()) {
        if (depth === 1) direct++;
        else indirect++;
        maxDepth = Math.max(maxDepth, depth);
    }
    const score = computeDepthWeightedScore(impact);
    return { direct, indirect, maxDepth, score };
}

function computeDepthWeightedScore(impact: Map<FilePath, number>): number {
    let score = 0;
    for (const depth of impact.values()) {
        if (depth === 1) score += 3;
        else if (depth === 2) score += 1.5;
        else score += 0.5;
    }
    return score;
}

export function buildScore(files: FilePath[]): void {
    const cycleNodes = detectCycles();

    for (const file of files) {
        const impact = getAffectedFilesWithDepth(file);
        const depthScore = computeDepthWeightedScore(impact);

        const exportInfo = analyzeExports(file);
        const exportScore = (exportInfo.valueExports * 0.5) + (exportInfo.typeExports * 0.2);

        const isInCycle = cycleNodes.has(file);
        const cycleMultiplier = isInCycle ? 2 : 1;

        const finalScore = (depthScore + exportScore) * cycleMultiplier;

        scoreMap.set(file, {
            path: file,
            score: finalScore,
            valueExports: exportInfo.valueExports,
            typeExports: exportInfo.typeExports,
            isInCycle
        });
    }
}

function getAverageScore(): number {
    let total = 0;
    for (const node of scoreMap.values()) {
        total += node.score;
    }
    return total / scoreMap.size;
}

export function getCriticalFiles(impact: Map<FilePath, number>): ScoreNode[] {
    const avg = getAverageScore();
    const threshold = 2 * avg;
    const critical: ScoreNode[] = [];

    for (const file of impact.keys()) {
        const node = scoreMap.get(file);
        if (!node) continue;
        if (node.score > threshold) {
            critical.push(node);
        }
    }

    return critical;
}

export function getCombinedImpact(starts: FilePath[]): Map<FilePath, number> {
    const combined = new Map<FilePath, number>();

    for (const start of starts) {
        const impact = getAffectedFilesWithDepth(start);

        for (const [file, depth] of impact) {
            if (!combined.has(file)) {
                combined.set(file, depth);
            } else {
                const existing = combined.get(file)!;
                if (depth < existing) combined.set(file, depth);
            }
        }
    }

    return combined;
}