import fs from "fs";
import path from "path";

type FilePath = string;
export type FileNode = {
    path: FilePath;
    imports: Set<string>;
    dependents: Set<string>;
};
type PathAliases = {
    [alias: string]: string[];
};

export const graph = new Map<FilePath, FileNode>();

function extractImports(code:string):string[]{
    const importRegex = /import\s+(?:.*?\s+from\s+)?["'](.+?)["']/g;
    const imports:string[]=[];
    let match;
    while(match=importRegex.exec(code)){
        imports.push(match[1]);
    }
    return imports;
}

export function getAllFiles(dir: string): FilePath[] {
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

export function buildGraph(files: FilePath[], aliases: PathAliases = {}): void {
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
            let resolved: string | null = null;

            if (imp.startsWith(".")) {
                resolved = resolveImportPath(file, imp);
            } else {
                resolved = resolveAliasedImport(imp, aliases, "");
            }

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

export function getAffectedFilesWithDepth(start: FilePath): Map<FilePath, number> {
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

export function resetGraph(): void {
    graph.clear();
}

export function loadPathAliases(projectDir: string): PathAliases {
    const tsconfigPath = path.join(projectDir, "tsconfig.json");
    
    if (!fs.existsSync(tsconfigPath)) return {};
    
    try {
        const raw = fs.readFileSync(tsconfigPath, "utf-8");
        const tsconfig = JSON.parse(raw);
        const paths = tsconfig?.compilerOptions?.paths;
        const baseUrl = tsconfig?.compilerOptions?.baseUrl ?? ".";
        
        if (!paths) return {};
        return { __baseUrl: [path.resolve(projectDir, baseUrl)], ...paths };
    } catch {
        return {};
    }
}

function resolveAliasedImport(
    importPath: string,
    aliases: PathAliases,
    projectDir: string
): string | null {
    const baseUrl = aliases.__baseUrl?.[0] ?? projectDir;

    const baseResolved = resolveImportPath(baseUrl + "/index.ts", "./" + importPath);
    if (baseResolved) return baseResolved;

    for (const [alias, targets] of Object.entries(aliases)) {
        if (alias === "__baseUrl") continue;

        const aliasRegex = new RegExp("^" + alias.replace("*", "(.*)") + "$");
        const match = importPath.match(aliasRegex);

        if (!match) continue;

        for (const target of targets) {
            const resolvedTarget = target.replace("*", match[1] ?? "");
            const fullPath = path.resolve(baseUrl, resolvedTarget);
            const resolved = resolveImportPath(fullPath + "/index.ts", ".");
            if (resolved) return resolved;

            const direct = resolveImportPath(baseUrl + "/index.ts", "./" + resolvedTarget);
            if (direct) return direct;
        }
    }

    return null;
}

export function detectCycles(): Set<FilePath> {
    const visited = new Set<FilePath>();
    const inStack = new Set<FilePath>();
    const cycleNodes = new Set<FilePath>();

    function dfs(file: FilePath) {
        visited.add(file);
        inStack.add(file);

        const node = graph.get(file);
        if (!node) return;

        for (const imp of node.imports) {
            if (!visited.has(imp)) {
                dfs(imp);
            } else if (inStack.has(imp)) {
                cycleNodes.add(imp);
                cycleNodes.add(file);
            }
        }

        inStack.delete(file);
    }

    for (const file of graph.keys()) {
        if (!visited.has(file)) {
            dfs(file);
        }
    }

    return cycleNodes;
}