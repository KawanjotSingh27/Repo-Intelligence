import { parse } from "../core/parser";
import { validate } from "../core/validator";

export function analyze(input: string): string {
    return `${parse(input)} valid: ${validate(input)}`;
}