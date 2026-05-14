import { getAllFiles, buildGraph, resetGraph, loadPathAliases, graph, getAffectedFilesWithDepth } from "./graph";
import { buildScore, getCombinedImpact, getCriticalFiles, summarizeImpact, resetScores } from "./scorer";

export type AnalysisResult = {
    summary: ReturnType<typeof summarizeImpact>;
    criticalFiles: ReturnType<typeof getCriticalFiles>;
    combinedImpact: Map<string, number>;
};

export function analyze(dir: string, targetFiles: string[]): AnalysisResult {
    resetGraph();
    resetScores();
    const files = getAllFiles(dir);
    const aliases = loadPathAliases(dir);
    buildGraph(files, aliases);

    const relevantFiles = new Set<string>();
    for (const target of targetFiles) {
        relevantFiles.add(target);
        const impact = getAffectedFilesWithDepth(target);
        for (const file of impact.keys()) {
            relevantFiles.add(file);
        }
        const node = graph.get(target);
        if (node) {
            for (const imp of node.imports) {
                relevantFiles.add(imp);
            }
        }
    }

    buildScore(files, relevantFiles);
    const combImpact = getCombinedImpact(targetFiles);
    const summ = summarizeImpact(combImpact);
    const critFiles = getCriticalFiles(combImpact);
    return { summary: summ, criticalFiles: critFiles, combinedImpact: combImpact };
}