import { parseVal } from "./parsers.mts";
import { type Expr } from "./query-parser.mts";
import { Val } from "./val.mts";

type Fact = { id: string; k: string; v: string };
type Car = { k: string; v: string }[];

export const calc = (car: Car, expr: Expr): Val[] => {
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
