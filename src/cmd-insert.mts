import readline from "readline/promises";
import { formatFact, groupFacts } from "./db.mts";
import { known } from "./schema.mts";

type Fact = { id: string; k: string; v: string };

/**
 * Reads facts from stdin, prints them normalized and reformatted.
 */
const main = async () => {
  // Read all tuples in memory.
  // This allows to either print only errors or print the reformatted data
  // when there are no errors.
  const rawTuples = [] as { id: string; k: string; v: string }[];
  const rl = readline.createInterface(process.stdin);
  for await (const line of rl) {
    if (line.trim() == "") continue;
    const cols = line.split("|").map((x) => x.trim());
    if (cols.length != 3) {
      throw new Error("invalid tuple: " + line);
    }
    rawTuples.push({ id: cols[0], k: cols[1], v: cols[2] });
  }

  const tuples = reformat(rawTuples);

  const cars = groupFacts(tuples, Object.keys(known));
  for (const [id, entries] of cars.entries()) {
    for (const e of entries) {
      console.log(formatFact({ id, ...e }));
    }
  }
};

const reformat = (rawTuples: Fact[]) => {
  let ok = true;
  const oops = (msg: string, data: Record<string, unknown>) => {
    console.log(JSON.stringify({ msg, ...data }));
    ok = false;
  };
  const parse = (tuple: Fact): Fact[] => {
    let { id, k, v } = tuple;
    if (v === "") {
      return [];
    }

    // " :: " splits a tuple into multiple tuples.
    if (v.includes(" :: ")) {
      return v.split(" :: ").flatMap((v) => parse({ id, k, v }));
    }

    const normalize = known[k];
    if (!normalize) {
      oops("unknown param", { id, k, v });
      return [];
    }
    const norm = normalize(v);
    if (!norm || !("val" in norm)) {
      oops("failed to parse value for " + k, { id, k, v });
      return [];
    }
    return [{ id, k, v: norm.val }];
  };
  const tuples = rawTuples.flatMap(parse);
  if (!ok) {
    process.exit(1);
  }
  return tuples;
};

main();
