export class Val {
  public val: number;
  public unit: string;
  public condition = "";

  constructor(val: number, unit: string, condition?: string) {
    this.val = val;
    this.unit = unit;
    if (condition) this.condition = condition;
  }
  format(fixed?: number) {
    let s = "";
    if (fixed) {
      s = this.val.toFixed(fixed);
    } else {
      s = this.val.toString();
      const [a, frac] = s.split(".");
      if (frac && frac.length > 5) {
        s = a + "." + frac.substring(0, 3);
      }
    }

    if (this.unit != "") {
      s += " " + this.unit;
    }
    if (this.condition != "") {
      s += " @ " + this.condition;
    }
    return s;
  }
  to(toUnit: string) {
    const val = this.val;
    if (toUnit == this.unit) {
      return this;
    }
    const sig = this.unit + "->" + toUnit;

    const map = {
      "bhp->hp": 1,
      "cc->l": 1 / 1000,
      "cin->cc": 2.54 ** 3,
      "cin->l": 2.54 ** 3 / 1000,
      "in->cm": 2.54,
      "mm->m": 1 / 1000,
      "in->m": 2.54 / 100,
      "kW->hp": 1.36,
      "kWt->hp": 1.36,
      "L->cc": 1000,
      "L->l": 1,
      "lbs->kg": 1 / 0.45359237,
      "mm->cm": 1 / 10,
      "mph->kmph": 1.609,
      "t->kg": 1000,
    };
    const r = map[sig];
    if (!r) throw new Error("unimplemented conversion: " + sig);
    return new Val(val * r, toUnit, this.condition);
  }
  div(b: Val) {
    if (b.condition && this.condition && this.condition != b.condition) {
      throw new Error("values with different conditions");
    }
    return new Val(
      this.val / b.val,
      combineUnits(this.unit, b.unit, "/"),
      this.condition || b.condition
    );
  }
  mul(b: Val) {
    if (b.condition && this.condition && this.condition != b.condition) {
      throw new Error("values with different conditions");
    }
    return new Val(
      this.val * b.val,
      combineUnits(this.unit, b.unit, "*"),
      this.condition || b.condition
    );
  }
}

const combineUnits = (u1: string, u2: string, sep: string) => {
  if (u1 == "" && u2 == "") {
    return "";
  }
  return u1 + sep + u2;
};
