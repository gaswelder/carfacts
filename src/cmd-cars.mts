import { loadDb } from "./db.mts";

const foo = () => loadDb("carfacts.txt", []);

const main = (args: string[]) => {
  const f = cmd[args[0]];
  if (!f) {
    console.log("subcommands: " + Object.keys(cmd).join(", "));
    process.exit(1);
  }
  f(args.slice(1));
};

const groupCar = (car: { k: string; v: string }[]) => {
  const result = {} as Record<string, string[]>;
  car.forEach(({ k, v }) => {
    const l = result[k];
    if (l) l.push(v);
    else result[k] = [v];
  });
  return result;
};

const cmd: Record<string, (args: string[]) => void> = {
  /**
   * Prints a specs table for every car that matches the filter.
   */
  specs(args) {
    const filter = args[0];
    const db = foo();
    for (const { id, car } of db.entries(filter)) {
      console.log("**" + id + "** \n");
      const table = [["param", "value"]];
      for (const [k, vv] of Object.entries(groupCar(car))) {
        table.push([k, vv.join(", ")]);
      }
      renderTable(table);
      console.log("\n");
    }
  },
  /**
   * Runs a query on all cars and prints results.
   */
  query(args) {
    if (args.length == 0) {
      console.log("arguments: query...");
      return;
    }
    const db = foo();
    for (const { id, car } of db.entries()) {
      const m = id.match(/^(\d\d\d\d)/);
      if (!m) continue;
      let r = db.query(car, args[0]).map((val) => [val]);
      for (let i = 1; i < args.length; i++) {
        const s = db.query(car, args[i]);
        r = r.flatMap((result) => {
          return s.map((col) => {
            return [...result, col];
          });
        });
      }
      for (const row of r) {
        console.log(m[1], ...row.map((x) => x.format()));
      }
    }
  },
  /**
   * Prints a comparison table across specified queries
   * for every car that matches the filter.
   */
  compare(args) {
    if (args.length < 2) {
      console.log("arguments: filter query...");
      return;
    }
    const [filter, ...params] = args.map((x) => x.toLowerCase());
    const db = foo();

    const table = [["model", ...params]];

    for (const { id, car } of db.entries(filter)) {
      const row = [] as string[];
      for (const q of params) {
        const vv = db.query(car, q);
        row.push(vv.map((x) => x.format()).join(", "));
      }
      if (row.every((x) => x == "")) {
        continue;
      }
      table.push([id, ...row]);
    }

    renderTable(table);
  },
};

const renderTable = (rows: string[][]) => {
  // Markdown-compatible format.
  // Don't bother with alignment, let the editor auto-format.
  let first = true;
  for (const row of rows) {
    console.log("|" + row.join(" | ") + "|");
    if (first) {
      first = false;
      console.log("|-------|");
    }
  }
};

main(process.argv.slice(2));
