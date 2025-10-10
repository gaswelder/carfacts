import * as fs from "fs";
import { parseVal } from "./parsers.mts";
import { Val } from "./val.mts";
import { reader } from "./reader.mjs";

type Fact = { id: string; k: string; v: string };
type Car = { k: string; v: string }[];

export const parseFact = (line: string) => {
  const cols = line.split("|").map((x) => x.trim());
  if (cols.length != 3) {
    throw new Error("invalid tuple: " + line);
  }
  return { id: cols[0], k: cols[1], v: cols[2] };
};

export const formatFact = (f: Fact) => [f.id, f.k, f.v].join(" | ");

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

  type Expr =
    | { type: "/"; a: Expr; b: Expr }
    | { type: "*"; a: Expr; b: Expr }
    | { type: "name"; val: string }
    | { type: "convert"; unit: string; val: string };

  const readAtom = (r): Expr | null => {
    const id = r.id();
    if (!id) return null;
    r.spaces();
    if (r.pop(".")) {
      let unit = r.id();
      if (r.pop(".")) unit += ".";
      r.spaces();
      return { type: "convert", val: id, unit };
    }
    return { type: "name", val: id };
  };

  const readLevel1 = (r): Expr | null => {
    const a = readAtom(r);
    if (!a) return null;
    if (r.pop("/")) {
      r.spaces();
      const b = readLevel1(r);
      r.spaces();
      if (!b) throw new Error("expected somethinf after /");
      return { type: "/", a, b };
    }
    if (r.pop("*")) {
      r.spaces();
      const b = readLevel1(r);
      r.spaces();
      if (!b) throw new Error("expected somethinf after *");
      return { type: "*", a, b };
    }
    return a;
  };

  const parse_ = (s: string): Expr | null => {
    const r = reader(s);
    r.spaces();
    const e = readLevel1(r);
    r.spaces();
    if (r.more()) {
      throw new Error("failed to parse: " + r.rest());
    }
    return e;
  };

  const cache = {} as Record<string, Expr>;

  const parseExpr = (s: string) => {
    if (s in cache) return cache[s];
    const e = parse_(s);
    if (!e) {
      throw new Error("failed to parse: " + s);
    }
    cache[s] = e;
    return e;
  };

  const calc = (car: Car, expr: Expr): Val[] => {
    switch (expr.type) {
      case "/": {
        let r = calc(car, expr.a);
        const by = calc(car, expr.b);
        r = r.flatMap((x) => by.map((y) => x.div(y)));
        return r;
      }
      case "*": {
        let r = calc(car, expr.a);
        const by = calc(car, expr.b);
        r = r.flatMap((x) => by.map((y) => x.mul(y)));
        return r;
      }
      case "convert": {
        const val = calc(car, { type: "name", val: expr.val });

        // power.hp returns hp units.
        // power.hp. converts to hp and drops units (useful for plotting).
        let u = expr.unit;
        let drop = false;
        if (expr.unit.endsWith(".")) {
          u = u.substring(0, u.length - 1);
          drop = true;
        }
        const result = val.map((x) => x.to(u));
        if (drop) {
          result.forEach((val) => {
            val.unit = "";
            val.condition = "";
          });
        }
        return result;
      }
      case "name": {
        const k = expr.val.toLowerCase();
        return car
          .filter((entry) => entry.k.toLowerCase() == k)
          .map((entry) => parseVal(entry.v));
      }
    }
    throw new Error("unimplemented expression node");
  };

  return {
    /**
     * Runs query q on the given car.
     */
    query(car: Car, q: string) {
      return calc(car, parseExpr(q));
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
