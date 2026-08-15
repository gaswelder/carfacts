import readline from "readline/promises";

const main = async () => {
  const rl = readline.createInterface(process.stdin);
  let ok = 0;
  for await (const line of rl) {
    const row = line.split("|").map((x) => x.trim());
    const outrows = mapRow(row);
    if (outrows[0] !== row) {
      ok++;
    }
    for (const row of outrows) {
      console.log(row.join(" | "));
    }
  }
  console.log("# ok = " + ok);
};

const mapRow = (row) => {
  let rows = [row];
  rows = rows.map((row) => ors(row) || [row]).flat(1);
  rows = rows.map((row) => price(row) || [row]).flat(1);
  rows = rows.map((row) => deshort(row) || [row]).flat(1);
  rows = rows.map((row) => borestroke(row) || [row]).flat(1);
  return rows;
};

const borestroke = (row) => {
  if (row.length == 3 && row[1].toLowerCase() == "bore x stroke") {
    const m = row[2].match(/^([\d.]+)\s*(mm)? x ([\d.]+)\s*mm$/);
    if (m) {
      return [
        [row[0], "Bore", `${m[1]} mm`],
        [row[0], "Stroke", `${m[3]} mm`],
      ];
    }
  }
};

const ors = (row) => {
  if (row.length == 3 && row[2].includes("::")) {
    const vals = row[2].split("::").map((s) => s.trim());
    return vals.map((val) => [row[0], row[1], val]);
  }
  if (row.length == 2 && row[1].includes("::")) {
    const vals = row[1].split("::").map((s) => s.trim());
    return vals.map((val) => [row[0], val]);
  }
};

const price = (row) => {
  if (row.length == 3 && row[1].toLowerCase() == "price") {
    const m = row[2].match(/^\\$(\d+),000$/);
    if (m) {
      return [["Price", `${m[1]}000 USD`]];
    }
  }
};

const deshort = (row) => {
  if (row.length == 2) {
    const facts = parseShort(row[1]);
    if (facts) {
      return [
        ["# " + row.join(" | ")],
        ...facts.map((fact) => [row[0], ...fact]),
      ];
    }
  }
};

const parseShort = (line) => {
  const facts = [];
  let s = line;
  for (;;) {
    while (s[0] == "," || s[0] == " ") {
      s = s.substring(1, s.length);
    }

    if (s == "") break;

    // find the longest match
    const matches = matchers
      .map((matcher) => {
        const m = s.match(matcher[0]);
        if (!m) return null;
        return { m, matcher };
      })
      .filter((x) => x !== null)
      .sort((a, b) => b.m[0].length - a.m[0].length);
    if (matches.length == 0) {
      console.warn({ line, facts, remaining: s });
      return null;
    }

    const mm = matches[0];
    const f = mm.matcher[1];
    const m = mm.m;
    const params = f(...m);
    if (Array.isArray(params[0])) {
      facts.push(...params);
    } else {
      facts.push(params);
    }
    s = s.replace(m[0], "");
    s = s.replace("(", "");
    s = s.replace(")", "");
    s = s.replace(";", "");
  }
  return facts;
};

