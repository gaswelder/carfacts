import { reader } from "../reader.mjs";

export const parseTorque = (s: string) => {
  const r = reader(s);
  const num = r.num();
  if (num === "") return null;
  r.spaces();
  let u = "";
  if (
    r.popAnyI("lb-ft", "lb ft", "lb/ft", "фунт*фут", "ft lbs", "фунтов*фут")
  ) {
    u = "lb-ft";
  }
  if (!u && r.popAnyI("nm", "Н*м")) {
    u = "nm";
  }
  if (!u && r.popAnyI("kgm")) {
    u = "kgm"; // kg-force * meter
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
