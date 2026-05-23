export function getUtil(input: string): string {
    return input.trim();
}

export function getUtilUpper(input: string): string {
    return input.trim().toUpperCase();
}

export function getUtilLength(input: string): number {
    return input.trim().length;
}

export * from "./format"