import readline from "readline/promises";

const main = async () => {
  const rl = readline.createInterface(process.stdin);
  for await (const line of rl) {
    const specs = parse(line);
    if (!specs) {
      console.log(line);
      continue;
    }
    for (const spec of specs) {
      console.log(spec.join(" | "));
    }
  }
};

const parse = (line) => {
  const cols = line.split("|").map((x) => x.trim());
  if (cols.length != 2) {
    return null;
  }
  let [id, s] = cols;
  const facts = [];

  for (;;) {
    s = s.trim();
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

    const f = matches[0].matcher[1];
    const m = matches[0].m;
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

  return facts.map((fact) => [id, ...fact]);
};

const matchers = [
  //
  // Power
  //
  [/\d+\s?hp\s?@\s?\d\d\d\d\s?(rpm)?/i, (v) => ["Power", v]],
  [/(\d+)\s?b?hp/, (v) => ["Power", v]],
  [/\d+ kWt?/, (v) => ["Power", v]],
  [/330HP/, () => ["Power", "330 hp"]],

  //
  // Body
  //
  [
    /coupe|targa|wagon 3|sedan|cabriolet|roadster|hatchback 5|wagon|spyder/i,
    (v) => ["Body", v],
  ],
  [/(2|4)-door sedan/, (_, n) => ["Body", `sedan ${n}`]],

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
  [/B6|b12|b4|v8|R4|V6|v12|R6|VR6|VR5|R3|V10|W12|R5/i, (v) => ["Cylinders", v]],
  [/6-cylinder/, (v) => ["Cylinders", 6]],
  [/(\d)[\- ]?cyl/, (_, v) => ["Cylinders", v]],
  [/4 cyl/, (v) => ["Cylinders", 4]],

  //
  // Fuel
  //
  [/petrol|diesel/, (v) => ["Fuel", v]],

  //
  // Volume
  //
  [/(\d+)\s?cc/, (v) => ["Volume", v]],
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
  // Cx
  //
  [/Cx=(0\.\d+)/, (_, cx) => ["Cx", cx]],

  //
  // Count
  //
  [/count(=| )(\d+)/, (...m) => ["Count", m[2]]],

  //
  // Engine placement
  //
  [/(front|center|rear) engine/, (_, v) => ["Engine placement", v]],
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
  [/seats=(\d)/i, (_, v) => ["Seats", v]],

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
  [/bore=102 mm/, () => ["Bore", "102 mm"]],

  //
  // Price
  //
  [/\d+ (DM|GBP|USD|EUR)/, (v) => ["Price", v]],
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
  [/Zenith carbs/, (v) => ["Fuel feed", "carb Zenith"]],
  [/2-carburetor/, (v) => ["Fuel feed", "2 carb"]],
  [/carb/, (v) => ["Fuel feed", "carb"]],
  [/carb Solex/, (v) => ["Fuel feed", "carb Solex"]],
  [/Solex/i, () => ["Fuel feed", "carb Solex"]],
  [/4 Webers/i, () => ["Fuel feed", "4 carb Weber"]],
  [/(\d) carb weber/i, (_, v) => ["Fuel feed", v + " carb Weber"]],
  [
    /mechanical injector Bosch K-Jetronic/,
    (v) => ["Fuel feed", "mechanical injection Bosch"],
  ],
  [
    /mechanical injector Bosch/,
    (v) => ["Fuel feed", "mechanical injection Bosch"],
  ],
  [
    /mechanical( fuel)? injection/i,
    (v) => ["Fuel feed", "mechanical injection"],
  ],
  [/K-Jetronic fuel injection/i, (v) => ["Fuel feed", "injection K-Jetronic"]],
  [/(direct|distributed) injection/, (v) => ["Fuel feed", v]],
  [/injector/, () => ["Fuel feed", "injection"]],
  [/injection( L-Jetronic)?/, (v) => ["Fuel feed", v]],
  [/L-Jetronic/, (v) => ["Fuel feed", "injection " + v]],
  [/injection Jetronic/, (v) => ["Fuel feed", v]],

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
  [/4wd/, () => ["Drive", "full"]],
  [/rwd/, () => ["Drive", "rear"]],

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
