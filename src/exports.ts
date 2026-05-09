import fs from "fs";

type ExportInfo = {
    valueExports: number;
    typeExports: number;
    totalExports: number;
};

export function analyzeExports(filePath: string): ExportInfo {
    const code = fs.readFileSync(filePath, "utf-8");
    
    const valueExportRegex = /^export\s+(?!type\s)(?:default\s+)?(?:function|const|let|var|class|enum)\s+/gm;
    
    const typeExportRegex = /^export\s+(?:type|interface)\s+/gm;
    
    const namedExportRegex = /^export\s+\{([^}]+)\}/gm;
    
    let valueExports = (code.match(valueExportRegex) ?? []).length;
    const typeExports = (code.match(typeExportRegex) ?? []).length;
    
    let match;
    while ((match = namedExportRegex.exec(code)) !== null) {
        const names = match[1].split(",");
        valueExports += names.filter(n => !n.trim().startsWith("type ")).length;
    }
    
    return {
        valueExports,
        typeExports,
        totalExports: valueExports + typeExports
    };
}