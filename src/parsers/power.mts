import { reader } from "../reader.mjs";

export const parsePower = (s: string) => {
  s = s.replace("л.с.", "hp");
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
