import { generateReport } from "../features/report";
import { exportData } from "../features/export";

export function handle(input: string): string {
    return `${generateReport(input)} | ${exportData(input)}`;
}