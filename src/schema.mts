import {
  parsePower,
  parseTorque,
  parseTyre,
  parseVal,
  readWheel,
} from "./parsers.mts";

const oneof = (vals: string[]) => (val: string) => {
  for (const x of vals) {
    if (val.toLowerCase() == x.toLowerCase()) {
      return { val: x };
    }
  }
};

const seconds = (s) => {
  const v = parseVal(s.replace(",", "."));
  const map = { "": "s", с: "s", sec: "s" };
  v.unit = map[v.unit] || v.unit;
  if (v.unit == "s") {
    return { val: v.val.toFixed(1) + " s" };
  }
};

const unitless = (fixed?: number) => (val: string) => {
  const n = parseFloat(val);
  if (fixed !== undefined) {
    return { val: n.toFixed(fixed) };
  }
  return { val: n.toString() };
};

const units =
  (
    units: string[],
    defaults?: { unit: string; min?: number; max?: number }[]
  ) =>
  (val: string) => {
    if (val.includes(",") && !val.match(/,\d{3,}/)) {
      val = val.replace(",", ".");
    }
    const x = parseVal(val);
    if (x.unit == "" && defaults) {
      for (const def of defaults) {
        if (def.min !== undefined && x.val < def.min) {
          continue;
        }
        if (def.max !== undefined && x.val > def.max) {
          continue;
        }
        x.unit = def.unit;
        break;
      }
    }
    if (units.includes(x.unit)) {
      return { val: x.format() };
    }
  };

const range = (units) => (val) => {
  let m;
  m = val.match(/^([\d.]+)\s?(.*?)$/);
  if (m) {
    const [, v, unit] = m;
    if (units.includes(unit)) {
      return { val: `${v} ${unit}` };
    }
  }
  m = val.match(/^(1\.2)\.\.(1\.5)\s?(bar)$/);
  if (m) {
    const [, a, b, unit] = m;
    if (units.includes(unit)) {
      return { val: `${a}..${b} ${unit}` };
    }
  }
};

const size = units(["mm", "in", "m", "cm"], [{ min: 1000, unit: "mm" }]);

const isnum = (s) => s.match(/^\d+(\.\d+)?$/);

const brakes = (val) => {
  val = val.replace("discs", "disc");
  if (val == "drums") {
    return { val: "drum" };
  }
  if (["ventilated disc", "drum", "disc"].includes(val)) {
    return { val };
  }
};

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

