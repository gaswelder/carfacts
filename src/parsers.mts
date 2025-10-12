import { reader } from "./reader.mjs";
import { Val } from "./val.mts";

/**
 * Parses strings like "125 hp @ 2000 rpm" into Val objects.
 */
export const parseVal = (s: string) => {
  const [n, cond, z] = s.split("@").map((x) => x.trim());
  if (z !== undefined) {
    throw new Error("unexpected format: " + s);
  }
  const r = reader(n);

  // hack: skip non-digits to let "R8" or "V6" work with calculations.
  while (r.more() && r.peek().match(/[a-z]/i)) {
    r.get();
  }

  const val = r.num();
  r.spaces();
  const unit = r.rest();
  return new Val(parseFloat(val), unit, cond);
};

export const readWheel = (s: string) => {
  const r = reader(s);

  // First number, usually the width.
  let n1 = r.num();
  if (!n1) {
    return null;
  }

  // Some like to express .5 in a fancy way.
  if (r.popAnyI(",5")) {
    n1 += ".5";
    r.spaces();
  } else if (r.popAnyI(",0")) {
    r.spaces();
  } else {
    r.spaces();
    if (r.popAnyI("1/2")) {
      n1 += ".5";
      r.spaces();
    }
  }
  let j = "";
  if (r.popAnyI("J")) {
    j = "J";
  }
  r.spaces();
  let n2 = "";
  if (r.popAnyI("x", "×")) {
    r.spaces();
    n2 = r.num();
    if (!n2) {
      return null;
    }
    r.spaces();
  } else if (j) {
    n2 = r.num();
  }

  let w = "";
  if (n2 && r.popAnyI("w")) {
    w = "W";
    r.spaces();
  }
  r.popAnyI("in", "inch");
  r.spaces();
  if (r.rest() != "") {
    return null;
  }
  let width = n1;
  let diameter = n2;
  if (!j && parseFloat(n1) > parseFloat(n2)) {
    width = n2;
    diameter = n1;
  }
  return {
    j,
    width,
    diameter,
    format() {
      if (!diameter) {
        return `${width}${j.toUpperCase()}`;
      }
      return `${width}${j.toUpperCase()}x${diameter}${w}`;
    },
  };
};

export const parsePower = (s) => {
  const r = reader(s);
  const num = r.num();
  if (num === "") return null;
  r.spaces();
  const u = r.popAnyI("hp", "kWt", "kW", "bhp");
  r.spaces();
  let rpm;
  if (r.popAnyI("@", "/")) {
    r.spaces();
    rpm = r.num();
    r.spaces();
    r.popAnyI("rpm");
  }
  if (r.more()) {
    return null;
  }
  return {
    num,
    u,
    rpm,
    format() {
      if (this.rpm) {
        return `${this.num} ${this.u} @ ${this.rpm} rpm`;
      }
      return `${this.num} ${this.u}`;
    },
  };
};

export const parseTorque = (s) => {
  const r = reader(s);
  const num = r.num();
  if (num === "") return null;
  r.spaces();
  let u;
  if (
    r.popAnyI("lb-ft", "lb ft", "lb/ft", "фунт*фут", "ft lbs", "фунтов*фут")
  ) {
    u = "lb-ft";
  }
  if (!u && r.popAnyI("nm", "Н*м")) {
    u = "nm";
  }
  r.spaces();
  let rpm;
  if (r.popAnyI("@", "/")) {
    r.spaces();
    rpm = r.num();
    r.spaces();
    r.popAnyI("rpm");
  }
  if (r.more()) {
    return null;
  }
  return {
    num,
    u,
    rpm,
    format() {
      if (this.rpm) {
        return `${this.num} ${this.u} @ ${this.rpm} rpm`;
      }
      return `${this.num} ${this.u}`;
    },
  };
};

export const parseTyre = (s: string) => {
  if (s.endsWith(" mm")) {
    return null;
  }
  if (s.endsWith(" in")) {
    s = s.substring(0, s.length - 3);
  }

  // "235/40ZR18"
  const standard = () => {
    const r = reader(s);

    const result = {
      kind: "standard" as const,
      width: "", // tyre width in milimeters
      aspectRatio: "", // Aspect ratio (sidewall height in % of the width)
      flags1: "",
      diameter: "",
      flags2: "",
      format() {
        let s = this.width.toString();
        if (this.aspectRatio) {
          s += "/" + this.aspectRatio;
        }
        if (this.flags1) {
          s += " " + this.flags1;
        }
        if (this.diameter) {
          if (!this.flags1) {
            s += "-";
          }
          s += this.diameter;
        }
        if (this.flags2) {
          if (!this.diameter) {
            s += " ";
          }
          s += this.flags2;
        }
        return s;
      },
    };

    // "205"
    result.width = r.digits();
    if (!result.width || parseInt(result.width) < 100) return null;
    r.spaces();

    // "/30"
    if (r.pop("/")) {
      result.aspectRatio = r.digits();
      r.spaces();
    }

    if (result.aspectRatio && parseInt(result.aspectRatio) >= 100) {
      return null;
    }

    // Sometimes a dash or an x here.
    r.spaces();
    r.pop("-") || r.pop("x");
    r.spaces();

    // "VR", "ZRR", ...
    while (r.more() && r.peek() != "x" && r.peek().match(/[a-z]/i)) {
      result.flags1 += r.get();
    }

    // Sometimes a dash or an x here.
    r.spaces();
    r.pop("-") || r.pop("x");
    r.spaces();

    // "17"
    result.diameter = r.digits();
    r.spaces();

    // "Y", "V", ...
    while (r.more() && r.peek().match(/[a-z]/i)) {
      result.flags2 += r.get();
    }

    // const speedRatings = [
    //   "S", // 180 kmph
    //   "T", // 190 kmph
    //   "H", // 210 kmph
    //   "V", // 240 kmph
    //   "W", // 270 kmph
    //   "Y", // 300 kmph
    //   "(Y)", // >300 kmph
    // ];

    // Construction type
    // const flags = [
    //   "Z", // >240kmph
    //   "R", // They used to put R after speed ratings, I guess
    //   "R", // radial (another R)
    // ];

    if (r.more()) return null;
    return result;
  };

  const a = standard();
  if (a) return a;
};
