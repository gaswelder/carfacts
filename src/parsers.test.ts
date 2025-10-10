import * as test from "node:test";
import { parseTyre } from "./parsers.mts";
import * as assert from "assert/strict";

const input = [
  "05/55R16W",
  "13.0x18",
  "14.5x18",
  "15",
  "165 S14 (165 HR14)",
  "165-15 in",
  "165-15",
  "165",
  "165SR-15",
  "165SR-15",
  "175 SR14",
  "175/70-14",
  "175/70-14",
  "175/SR 14",
  "185/70x15",
  "185HR-14",
  "185HR-14",
  "185x15",
  "195/50 VR 15 P7",
  "195/65 R 15 V",
  "205",
  "205",
  "205/50 VR 15 P7",
  "205/55 R 16 W",
  "205/55 R 16W",
  "205/55 VR 16 and 225/50 VR 16 (front rear)",
  "205/55 ZR",
  "205/55R16W",
  "205/55R16W",
  "205/70 VR14",
  "205/70 VR14",
  "215/55 R 16Y",
  "215/60 VR15",
  "215/60 VR15",
  "215/70 VR15",
  "215/70 VR15",
  "225/40-265/35R18",
  "225/40-265/35R18",
  "225/40-295/30R18",
  "225/45 WR17",
  "225/45 ZR 17(v)",
  "225/45R18 rear",
  "225/50 R 16 V",
  "225/50 R 16 V",
  "225/50 VR16",
  "225/50 ZRR17",
  "225/50VR x 16",
  "225/55 R 17 W",
  "225/55 VR16",
  "225/70 VR15",
  "235/35 R19 / 305/30 R20",
  "235/35 YR19",
  "235/35 ZR20 8.5",
  "235/40-315/30R18",
  "235/45- и 255/40-VR17",
  "235/49 XR18",
  "235/55 R 17 99 Y",
  "245-265 mm",
  "245-690 R520A",
  "245/45-255/45R18",
  "245/45R18 front",
  "255",
  "255",
  "255",
  "255/40 R18 Y",
  "255/40 ZR 17's (fronts 225/45 ZR 17's)",
  "255/50 VR16",
  "255/50VR x 16",
  "255x740x560",
  "265",
  "265/50 VR16",
  "265x790 R540 A 111 W",
  "275/600 - 16",
  "285/40VRx15",
  "295/35 ZR20 10.5",
  "300/640x18",
  "33 in",
  "335-710 R540A",
  "335/30 YR20",
  "345/35VRx15",
  "350/700 - 16",
  "355/710x18",
  "4.50-17",
  "40x8",
  "42x8",
  "7",
  "front 255/35 zr20",
  "front=275/40 R20W",
  "P205/55 R 16 H",
];

test.it("155 HR 13", () => {
  const r = parseTyre("155 HR 13");
  assert.equal(r?.format(), "155 HR13");
});

test.it("225/50 ZRR17", () => {
  const r = parseTyre("225/50 ZRR17");
  assert.equal(r?.format(), "225/50 ZRR17");
});

test.it("185/70 VR15", () => {
  assert.equal(parseTyre("185/70 VR15")?.format(), "185/70 VR15");
});

test.it("195/70-HR14", () => {
  assert.equal(parseTyre("195/70-HR14")?.format(), "195/70 HR14");
});

test.it("225/50 ZR", () => {
  assert.equal(parseTyre("225/50 ZR")?.format(), "225/50 ZR");
});

test.it("255/40 R18 Y", () => {
  assert.equal(parseTyre("255/40 R18 Y")?.format(), "255/40 R18 Y");
});

test.it("165SR-15", () => {
  assert.equal(parseTyre("165SR-15")?.format(), "165 SR15");
});

for (const s of input) {
  console.log(s, parseTyre(s)?.format());
}
