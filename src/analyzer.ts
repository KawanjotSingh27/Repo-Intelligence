import { getAllFiles, buildGraph, resetGraph, loadPathAliases } from "./graph";
import { buildScore, getCombinedImpact, getCriticalFiles, summarizeImpact, resetScores } from "./scorer";

export type AnalysisResult = {
    summary: ReturnType<typeof summarizeImpact>;
    criticalFiles: ReturnType<typeof getCriticalFiles>;
    combinedImpact: Map<string, number>;
};

export function analyze(dir: string, targetFiles: string[]): AnalysisResult {
    resetGraph();
    resetScores();
    const files=getAllFiles(dir);
    const aliases = loadPathAliases(dir);
    buildGraph(files);
    buildScore(files);
    const combImpact=getCombinedImpact(targetFiles);
    const summ=summarizeImpact(combImpact);
    const critFiles=getCriticalFiles(combImpact);
    return {summary:summ,criticalFiles:critFiles,combinedImpact:combImpact};
}