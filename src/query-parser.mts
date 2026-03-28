import { reader } from "./reader.mjs";

type Reader = {
  id: () => string;
  spaces: () => void;
  pop: (s: string) => boolean;
};

export type Expr =
  | { type: "/"; a: Expr; b: Expr }
  | { type: "*"; a: Expr; b: Expr }
  | { type: "name"; val: string }
  | { type: "convert"; unit: string; val: string };

export const parseExpr = (s: string) => {
  const r = reader(s);
  r.spaces();
  const e = readLevel1(r);
  r.spaces();
  if (r.more()) {
    throw new Error("failed to parse: " + r.rest());
  }
  return e;
};

const readLevel1 = (r: Reader): Expr | null => {
  const a = readAtom(r);
  if (!a) return null;
  if (r.pop("/")) {
    r.spaces();
    const b = readLevel1(r);
    r.spaces();
    if (!b) throw new Error("expected something after /");
    return { type: "/", a, b };
  }
  if (r.pop("*")) {
    r.spaces();
    const b = readLevel1(r);
    r.spaces();
    if (!b) throw new Error("expected something after *");
    return { type: "*", a, b };
  }
  return a;
};

const readAtom = (r: Reader): Expr | null => {
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
