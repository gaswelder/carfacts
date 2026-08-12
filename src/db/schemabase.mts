import { Val } from "./val.mts";

export type enumvars = { canonical: string; aliases: string[] };

export const unitless = (fixed?: number) => (val: string) =>
  matchNumber(val, fixed);

export const oneof = (options: (string | enumvars)[]) => (val: string) =>
  matchOneOf(val, options);

/**
 * Matches one of possible unit values,
 * when different units are acceptable in general case.
 */
export const unit =
  (
    units: (string | enumvars)[],
    params: Partial<{
      //   aliases: Record<string, string>;
      defaults: {
        unit: string;
        min?: number;
        max?: number;
      }[];
    }>,
  ) =>
  (s: string) => {
    const x = Val.parse(s);
    if (x.unit == "" && params.defaults) {
      for (const def of params.defaults) {
        if (def.min !== undefined && x.val < def.min) {
          continue;
        }
        if (def.max !== undefined && x.val > def.max) {
          continue;
        }
        x.unit = def.unit;
        break;
      }
    }
    let unitok = false;
    for (const u of units) {
      if (typeof u == "string") {
        if (x.unit == u) {
          unitok = true;
          break;
        }
      }
      if (typeof u == "object") {
        if (u.aliases.includes(x.unit)) {
          x.unit = u.canonical;
          unitok = true;
          break;
        }
      }
    }
    if (unitok) {
      return { val: x.format() };
    }
  };

/**
 * Matches a number, optionally formatting it to fixed digits.
 */
const matchNumber = (val: string, fixed?: number) => {
  const n = parseFloat(val);
  if (fixed !== undefined) {
    return { val: n.toFixed(fixed) };
  }
  return { val: n.toString() };
};

/**
 * Matches one of the given strings, case-insensitive.
 */
const matchOneOf = (val: string, options: (string | enumvars)[]) => {
  for (const opt of options) {
    const vars = typeof opt == "string" ? { canonical: opt, aliases: [] } : opt;
    for (const s of [vars.canonical, ...vars.aliases]) {
      if (s.toLowerCase() == val.toLowerCase()) {
        return { val: vars.canonical };
      }
    }
  }
};
