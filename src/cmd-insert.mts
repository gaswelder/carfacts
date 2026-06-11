import readline from "readline/promises";
import { formatFact, groupFacts } from "./db.mts";
import { getParam, known } from "./schema.mts";

type Fact = { id: string; k: string; v: string };

/**
 * Reads facts from stdin, prints them normalized and reformatted.
 */
const main = async () => {
  const tuples = await parse();
  const cars = groupFacts(tuples, Object.keys(known));
  for (const [id, entries] of cars.entries()) {
    for (const e of entries) {
      console.log(formatFact({ id, ...e }));
    }
  }
};

const parse = async () => {
  let ok = true;
  const oops = (msg: string, data: Record<string, unknown>) => {
    console.log(JSON.stringify({ msg, ...data }));
    ok = false;
  };
  const facts = [] as Fact[];

  const rl = readline.createInterface(process.stdin);
  for await (const line of rl) {
    if (line.trim() == "") {
      continue;
    }
    const cols = line.split("|").map((x) => x.trim());
    if (cols.length != 3) {
      oops("invalid tuple: " + line, {});
      continue;
    }
    const [id, ks, vs] = cols;
    const param = getParam(ks);
    if (!param) {
      oops("unknown param", { id, ks });
      continue;
    }

    // " :: " splits a tuple into multiple tuples.
    for (const v of vs.split(" :: ")) {
      const norm = param.v(v);
      if (!norm || !("val" in norm)) {
        oops("failed to parse value for " + param.k, { id, ks, v });
        continue;
      }
      facts.push({ id, k: param.k, v });
    }
  }
  if (!ok) {
    process.exit(1);
  }
  return facts;
};

main();
