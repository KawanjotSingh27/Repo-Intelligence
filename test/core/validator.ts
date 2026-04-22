import { getUtil } from "../utils/index";
import { formatName } from "../utils/format";

export function validate(input: string): boolean {
    return getUtil(input).length > 0 && formatName(input) !== "";
}