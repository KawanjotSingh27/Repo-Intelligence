import fs from "fs";
import path from "path";

type FilePath=string;

const dependsOn=new Map<FilePath,Set<FilePath>>();
const dependedBy=new Map<FilePath,Set<FilePath>>();

function extractImports(code:string):string[]{
    const importRegex=/import\s+.*?\s+from\s+["'](.+?)["']/g;
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
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

function resolveImportPath(fromFile: string, importPath: string): FilePath | null {
    const dir = path.dirname(fromFile);
    const resolved = path.resolve(dir, importPath);
    
    // Try with different extensions
    const extensions = ['.ts', '.tsx'];
    
    for (const ext of extensions) {
        const fullPath = resolved + ext;
        if (fs.existsSync(fullPath)) {
            return fullPath;
        }
    }
    
    // Maybe it already has extension
    if (fs.existsSync(resolved)) {
        return resolved;
    }
    
    return null;
}

function buildGraph(files:FilePath[]){
    for(const file of files){
        const data=fs.readFileSync(file,"utf-8");
        const imports=extractImports(data);
        for(const x of imports){
            if(!x.startsWith(".")) continue;
            const resolved=resolveImportPath(file,x)
            if (!resolved) continue;
            if(!dependsOn.has(file)) dependsOn.set(file,new Set());
            dependsOn.get(file)?.add(resolved);
            if(!dependedBy.has(resolved)) dependedBy.set(resolved,new Set());
            dependedBy.get(resolved)?.add(file);
        }
    }
}

function getAffectedFiles(changedFile:FilePath):Set<FilePath>{
    const affected=new Set<FilePath>();
    const queue=[changedFile];
    while(queue.length>0){
        const curr=queue.pop()!;
        const dependents=dependedBy.get(curr);
        if(!dependents) continue;
        for(const file of dependents){
            if(!affected.has(file)){
                affected.add(file);
                queue.push(file);
            }
        }
    }
    return affected;
}

if(require.main==module){
    const folder=process.argv[2];
    const files=getAllFiles(folder);
    buildGraph(files);
    if(process.argv[3]){
        const changedFile=path.resolve(process.argv[3]);
        const affected=getAffectedFiles(changedFile);
        console.log(`If ${changedFile} changes, ${affected.size} files are affected`);
    }
}