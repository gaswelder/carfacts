import * as fs from "fs";
import { calc } from "./query-exec.mts";
import { parseExpr, type Expr } from "./query-parser.mts";

type Fact = { id: string; k: string; v: string };
type Car = { k: string; v: string }[];

export const formatFact = (f: Fact) => [f.id, f.k, f.v].join(" | ");

export const parseFact = (s: string) => {
  const cols = s.split("|").map((c) => c.trim());
  if (cols.length != 3) {
    throw new Error("malformed fact: " + s);
  }
  return { id: cols[0], k: cols[1], v: cols[2] };
};

export const groupFacts = (ff: Fact[], kk: string[]) => {
  // Collect facts
  const map = new Map<string, Car>();
  for (const t of ff) {
    const list = map.get(t.id);
    if (list) {
      list.push(t);
    } else {
      map.set(t.id, [t]);
    }
  }

  // Order the facts according to the provided params list.
  const order = new Map();
  kk.forEach((k, i) => {
    order.set(k, i);
  });
  const ee = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [id, entries] of ee) {
    entries.sort((a, b) => order.get(a.k) - order.get(b.k));
  }
  return new Map(ee);
};

export const loadDb = (path: string, params: string[]) => {
  const tuples = fs
    .readFileSync(path)
    .toString()
    .split("\n")
    .filter((x) => x != "")
    .map(parseFact);
  const cars = groupFacts(tuples, params);

  const cache = new Map<string, Expr>();

  const parseExprCached = (s: string) => {
    const cached = cache.get(s);
    if (cached) {
      return cached;
    }
    const parsed = parseExpr(s);
    if (!parsed) {
      throw new Error("no query");
    }
    cache.set(s, parsed);
    return parsed;
  };

  return {
    /**
     * Runs query q on the given car.
     */
    query(car: Car, q: string) {
      return calc(car, parseExprCached(q));
    },
    /**
     * Returns an iterator for the entries.
     */
    *entries(q?: string) {
      const ql = q?.toLowerCase();
      for (const [id, car] of cars.entries()) {
        if (ql && !id.toLowerCase().includes(ql)) {
          continue;
        }
        yield { id, car };
      }
    },
  };
};
