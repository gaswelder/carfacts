import readline from "readline/promises";
import { loadDb } from "./db/db.mts";

/**
 * Reads facts from stdin, inserts to the database.
 */
const main = async () => {
  let ok = true;
  const oops = (msg: string, data: Record<string, unknown>) => {
    process.stderr.write(JSON.stringify({ msg, ...data }) + "\n");
    ok = false;
  };
  const db = loadDb("carfacts.txt", []);

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

    // " :: " splits a tuple into multiple tuples.
    for (const v of vs.split(" :: ")) {
      try {
        db.insert({ id, k: ks, v });
      } catch (err: any) {
        oops(err.message, {});
        continue;
      }
    }
  }
  if (!ok) {
    process.exit(1);
  }
  await db.save("carfacts.txt.tmp");
};

main();
