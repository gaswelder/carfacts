import { reader } from "../reader.mjs";

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