export const known = {
  Price: units(["USD", "DM", "GBP", "RUR", "EUR"]),
  Count(val) {
    let m = val.match(/(\d+) in (\d+)/);
    if (m) {
      const n = m[1];
      const y = m[2];
      return { val: `${y} ${n}` };
    }
    m = val.match(/^(\d+)\s?K$/i);
    if (m) {
      return { val: m[1] * 1000 };
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
  Volume: units(["cc", "L", "cin"], [{ unit: "L", max: 10 }]),
  Cylinders: oneof(
    `1 10 12 16 18 2 4 5 6 8 B12 B4 B6 B8 I6 R 12 R4 R6 R6 R8 R12 R5 R3
        V10 V12 V16 V4 V5 V6 V8 VR5 VR6 W12 W15 W16 W18`.split(/\s+/)
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
  ]),
  "Compressor pressure": range(["bar", "atm", "psi"]),
  Power: (s) => {
    const p = parsePower(s);
    if (!p) return null;
    if (!p.u) p.u = "hp";
    return { val: p.format() };
  },
  Torque: (s) => {
    const p = parseTorque(s);
    if (!p) return null;
    if (!p.u) p.u = "nm";
    return { val: p.format() };
  },
  Fuel: oneof(["petrol", "natural gas", "diesel", "electric"]),
  "Fuel feed": oneof([
    "2 carb SU",
    "2 carb Weber",
    "2 carb Zenith",
    "2 carb",
    "3 carb Weber",
    "3 carb",
    "6 carb Weber",
    "4 carb Weber",
    "carb Solex 1B2",
    "carb Solex 2B4",
    "carb Solex 32 TDID",
    "carb Solex 35 PDSIT-5",
    "carb Solex 4A1",
    "carb Solex DIDTA 32/32",
    "carb Solex",
    "carb Weber 46IDA",
    "carb Weber",
    "carb Zenith",
    "carb",
    "direct injection",
    "distributed injection",
    "injection Bosch K-Jetronic",
    "injection Bosch KE-Jetrоnic",
    "injection Bosch L-jetronic",
    "injection Bosch LH-Jetronic",
    "injection Bosch Motronic M5.4",
    "injection Bosch Motronic",
    "injection Bosch Motroniс",
    "injection L-Jetronic",
    "injection K-Jetronic",
    "injection Jetronic",
    "injection Bosch LE-Jetronic",
    "injection Bosch MH-Motronic",
    "injection TAG 3.8",
    "injection TAGtronic",
    "injection",
    "mechanical injection Bosch",
    "mechanical injection Kugelfischer",
    "mechanical injection",
    "sequential distributed injection",
    "sequential multi-point injection",
    "carb Keihin",
    "carb Pierburg 1B3",
    "carb Pierburg 2E2",
  ]),

  // Engine details
  "Compression ratio": unitless(1),
  Bore: units(["mm", "in"], [{ min: 40, unit: "mm" }]),
  Stroke: units(["mm", "in"], [{ min: 40, unit: "mm" }]),
  "Valves per cylinder": oneof(["2", "3", "4", "5"]),
  "Max rpm": units([""]),

  // Perf
  Speed: units(["kmph", "mph"]),
  "0-96 kmph": seconds,
  "0-100 kmph": seconds,
  "0-120 kmph": seconds,
  "0-150 kmph": seconds,
  "0-160 kmph": seconds,
  "0-161 kmph": seconds,
  "0-180 kmph": seconds,
  "0-200 kmph": seconds,
  "0-300 kmph": seconds,
  "0-30 mph": seconds,
  "0-40 mph": seconds,
  "0-50 mph": seconds,
  "0-60 mph": seconds,
  "0-100 mph": seconds,
  "0-120 mph": seconds,
  "0-125 mph": seconds,
  "0-150 mph": seconds,

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
  Weight: units(["kg", "lbs", "t"], [{ unit: "kg" }]),

  Body: oneof([
    "buggy",
    "bus",
    "cabriolet 2",
    "cabriolet 4",
    "cabriolet",
    "coupe 2",
    "coupe 4",
    "coupe",
    "hatchback 3",
    "hatchback 5",
    "hatchback",
    "monocock",
    "roadster",
    "sedan 2",
    "sedan 4",
    "sedan",
    "spyder",
    "targa",
    "truck",
    "van",
    "van 3",
    "wagon 3",
    "wagon 5",
    "wagon",
  ]),
  Length: size,
  Width: size,
  Height: size,
  Seats: oneof(["2", "4", "2+2", "5", "6", "7", "1", "8", "4+2", "35"]),
  Doors(val) {
    if (isnum(val)) {
      return { val };
    }
  },
  "Fuel tank": (val) => {
    const x = parseVal(val);
    if (x.unit == "l") {
      x.unit = "L";
    }
    if (["L", "gal"].includes(x.unit)) {
      return { val: x.format() };
    }
  },
  Cx: unitless(3),
  "Trunk size": range(["L", "cubic ft"]),

  // Chassis
  "Front track": size,
  "Rear track": size,
  Wheelbase: size,
  Clearance: range(["mm", "in", "cm"]),
  "Engine placement": oneof([
    "center longitudinal",
    "center transverse",
    "center",
    "front longitudinal",
    "front transverse",
    "front",
    "rear longitudinal",
    "rear",
  ]),
  Brakes: brakes,
  "Rear brakes": brakes,
  "Front brakes": brakes,
  "Brakes size": units(["mm", "in"]),
  "Front brakes size": units(["mm", "in"]),
  "Rear brakes size": units(["mm", "in"]),
  Tyres: tyres,
  "Front tyres": tyres,
  "Rear tyres": tyres,
  Wheels: wheels,
  "Front wheels": wheels,
  "Rear wheels": wheels,

  Gears: oneof([
    "var",
    ...[2, 3, 4, 5, 6, 7].flatMap((n) => [
      `${n} auto`,
      `${n} manual`,
      `${n}`,
      `${n} seq`,
      `${n} semi-auto`,
    ]),
  ]),
  Drive: oneof([
    "full",
    "front",
    "rear",
    "full constant",
    "full switchable",
    "full auto-switchable",
  ]),
};
