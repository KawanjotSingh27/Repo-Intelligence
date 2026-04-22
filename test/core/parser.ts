import { getUtil } from "../utils/index";
import { formatName } from "../utils/format";

export function parse(input: string): string {
    return formatName(getUtil(input));
}