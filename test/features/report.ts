import { parse } from "../core/parser";
import { getUtil } from "../utils/index";

export function generateReport(input: string): string {
    return `Report: ${parse(getUtil(input))}`;
}