import * as fs from "fs";

const main = (args) => {
  const path = args[0];
  const s = fs.readFileSync(path).toString();
  const lines = s.split("\n");

  const maps = [
    (k, v) => {
      const km = k.match(/^(.*?) :: (.*?)$/);
      const kv = v.match(/^(.*?) :: (.*?)$/);
      if (km && kv) {
        return [
          [km[1], kv[1]],
          [km[2], kv[2]],
        ];
      }
    },
  ];

  const out = [];
  for (const line of lines) {
    const cols = line.split(" | ");
    if (cols.length != 3) {
      out.push(line);
      continue;
    }
    const [n, k, v] = cols;
    let emit = [[k, v]];
    for (const m of maps) {
      emit = m(k, v) || emit;
    }
    for (const e of emit) {
      out.push([n, ...e].join(" | "));
    }
  }

  fs.writeFileSync(path + ".edited", out.join("\n"));
};

main(process.argv.slice(2));

