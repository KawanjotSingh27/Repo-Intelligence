import fs from "fs";
import path from "path";

type FilePath=string;
type FileNode={
    path:FilePath;
    imports:Set<string>;
    dependents:Set<string>,
    depth?:number;
};
type ScoreNode={
    path:FilePath;
    score:number;
    direct:number;
    indirect:number;
    maxDepth:number;
};

const graph=new Map<FilePath,FileNode>();
const score=new Map<FilePath,ScoreNode>();

function extractImports(code:string):string[]{
    const importRegex = /import\s+(?:.*?\s+from\s+)?["'](.+?)["']/g;
    const imports:string[]=[];
    let match;
    while(match=importRegex.exec(code)){
        imports.push(match[1]);
    }
    return imports;
}

function getAllFiles(dir: string): FilePath[] {
  const files: FilePath[] = [];
  
  function walk(currentDir: string) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (item === 'node_modules' || item === '.git' || item === 'dist') {
          continue;
        }
        walk(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(path.resolve(fullPath));
      }
    }
  }
  
  walk(dir);
  return files;
}

function resolveImportPath(fromFile: string, importPath: string): FilePath | null {
    const dir = path.dirname(fromFile);
    const basePath = path.resolve(dir, importPath);

    const extensions = [".ts", ".tsx"];

    if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
        return path.resolve(basePath);
    }

    for (const ext of extensions) {
        const fullPath = basePath + ext;
        if (fs.existsSync(fullPath)) {
            return path.resolve(fullPath);
        }
    }

    if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
        for (const ext of extensions) {
            const indexPath = path.join(basePath, "index" + ext);
            if (fs.existsSync(indexPath)) {
                return path.resolve(indexPath);
            }
        }
    }

    return null;
}

function buildScore(files:FilePath[]){
    for(const file of files){
        const impact=getAffectedFilesWithDepth(file);
        const summary=summarizeImpact(impact);
        score.set(file,{
            path:file,
            score:summary.score,
            direct:summary.direct,
            indirect:summary.indirect,
            maxDepth:summary.maxDepth
        });
    }
}

function buildGraph(files: FilePath[]) {
    for (const file of files) {
        graph.set(file, {
            path: file,
            imports: new Set(),
            dependents: new Set()
        });
    }
    for (const file of files) {
        const data = fs.readFileSync(file, "utf-8");
        const imports = extractImports(data);

        for (const imp of imports) {
            if (!imp.startsWith(".")) continue;

            const resolved = resolveImportPath(file, imp);
            if (!resolved) continue;

            graph.get(file)?.imports.add(resolved);

            if (!graph.has(resolved)) {
                graph.set(resolved, {
                    path: resolved,
                    imports: new Set(),
                    dependents: new Set()
                });
            }

            graph.get(resolved)?.dependents.add(file);
        }
    }
}

function getAffectedFilesWithDepth(start: FilePath): Map<FilePath, number> {
    const result = new Map<FilePath, number>();
    const queue: [FilePath, number][] = [[start, 0]];

    while (queue.length > 0) {
        const [curr, depth] = queue.shift()!;

        const node = graph.get(curr);
        if (!node) continue;

        for (const dependent of node.dependents) {
            if (!result.has(dependent)) {
                result.set(dependent, depth + 1);
                queue.push([dependent, depth + 1]);
            }
        }
    }

    return result;
}

function summarizeImpact(impact:Map<FilePath,number>){
    let direct=0;
    let indirect=0;
    let maxDepth=0;
    let score=impact.size;
    for(const depth of impact.values()){
        if(depth==1) direct++;
        else indirect++;
        maxDepth=Math.max(maxDepth,depth);
    }
    return {direct,indirect,maxDepth,score};
}

function computeRisk(impact:Map<FilePath,number>):number{
    let score=0;
    for(const depth of impact.values()){
        score+=1/depth;
    }
    return score;
}

if (require.main == module) {
    const files = getAllFiles("./test");
    buildGraph(files);
    buildScore(files);

    console.log(score);

    const start = path.resolve("./test/utils/index.ts");
    const impact = getAffectedFilesWithDepth(start);
    const risk=computeRisk(impact);
    const summary=summarizeImpact(impact);
    
    console.log("Summary:",summary);
    console.log("Risk Score:", risk.toFixed(2));
}