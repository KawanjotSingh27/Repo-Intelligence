import { getUtil } from "./index";

export function formatName(input: string): string {
    return getUtil(input).toUpperCase();
}

export function formatLower(input: string): string {
    return input.toLowerCase();
}