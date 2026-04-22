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
    .description("Analyze a directory")
    .option("-f, --files <files...>", "target files to analyze impact for")
    .action((dir: string, options: { files: string[] }) => {
        const dirAbs=path.resolve(dir);
        const filesAbs=options.files.map((option)=>{
            return path.resolve(option);
        })

        const analysis=analyze(dirAbs,filesAbs);

        console.log(chalk.bold("Summary:"));
        console.log(` Direct dependents: ${analysis.summary.direct}`);
        console.log(` Indirect dependents: ${analysis.summary.indirect}`);
        console.log(` Max depth: ${analysis.summary.maxDepth}`);
        console.log(` Score: ${analysis.summary.score}`);

        console.log(chalk.bold("Critical Files: "));
        for(const critFile of analysis.criticalFiles){
            console.log(chalk.red(` ${critFile.path}  (${critFile.score.toFixed(2)})`));
        }
    });

program.parse();