const matchers = [
  //
  // generic k=v
  //
  [/(\w+)=(\w+)/, (_, k, v) => [k, v]],

  //
  // Power
  //
  [/\d+\s?hp\s?@\s?\d\d\d\d\s?(rpm)?/i, (v) => ["Power", v]],
  [/(\d+)\s?b?hp/i, (v) => ["Power", v]],
  [/\d+ kWt?/, (v) => ["Power", v]],

  //
  // Body
  //
  [
    /coupe|targa|wagon \d|sedan|cabriolet|roadster|hatchback \d|wagon|spyder|suv|minivan/i,
    (v) => ["Body", v],
  ],
  [/(2|4)-door sedan/, (_, n) => ["Body", `sedan ${n}`]],
  [/^open$/, () => ["Body", "cabriolet"]],

  //
  //
  //
  [
    /(\d+)-valve (V|B|R)(\d+)/,
    (_, v, l, c) => [
      ["Valves per cylinder", v / c],
      ["Cylinders", `${l}${c}`],
    ],
  ],
  [
    /(V|B|R)(\d+) (\d+)-valve/,
    (_, l, c, v) => [
      ["Valves per cylinder", v / c],
      ["Cylinders", `${l}${c}`],
    ],
  ],

  //
  // Valves per cylinder
  //
  [/(4|2|5)v/, (_, n) => ["Valves per cylinder", n]],

  //
  // Acceleration
  //
  [/0-60 mph (\d.\d) s/, (_, v) => ["0-60 mph", v + " s"]],
  [/0-100 kmph (\d.\d) s/, (_, v) => ["0-100 kmph", v + " s"]],
  [/(\d.\d)\s?s/, (_, v) => ["0-100 kmph", v]],

  //
  // Brakes
  //
  [/disc brakes/, (v) => ["Brakes", "disc"]],

  //
  // Trunk size
  //
  [/trunk size (\d+) L/, (_, v) => ["Trunk size", v + " L"]],
  [/trunk size (\d+\.\.\d+) L/, (_, v) => ["Trunk size", v + " L"]],

  //
  // Cylinders
  //
  [/(R|B|V)(2|3|4|5|6|8|10|12)/i, (v) => ["Cylinders", v]],
  [/(\d)-cylinder/, (v) => ["Cylinders", v]],
  [/(\d)[\- ]?cyl/, (_, v) => ["Cylinders", v]],
  [/w12/i, () => ["Cylinders", "W12"]],

  //
  // Fuel
  //
  [/petrol|diesel/i, (v) => ["Fuel", v]],

  //
  // Volume
  //
  [/(\d+)\s?cc/, (v) => ["Volume", v]],
  [/(\d+) cin/, (_, v) => ["Volume", v]],
  [/(\d\.\d)\s?(Liter|L|л)/i, (_, v) => ["Volume", v + "L"]],
  [/(\d)\s?(L|л)/i, (_, v) => ["Volume", v + "L"]],

  //
  // Gearbox
  //
  [/(\d)m/, (_, n) => ["Gears", n + " manual"]],
  [/(\d)a/, (_, n) => ["Gears", n + " auto"]],
  [/(\d) manual/, (_, n) => ["Gears", n + " manual"]],
  [/(\d)(-| )auto/, (_, n) => ["Gears", n + " auto"]],
  [/7 DSG/, (_, n) => ["Gears", "7 seq"]],

  //
  // Weight
  //
  [/\d+ kg/, (v) => ["Weight", v]],
  [/\d+ lbs/, (v) => ["Weight", v]],

  //
  // Engine placement
  //
  [/(front|center|rear)(-| )engine/, (_, v) => ["Engine placement", v]],
  [/mid-engine/i, () => ["Engine placement", "center"]],
  [/rear-mounted/, () => ["Engine placement", "rear"]],
  [/engine transverse/, () => ["Engine placement", "transverse"]],
  [
    /center longitudinal engine/,
    () => ["Engine placement", "center longitudinal"],
  ],

  //
  // Seats
  //
  [/2\+2/, () => ["Seats", "2+2"]],
  [/(\d)\s?seats/, (_, v) => ["Seats", v]],
  [/(\d)-seat/, (_, v) => ["Seats", v]],

  //
  // Doors
  //
  [/(\d) doors/, (_, v) => ["Doors", v]],

  //
  //
  //
  [/\d+\.\d:1/, (v) => ["Compression ratio", v]],
  [/\b\d\.\d\b/, (v) => ["Volume", v + "L"]],

  //
  // Tyres
  //
  [/tyres 195\/70-14/, (v) => ["Tyres", v]],

  // 180 kmph, 126 mph
  [/\d\d\d\s?(kmph|mph)/, (v) => ["Speed", v]],

  [
    /(\d\.\d)i/,
    (z, v) => [
      ["Volume", v + " L"],
      ["Fuel feed", "injection"],
    ],
  ],

  //
  // Price
  //
  [/\d+ (DM|GBP|USD|EUR)/, (v) => ["Price", v]],
  [/\$(\d+)/, (v) => ["Price", v + " USD"]],
  [/\$(\d+),000 \((\d\d\d\d)\)/, (p, y) => ["Price", `${p}000 USD @ ${y}`]],
  [/DM20000/, (v) => ["Price", "20000 DM"]],
  [/\$(\d+)/, (_, v) => ["Price", `${v} USD`]],
  [/\$(\d+) @ 1994/, (_, v) => ["Price", `${v} USD @ 1994`]],
  [
    /(\d+) (USD|EUR) @ (USA|Germany)/,
    (_, v, c, p) => ["Price", `${v} ${c} @ ${p}`],
  ],
  [/DM (\d+) @ Germany/, (_, v) => ["Price", `${v} DM @ Germany`]],
  [/(\d+) DM @ 1983-01/, (_, v) => ["Price", `${v} DM @ 1983-01`]],

  //
  // Fuel feed
  //
  [/2-carburetor/, (v) => ["Fuel feed", "2 carb"]],
  [/carb/, (v) => ["Fuel feed", "carb"]],
  [/carb Solex/, (v) => ["Fuel feed", "carb Solex"]],
  [/K-Jetronic fuel injection/i, (v) => ["Fuel feed", "injection K-Jetronic"]],
  [/(direct|distributed|mechanical) injection/, (v) => ["Fuel feed", v]],
  [/injector/, () => ["Fuel feed", "injection"]],
  [/injection( L-Jetronic)?/, (v) => ["Fuel feed", v]],

  //
  // Wheels
  //
  [/6Jx15/, (v) => ["Wheels", v]],
  [/16x9/, () => ["Wheels", "9x16"]],

  //
  // Drive
  //
  [/front-drive/, () => ["Drive", "front"]],
  [/front drive/, () => ["Drive", "front"]],
  [/rear drive/, () => ["Drive", "rear"]],
  [/4wd/i, () => ["Drive", "full"]],
  [/awd/i, () => ["Drive", "full"]],
  [/rwd/i, () => ["Drive", "rear"]],

  //
  // Dimensions
  //
  [
    /(4768)\/(1760)\/(1445)/,
    (_, l, w, h) => [
      ["Length", l + " mm"],
      ["Width", w + " mm"],
      ["Height", h + " mm"],
    ],
  ],

  //
  // Count
  //
  [/(\d+) (built|units)/, (_, n) => ["Count", n]],
  [/Count: (\d+)/, (_, n) => ["Count", n]],

  //
  // Torque
  //
  [/(\d+) lb-ft/, (_, v) => ["Torque", v + " lb-ft"]],
  [/(\d+)\s?kgm/, (_, v) => ["Torque", v + " kgm"]],
  [
    /(\d+)\s?nm\s?@\s?(\d+)( rpm)?/i,
    (_, n, r) => ["Torque", `${n} nm @ ${r} rpm`],
  ],
  [/(\d+)\s?Nm/i, (_, v) => ["Torque", v + " nm"]],

  //
  // Compressor
  //
  [/twin(-| )turbo/, () => ["Compressor", "2 turbo"]],
  [/biturbo/, () => ["Compressor", "2 turbo"]],
  [/(2 )?turbo/i, (v) => ["Compressor", v]],
  [/supercharger|supercharged/, () => ["Compressor", "mechanical"]],

  //
  // Fuel consumption
  //
  [
    /([\d.]+)-([\d.]+)l\/100km/,
    (_, a, b) => ["Fuel consumption", `${a} l/100km :: ${b} l/100km`],
  ],
  [
    /([\d.]+)\s?l\/100\s?km/i,
    (_, a, b) => ["Fuel consumption", `${a} l/100km`],
  ],
  [
    /(\d+)-(\d+) mpg/,
    (_, a, b) => [
      ["Fuel consumption", a + " mpg"],
      ["Fuel consumption", b + " mpg"],
    ],
  ],

  //
  //
  //
  [
    /1.8T/,
    () => [
      ["Volume", "1.8"],
      ["Compressor", "turbo"],
    ],
  ],
  [
    /2.2 turbo/,
    () => [
      ["Volume", "2.2"],
      ["Compressor", "turbo"],
    ],
  ],
  [
    /\d\.\dTD/i,
    () => [
      ["Volume", "1.9"],
      ["Compressor", "turbo"],
      ["Fuel", "diesel"],
    ],
  ],
  [
    /TDI/i,
    () => [
      ["Compressor", "turbo"],
      ["Fuel", "diesel"],
    ],
  ],
];

main();
