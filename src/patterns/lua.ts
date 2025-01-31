import { shortenDirection } from "./shorthand";
import { PatternInfo, PatternSignature } from "./types";

export class LuaError extends Error {}

type LuaPatternInfo = PatternInfo & { num?: number; translation: string };

export function generatePatternLua(
    patterns: LuaPatternInfo[],
    numberLiterals: Map<number, PatternSignature>,
): string {
    let luaTable = "{";
    for (let { name, translation, num, direction, pattern } of patterns) {
        // look up number literals if possible
        if (num != null && numberLiterals.has(num)) {
            ({ direction, pattern } = numberLiterals.get(num)!);
        }

        // the actual pattern
        if (pattern != null && direction != null) {
            luaTable += `{startDir="${direction!}",angles="${pattern!}"},`;
        } else {
            throw new LuaError(`Couldn't generate Lua for "${translation}".`);
        }
    }

    luaTable += "}";
    return luaTable;
}