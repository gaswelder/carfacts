import * as fs from "fs";
import { calc } from "./query-exec.mts";
import { parseExpr, type Expr } from "./query-parser.mts";
import { getParam } from "./schema.mts";

/**
 * A single atomic fact.
 */
type Fact = { id: string; k: string; v: string };

/**
 * Facts grouped by entity id.
 */
type FactGroup = { k: string; v: string }[];

const groupFacts = (ff: Fact[], kk: string[]) => {
  const map = new Map<string, FactGroup>();
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
  //
  // Load the facts.
  //
  const facts = fs
    .readFileSync(path)
    .toString()
    .split("\n")
    .filter((x) => x != "")
    .map((s) => {
      const cols = s.split("|").map((c) => c.trim());
      if (cols.length != 3) {
        throw new Error("malformed fact");
      }
      return { id: cols[0], k: cols[1], v: cols[2] };
    });

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
    query(car: FactGroup, q: string) {
      return calc(car, parseExprCached(q));
    },
    /**
     * Returns an iterator for the entries.
     */
    *entries(q?: string) {
      const ql = q?.toLowerCase();
      const cars = groupFacts(facts, params);
      for (const [id, car] of cars.entries()) {
        if (ql && !id.toLowerCase().includes(ql)) {
          continue;
        }
        yield { id, car };
      }
    },
    /**
     * Inserts a fact.
     */
    insert(f: Fact) {
      const param = getParam(f.k);
      if (!param) {
        throw new Error("unknown param: " + f.k);
      }
      if (!f.id.match(/^\d\d\d\d /)) {
        throw new Error("missing year");
      }
      const norm = param.v(f.v);
      if (!norm || !("val" in norm)) {
        throw new Error("failed to parse value for " + param.k);
      }
      facts.push({ id: f.id, k: param.k, v: norm.val.toString() });
    },
    /**
     * Writes the database out.
     */
    async save(path: string) {
      const out = fs.createWriteStream(path);
      facts.sort((a, b) => {
        let byid = a.id.localeCompare(b.id);
        if (byid) {
          return byid;
        }
        return params.indexOf(a.k) - params.indexOf(b.k);
      });
      for (const f of facts) {
        out.write([f.id, f.k, f.v].join(" | ") + "\n");
      }
      await new Promise<void>((ok, fail) => {
        out.close((err) => {
          if (err) fail(err);
          else ok();
        });
      });
    },
  };
};
