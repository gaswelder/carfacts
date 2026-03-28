import { reader } from "../reader.mjs";

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
