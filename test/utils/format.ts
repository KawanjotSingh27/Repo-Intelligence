import { getUtil } from "./index";

export function formatName(input: string): string {
    return getUtil(input).toUpperCase();
}