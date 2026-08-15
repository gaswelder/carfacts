import { parsePower } from "../parsers/power.mts";
import { parseTorque } from "../parsers/torque.mts";
import { parseTyre } from "../parsers/tyres.mts";
import { readWheel } from "../parsers/wheels.mts";
import { oneof, unitless, unit } from "./schemabase.mts";
import { Val } from "./val.mts";

const parseSeconds = (s: string) => {
  const v = Val.parse(s.replace(",", "."));
  const map: Record<string, string> = { "": "s", с: "s", sec: "s" };
  v.unit = map[v.unit] || v.unit;
  if (v.unit == "s") {
    return { val: v.val.toFixed(1) + " s" };
  }
};

const matchRange = (
  val: string,
  units: string[],
  params: Partial<{ unitAliases: Record<string, string> }>,
) => {
  const [a, b, c] = val.split("..").map((x) => x.trim());
  if (c !== undefined) {
    throw new Error("invalid range format: " + val);
  }

  const p = () => {
    const from = Val.parse(a);
    if (b === undefined) {
      return { from: from.val, to: null, unit: from.unit };
    }
    const to = Val.parse(b);
    return { from: from.val, to: to.val, unit: to.unit };
  };

  const r = p();
  if (params.unitAliases) {
    r.unit = params.unitAliases[r.unit] || r.unit;
  }
  if (units.includes(r.unit)) {
    if (r.to !== null) {
      return { val: `${r.from}..${r.to} ${r.unit}` };
    }
    return { val: `${r.from} ${r.unit}` };
  }
};

const range = (units: string[]) => (val: string) => {
  return matchRange(val, units, {});
};

const size = unit(["mm", "in", "m", "cm"], {
  defaults: [{ min: 1000, unit: "mm" }],
});

const isnum = (s: string) => s.match(/^\d+(\.\d+)?$/);

const brakes = oneof([
  { canonical: "drum", aliases: ["drums"] },
  { canonical: "all drum", aliases: ["all drums"] },
  "disc",
  "all disc",
  "ventilated disc",
]);

const tyres = (val: string) => {
  const x = parseTyre(val);
  if (x) {
    return { val: x.format() };
  }
  return { val };
};

const wheels = (val: string) => {
  const w = readWheel(val);
  if (w) return { val: w.format() };
};

export const getParam = (name: string) => {
  for (const [k, v] of Object.entries(known)) {
    if (k.toLowerCase() == name.toLowerCase()) {
      return { k, v };
    }
  }
  return null;
};

