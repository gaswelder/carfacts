import readline from "readline/promises";
import { formatFact, groupFacts, parseFact } from "./db.mts";
import { known } from "./schema.mts";

type Fact = ReturnType<typeof parseFact>;

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
    rawTuples.push(parseFact(line));
  }

  // Parse and reformat the input tuples.
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
      oops("failed to parse data", { id, k, v });
      return [];
    }
    return [{ id, k, v: norm.val }];
  };
  const tuples = rawTuples.flatMap(parse);
  if (!ok) {
    process.exit(1);
  }

  const cars = groupFacts(tuples, Object.keys(known));
  for (const [id, entries] of cars.entries()) {
    for (const e of entries) {
      console.log(formatFact({ id, ...e }));
    }
  }
};

main();
