import readline from "readline/promises";
import { loadDb } from "./db/db.mts";
import * as fs from "fs";

/**
 * Reads facts from stdin, inserts to the database.
 */
const main = async () => {
  let ok = 0;
  let fails = 0;
  let failed = new Map<string, string[]>();
  const fail = (msg: string, line: string) => {
    const ls = failed.get(msg);
    if (ls) {
      ls.push(line);
    } else {
      failed.set(msg, [line]);
    }
    fails++;
  };

  const db = loadDb("carfacts.txt", []);

  const rl = readline.createInterface(process.stdin);
  for await (const line of rl) {
    if (line.trim() == "" || line.trim()[0] == "#") {
      continue;
    }
    const cols = line.split("|").map((x) => x.trim());
    if (cols.length != 3) {
      fail("invalid tuple", line);
      continue;
    }
    const [id, k, v] = cols;
    try {
      db.insert({ id, k, v });
      ok++;
    } catch (err: any) {
      fail(err.message, line);
      continue;
    }
  }
  console.log(`${ok} inserted, ${fails} failed`);

  const ff = failed
    .entries()
    .map(([k, v]) => {
      return ["# " + k, ...v, ""].join("\n");
    })
    .toArray()
    .join("\n");
  fs.writeFileSync(`fails-${Date.now()}.txt`, ff);

  if (ok > 0) {
    await db.save("carfacts.txt.tmp");
  }
};

main();