export const known = {
  Price: unit(["USD", "DM", "GBP", "RUR", "EUR", "BYN"], {}),
  Count(val: string) {
    let m = val.match(/(\d+) (in|@) (\d+)/);
    if (m) {
      const n = m[1];
      const y = m[3];
      return { val: `${y} ${n}` };
    }
    m = val.match(/^(\d+)\s?K$/i);
    if (m) {
      return { val: parseInt(m[1], 10) * 1000 };
    }
    m = val.match(/^(\d+) @\s?(\d\d\d\d)$/);
    if (m) {
      const n = m[1];
      const y = m[2];
      return { val: `${y} ${n}` };
    }
    if (val.match(/^\d+$/) || val.match(/^\d\d\d\d \d+/)) {
      return { val };
    }
  },

  // Engine
  Volume: unit(["cc", { canonical: "L", aliases: ["l"] }, "cin"], {
    defaults: [{ unit: "L", max: 10 }],
  }),
  Cylinders: oneof(
    `1 10 12 16 18 2 3 4 5 6 8 B12 B2 B4 B6 B8 I6 R 12 R2 R4 R6 R6 R8 R12 R5 R3
        V10 V12 V16 V2 V4 V5 V6 V8 VR5 VR6 W12 W15 W16 W18`.split(/\s+/),
  ),
  Compressor: oneof([
    "turbo",
    "no",
    "2 turbo",
    "3 turbo",
    "4 turbo",
    "twincharger",
    "roots",
    "mechanical",
    "2 mechanical",
  ]),
  "Compressor pressure": range(["bar", "atm", "psi"]),
  Power: (s: string) => {
    const p = parsePower(s);
    if (!p) return null;
    if (!p.u) p.u = "hp";
    return { val: p.format() };
  },
  Torque: unit(
    [
      { canonical: "nm", aliases: ["N·m", "Nm"] },
      { canonical: "lb-ft", aliases: ["ft-lb"] },
    ],
    {},
  ),
  Fuel: oneof([
    "bioethanol",
    "diesel",
    "electric",
    "hydrogen",
    "kerosene",
    "natural gas",
    "petrol 72",
    "petrol 76",
    "petrol 92",
    "petrol 95",
    "petrol 98",
    "petrol",
  ]),
  "Fuel feed": oneof([
    "2 carb",
    "3 carb",
    "4 carb",
    "6 carb",
    "carb",
    "direct injection",
    "distributed injection",
    "injection",
    "mechanical injection",
    "sequential distributed injection",
    "sequential multi-point injection",
    "port injection",
    "electronic injection",
    "multi-point injection",
  ]),

  // Engine details
  "Compression ratio": unitless(1),
  Bore: unit(["mm", "in"], { defaults: [{ min: 40, unit: "mm" }] }),
  Stroke: unit(["mm", "in"], { defaults: [{ min: 40, unit: "mm" }] }),
  "Valves per cylinder": oneof(["2", "3", "4", "5"]),
  "Max rpm": unitless(),

  // Perf
  Speed: unit([{ canonical: "kmph", aliases: ["км/ч"] }, "mph"], {}),
  "0-96 kmph": parseSeconds,
  "0-97 kmph": parseSeconds,
  "0-100 kmph": parseSeconds,
  "0-120 kmph": parseSeconds,
  "0-150 kmph": parseSeconds,
  "0-160 kmph": parseSeconds,
  "0-161 kmph": parseSeconds,
  "0-180 kmph": parseSeconds,
  "0-200 kmph": parseSeconds,
  "0-240 kmph": parseSeconds,
  "0-300 kmph": parseSeconds,
  "0-320 kmph": parseSeconds,
  "0-30 mph": parseSeconds,
  "0-40 mph": parseSeconds,
  "0-50 mph": parseSeconds,
  "0-60 mph": parseSeconds,
  "0-100 mph": parseSeconds,
  "0-120 mph": parseSeconds,
  "0-125 mph": parseSeconds,
  "0-150 mph": parseSeconds,

  "Fuel consumption": (val: string) => {
    let m;
    // 10.1 L/100km
    m = val.match(/^([\d.]+)\s?L\s?\/\s?100\s?km$/i);
    if (m) {
      return { val: `${m[1]} L/100km` };
    }
    // 5.1 kg/100km
    m = val.match(/^([\d.]+)\s?kg\s?\/\s?100\s?km$/i);
    if (m) {
      return { val: `${m[1]} kg/100km` };
    }
    // "7.1"
    m = val.match(/^[\d.]+$/);
    if (m) {
      return { val: `${val} L/100km` };
    }
    // "23.1 mpg", "80 km", "5.1 kg/100km"
    m = val.match(/^([\d.]+) (mpg|km)$/i);
    if (m) {
      return { val: `${m[1]} ${m[2]}` };
    }
  },
  Weight: unit(
    [
      { canonical: "kg", aliases: ["кг"] },
      { canonical: "lbs", aliases: ["lb"] },
      "t",
    ],
    { defaults: [{ unit: "kg" }] },
  ),

  Body: oneof([
    "ambulance 5",
    "buggy",
    "bus",
    "cabriolet 2",
    "cabriolet 4",
    "cabriolet",
    "convertible",
    "coupe 2",
    "coupe 4",
    "coupe",
    "hatchback 3",
    "hatchback 4",
    "hatchback 5",
    "hatchback",
    "limousine",
    "limousine 4",
    "monocock",
    "minivan",
    "minivan 4",
    "roadster",
    "sedan 2",
    "sedan 4",
    "sedan",
    "suv",
    "spyder",
    "targa",
    "torpedo",
    "truck",
    "van",
    "van 3",
    "wagon 3",
    "wagon 5",
    "wagon",
    "phaeton",
    "pickup",
  ]),
  Length: size,
  Width: size,
  Height: size,
  Seats: oneof([
    "1",
    "2",
    "3",
    "4",
    "2+2",
    "5",
    "6",
    "7",
    "8",
    "9",
    "15",
    "4+2",
    "35",
  ]),
  Doors(val: string) {
    if (isnum(val)) {
      return { val };
    }
  },
  "Fuel tank": unit([{ canonical: "L", aliases: ["litres"] }], {}),
  Cx: unitless(3),
  "Trunk size"(s: string) {
    return matchRange(s, ["L", "cubic ft", "m3"], {
      unitAliases: { л: "L", l: "L" },
    });
  },

  // Chassis
  "Front track": size,
  "Rear track": size,
  Wheelbase: size,
  Clearance: range(["mm", "in", "cm"]),
  "Engine placement": oneof([
    "center longitudinal",
    "center transverse",
    "transverse",
    { canonical: "center", aliases: ["mid"] },
    "front longitudinal",
    "front transverse",
    "front",
    "rear longitudinal",
    "rear",
  ]),
  Brakes: brakes,
  "Rear brakes": brakes,
  "Front brakes": brakes,
  "Brakes size": unit(["mm", "in"], {}),
  "Front brakes size": unit(["mm", "in"], {}),
  "Rear brakes size": unit(["mm", "in"], {}),
  Tyres: tyres,
  "Front tyres": tyres,
  "Rear tyres": tyres,
  Wheels: wheels,
  "Front wheels": wheels,
  "Rear wheels": wheels,

  Gears: oneof([
    "var",
    "1",
    ...[2, 3, 4, 5, 6, 7, 8].flatMap((n) => [
      `${n} auto`,
      `${n} manual`,
      `${n}`,
      `${n} seq`,
      `${n} semi-auto`,
    ]),
  ]),
  Drive: oneof([
    { canonical: "full", aliases: ["full-wheel"] },
    "front",
    "rear",
    "full constant",
    "full switchable",
    "full auto-switchable",
  ]),
};
