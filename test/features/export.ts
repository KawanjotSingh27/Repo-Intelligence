import { validate } from "../core/validator";

export function exportData(input: string): string {
    return validate(input) ? `Exported: ${input}` : "Invalid";
}