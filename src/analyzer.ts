import { getAllFiles, buildGraph } from "./graph";
import { buildScore, getCombinedImpact, getCriticalFiles, summarizeImpact } from "./scorer";

export type AnalysisResult = {
    summary: ReturnType<typeof summarizeImpact>;
    criticalFiles: ReturnType<typeof getCriticalFiles>;
    combinedImpact: Map<string, number>;
};

export function analyze(dir: string, targetFiles: string[]): AnalysisResult {
    const files=getAllFiles(dir);
    buildGraph(files);
    buildScore(files);
    const combImpact=getCombinedImpact(targetFiles);
    const summ=summarizeImpact(combImpact);
    const critFiles=getCriticalFiles(combImpact);
    return {summary:summ,criticalFiles:critFiles,combinedImpact:combImpact};
}