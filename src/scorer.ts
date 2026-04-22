import { graph, getAffectedFilesWithDepth } from "./graph";

type FilePath = string;
export type ScoreNode = {
    path: FilePath;
    score: number;
};

export const scoreMap = new Map<FilePath, ScoreNode>();

export function summarizeImpact(impact:Map<FilePath,number>){
    let direct=0;
    let indirect=0;
    let maxDepth=0;
    let score=0;
    for(const depth of impact.values()){
        if(depth==1) direct++;
        else indirect++;
        maxDepth=Math.max(maxDepth,depth);
        if(depth>0) score+=1/depth;
    }
    return {direct,indirect,maxDepth,score};
}

export function buildScore(files: FilePath[]) {
    for (const file of files) {
        const impact = getAffectedFilesWithDepth(file);
        const summary = summarizeImpact(impact);

        scoreMap.set(file, {
            path: file,
            score: summary.score
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

export function getCriticalFiles(
    impact: Map<FilePath, number>
): ScoreNode[] {

    const avg = getAverageScore();
    const threshold = 2 * avg;

    const critical: ScoreNode[] = [];

    for (const file of impact.keys()) {
        const node = scoreMap.get(file);
        if (!node) continue;

        if (node.score > threshold) {
            critical.push({
                path: file,
                score: node.score
            });
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
                if (depth < existing) {
                    combined.set(file, depth);
                }
            }
        }
    }

    return combined;
}