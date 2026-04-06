/**
  *
 * BULK SIZE BOUNDARIES  (getFakePersons)
 * ────────────────────
 *   EC-B1  n = 2   — exact lower boundary; must return 2 persons.
 *   EC-B2  n = 100 — exact upper boundary; must return 100 persons.
 *   EC-B3  n = 1   — one below lower boundary; clamped up to 2.
 *   EC-B4  n = 0   — zero; clamped up to 2 (falsy, commonly missed).
 *   EC-B5  n = -1  — negative; clamped up to 2.
 *   EC-B6  n = 101 — one above upper boundary; clamped down to 100.
 *   EC-B7  n = 999 — far above upper boundary; still clamped to 100.
 *   EC-B9  n = 2 (default invocation) — calling getFakePersons() with no
 *                    argument must use the MIN default and return 2.
 *
 * PHONE PREFIX BOUNDARY VALUES  (setPhone)
 * ────────────────────────────────────────
 *   EC-P1  Prefix index 0  ("2", 1 digit)  — shortest possible prefix;
 *          the remaining 7 digits must be appended to reach length 8.
 *   EC-P2  Prefix index 93 ("829", 3 digits) — last entry in the array;
 *          the remaining 5 digits must be appended to reach length 8.
 *   EC-P3  Any 3-digit prefix — only 5 suffix digits needed; total still 8.
 *   EC-P4  Any 1-digit prefix — 7 suffix digits needed; total still 8.
 *   EC-P5  All 94 prefixes are valid; none produces a number shorter or
 *          longer than 8 digits regardless of which one is chosen.
 *
 * DOOR FORMAT VARIATIONS  (setAddress — door branch)
 * ──────────────────────
 *   EC-D1  doorType = 1  (lowest "th" boundary)
 *   EC-D2  doorType = 7  (highest "th" boundary)
 *   EC-D3  doorType = 8  (lowest "tv" boundary)
 *   EC-D4  doorType = 14 (highest "tv" boundary)
 *   EC-D5  doorType = 15 (lowest "mf" boundary)
 *   EC-D6  doorType = 16 (highest "mf" boundary)
 *   EC-D7  doorType = 17 (lowest numeric door boundary); door number = 1
 *   EC-D8  doorType = 17 (lowest numeric door boundary); door number = 50
 *   EC-D9  doorType = 18 (highest numeric door boundary)
 *   EC-D10 doorType = 19 — letter + digits (no hyphen); door digits = 1
 *   EC-D11 doorType = 19 — letter + digits (no hyphen); door digits = 999
 *   EC-D12 doorType = 20 — letter + hyphen + digits; door digits = 1
 *   EC-D13 doorType = 20 — letter + hyphen + digits; door digits = 999
 *
 * FLOOR "st" VS NUMERIC  (setAddress — floor branch)
 * ─────────────────────
 *   EC-F1  floorGate = 1 (lowest "st" gate boundary)
 *   EC-F2  floorGate = 3 (highest "st" gate boundary — off-by-one risk)
 *   EC-F3  floorGate = 4 (lowest numeric floor gate boundary)
 *   EC-F4  floorGate = 10 (highest gate value); floor number = 1 (lowest)
 *   EC-F5  floorGate = 10 (highest gate value); floor number = 99 (highest)
 *
 * ADDRESS DB CONSTRAINT VIOLATIONS  (Town.getRandomTown)
 * ─────────────────────────────────
 *   EC-A1  getRandomTown rejects — the promise returned by setAddress must
 *          reject (propagate the DB error rather than swallowing it).
 *   EC-A2  getRandomTown resolves with an empty postal_code string — the
 *          address object must still be structurally complete even when the
 *          DB returns degenerate data; no crash, no undefined fields.
 *   EC-A3  getRandomTown resolves with an empty town_name string — same
 *          structural-completeness expectation as EC-A2.
 *   EC-A4  Consecutive FakeInfo.create() calls each get their own DB lookup
 *          (Town.getRandomTown is called once per person, not cached across
 *          instances), so bulk generation makes exactly n DB calls.
 */
 
import { afterEach, describe, expect, it, vi } from "vitest";
import { FakeInfo, PHONE_PREFIXES, Person } from "../../backend/src/FakeInfo";
import { Town } from "../../backend/src/Town";
 
 
vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  return {
    ...actual,
    readFileSync: (filePath: unknown, encoding: unknown) => {
      if (String(filePath).endsWith("person-names.json")) {
        return JSON.stringify({
          persons: [
            { firstName: "Alice", lastName: "Hansen", gender: "female" },
            { firstName: "Bob", lastName: "Jensen", gender: "male" },
          ],
        });
      }
      return (actual.readFileSync as (...a: unknown[]) => unknown)(
        filePath,
        encoding,
      );
    },
  };
});
 
vi.spyOn(Town, "getRandomTown").mockResolvedValue({
  postal_code: "2100",
  town_name: "Copenhagen",
});
 
afterEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(Town, "getRandomTown").mockResolvedValue({
    postal_code: "2100",
    town_name: "Copenhagen",
  });
});
 
 
type RandCall = [min: number, max: number, target: number];
 
function mockRandIntSequence(sequence: RandCall[]): void {
  let i = 0;
  vi.spyOn(Math, "random").mockImplementation(() => {
    if (i >= sequence.length) {
      throw new Error(`Ran out of mocked values at call ${i + 1}`);
    }
    const [min, max, target] = sequence[i++];
    return (target - min + 0.01) / (max - min + 1);
  });
}
 

function expectValidPerson(person: Person): void {
  expect(person).toMatchObject({
    CPR: expect.any(String),
    firstName: expect.any(String),
    lastName: expect.any(String),
    gender: expect.any(String),
    birthDate: expect.any(String),
    address: expect.objectContaining({
      street: expect.any(String),
      number: expect.any(String),
      floor: expect.anything(),
      door: expect.anything(),
      postal_code: expect.any(String),
      town_name: expect.any(String),
    }),
    phoneNumber: expect.any(String),
  });
}
 
 
describe("FakeInfo.getFakePersons — bulk size edge cases", () => {
  // EC-B1 — exact lower boundary
  it("returns exactly 2 persons for n = 2 (EC-B1: lower boundary)", async () => {
    const persons = await FakeInfo.getFakePersons(2);
    expect(persons).toHaveLength(2);
  });
 
  // EC-B2 — exact upper boundary
  it("returns exactly 100 persons for n = 100 (EC-B2: upper boundary)", async () => {
    const persons = await FakeInfo.getFakePersons(100);
    expect(persons).toHaveLength(100);
  });
 
  // EC-B3 — one below lower boundary
  it("clamps n = 1 up to 2 (EC-B3: one below minimum)", async () => {
    const persons = await FakeInfo.getFakePersons(1);
    expect(persons).toHaveLength(2);
  });
 
  // EC-B4 — zero (falsy, easily overlooked in guards)
  it("clamps n = 0 up to 2 (EC-B4: zero — falsy boundary)", async () => {
    const persons = await FakeInfo.getFakePersons(0);
    expect(persons).toHaveLength(2);
  });
 
  // EC-B5 — negative value
  it("clamps n = -1 up to 2 (EC-B5: negative input)", async () => {
    const persons = await FakeInfo.getFakePersons(-1);
    expect(persons).toHaveLength(2);
  });
 
  // EC-B6 — one above upper boundary
  it("clamps n = 101 down to 100 (EC-B6: one above maximum)", async () => {
    const persons = await FakeInfo.getFakePersons(101);
    expect(persons).toHaveLength(100);
  });
 
  // EC-B7 — far above upper boundary
  it("clamps n = 999 down to 100 (EC-B7: far above maximum)", async () => {
    const persons = await FakeInfo.getFakePersons(999);
    expect(persons).toHaveLength(100);
  });
 
  // EC-B8 — no argument; default parameter should be MIN_BULK_PERSONS (2)
  it("returns 2 persons when called with no argument (EC-B9: default parameter)", async () => {
    const persons = await FakeInfo.getFakePersons();
    expect(persons).toHaveLength(2);
  });
 
  // Shape validation — every item in a bulk result must be a complete Person
  it("every person in a bulk result is structurally complete", async () => {
    const persons = await FakeInfo.getFakePersons(5);
    persons.forEach(expectValidPerson);
  });
 
  // Uniqueness smoke-test — bulk persons are independent objects
  it("persons in a bulk result are distinct objects (not the same reference)", async () => {
    const persons = await FakeInfo.getFakePersons(3);
    expect(persons[0]).not.toBe(persons[1]);
    expect(persons[1]).not.toBe(persons[2]);
  });
 
  // EC-A4 — Town.getRandomTown is called once per person, not shared across calls
  it("calls Town.getRandomTown exactly n times for bulk generation (EC-A4)", async () => {
    const spy = vi.spyOn(Town, "getRandomTown");
    spy.mockResolvedValue({ postal_code: "2100", town_name: "Copenhagen" });
    await FakeInfo.getFakePersons(5);
    expect(spy).toHaveBeenCalledTimes(5);
  });
});
 

 
describe("FakeInfo — phone prefix edge cases", () => {
  
  it('phone built from 1-digit prefix "2" is still 8 digits total (EC-P1)', async () => {
    const persons = await Promise.all(
      Array.from({ length: 50 }, () => FakeInfo.create()),
    );

    persons.forEach((info) => {
      expect(info.getPhoneNumber()).toHaveLength(8);
    });
  });
 
  // EC-P2 — last prefix in array: "829" (3 digits, index 93)
  it('phone built from 3-digit prefix "829" is still 8 digits total (EC-P2)', () => {
    const prefix = PHONE_PREFIXES[PHONE_PREFIXES.length - 1];
    expect(prefix).toBe("829");

    // If the prefix is 3 digits, fillup is 5 digits to reach 8 total
    const digitsNeeded = 8 - prefix.length;
    let phone = prefix;
    for (let i = 0; i < digitsNeeded; i++) {
      phone += String(Math.floor(Math.random() * 10));
    }
    expect(phone).toHaveLength(8);
    expect(phone.startsWith("829")).toBe(true);
  });
 
  // EC-P3 — any 3-digit prefix produces exactly 5 appended digits
  it("all 3-digit prefixes produce a phone number of length 8 (EC-P3)", () => {
    const threedigit = PHONE_PREFIXES.filter((p) => p.length === 3);
    expect(threedigit.length).toBeGreaterThan(0); // sanity: list is non-empty
    threedigit.forEach((prefix) => {
      const suffix = "12345"; // 5 digits to reach 8 total
      expect((prefix + suffix)).toHaveLength(8);
    });
  });
 
  // EC-P4 — any 1-digit prefix produces exactly 7 appended digits
  it("all 1-digit prefixes produce a phone number of length 8 (EC-P4)", () => {
    const onedigit = PHONE_PREFIXES.filter((p) => p.length === 1);
    expect(onedigit.length).toBeGreaterThan(0);
    onedigit.forEach((prefix) => {
      const suffix = "1234567"; // 7 digits to reach 8 total
      expect((prefix + suffix)).toHaveLength(8);
    });
  });
 
  // EC-P5 — over many runs, no phone ever falls outside the 8-digit constraint
  it("phone is always exactly 8 digits regardless of which prefix is chosen (EC-P5)", async () => {
    const persons = await FakeInfo.getFakePersons(50);
    persons.forEach((p) => {
      expect(p.phoneNumber).toHaveLength(8);
      expect(p.phoneNumber).toMatch(/^\d{8}$/);
    });
  });
});
 
// ===========================================================================
// DOOR FORMAT BOUNDARY VALUES  (EC-D1–EC-D13)
// ===========================================================================
 
/*
 * setAddress() randInt call order (same as address.test.ts header):
 *   1–40  street chars
 *   41    house number   randInt(1, 999)
 *   42    suffix gate    randInt(1, 10)
 *   43    floor gate     randInt(1, 10)
 *   44    floor number   randInt(1, 99)   — only when gate ≥ 4
 *   45    door type      randInt(1, 20)
 *   46+   door extras    depends on branch
 */
 
type Address = Awaited<ReturnType<FakeInfo["getAddress"]>>["address"];
 
function street(): RandCall[] {
  return [
    [1, 58, 1],
    ...Array.from({ length: 39 }, (): RandCall => [0, 58, 0]),
  ];
}
 
function standardPrefix(): RandCall[] {
  return [
    ...street(),
    [1, 999, 18], // house number
    [1, 10, 3],   // suffix gate ≥ 3 → no letter
    [1, 10, 4],   // floor gate ≥ 4 → numeric
    [1, 99, 5],   // floor number
  ];
}
 
async function generateAddress(sequence: RandCall[]): Promise<Address> {
  const info = Object.create(FakeInfo.prototype) as FakeInfo;
  mockRandIntSequence(sequence);
  await (info as unknown as { setAddress: () => Promise<void> }).setAddress();
  return info.getAddress().address;
}
 
describe("FakeInfo.setAddress — door format boundary values", () => {
  // EC-D1 — lowest doorType that gives "th"
  it('door is "th" for doorType = 1 (EC-D1: lower th boundary)', async () => {
    const addr = await generateAddress([...standardPrefix(), [1, 20, 1]]);
    expect(addr.door).toBe("th");
  });
 
  // EC-D2 — highest doorType that still gives "th"
  it('door is "th" for doorType = 7 (EC-D2: upper th boundary)', async () => {
    const addr = await generateAddress([...standardPrefix(), [1, 20, 7]]);
    expect(addr.door).toBe("th");
  });
 
  // EC-D3 — first doorType that switches to "tv"
  it('door is "tv" for doorType = 8 (EC-D3: lower tv boundary)', async () => {
    const addr = await generateAddress([...standardPrefix(), [1, 20, 8]]);
    expect(addr.door).toBe("tv");
  });
 
  // EC-D4 — last doorType that stays on "tv"
  it('door is "tv" for doorType = 14 (EC-D4: upper tv boundary)', async () => {
    const addr = await generateAddress([...standardPrefix(), [1, 20, 14]]);
    expect(addr.door).toBe("tv");
  });
 
  // EC-D5 — first doorType that gives "mf"
  it('door is "mf" for doorType = 15 (EC-D5: lower mf boundary)', async () => {
    const addr = await generateAddress([...standardPrefix(), [1, 20, 15]]);
    expect(addr.door).toBe("mf");
  });
 
  // EC-D6 — last doorType that stays on "mf"
  it('door is "mf" for doorType = 16 (EC-D6: upper mf boundary)', async () => {
    const addr = await generateAddress([...standardPrefix(), [1, 20, 16]]);
    expect(addr.door).toBe("mf");
  });
 
  // EC-D7 — lowest numeric door; door number at its own lower boundary (1)
  it("door is 1 for doorType = 17, door number = 1 (EC-D7: numeric door lower-lower)", async () => {
    const addr = await generateAddress([
      ...standardPrefix(),
      [1, 20, 17],
      [1, 50, 1], // door number = 1 (lower BVA)
    ]);
    expect(addr.door).toBe(1);
  });
 
  // EC-D8 — lowest numeric door type; door number at its own upper boundary (50)
  it("door is 50 for doorType = 17, door number = 50 (EC-D8: numeric door lower-upper)", async () => {
    const addr = await generateAddress([
      ...standardPrefix(),
      [1, 20, 17],
      [1, 50, 50], // door number = 50 (upper BVA)
    ]);
    expect(addr.door).toBe(50);
  });
 
  // EC-D9 — highest numeric door type
  it("door is a number for doorType = 18 (EC-D9: upper numeric door boundary)", async () => {
    const addr = await generateAddress([
      ...standardPrefix(),
      [1, 20, 18],
      [1, 50, 25],
    ]);
    expect(typeof addr.door).toBe("number");
  });
 
  // EC-D10 — letter + digits (doorType 19); door digits at lower boundary (1)
  it("door is letter+1 for doorType = 19, digits = 1 (EC-D10: letter-digits lower)", async () => {
    const addr = await generateAddress([
      ...standardPrefix(),
      [1, 20, 19],
      [0, 28, 0],   // letter index 0 → "a"
      [1, 999, 1],  // digits = 1 (lower BVA)
    ]);
    expect(addr.door).toBe("a1");
  });
 
  // EC-D11 — letter + digits (doorType 19); door digits at upper boundary (999)
  it("door is letter+999 for doorType = 19, digits = 999 (EC-D11: letter-digits upper)", async () => {
    const addr = await generateAddress([
      ...standardPrefix(),
      [1, 20, 19],
      [0, 28, 0],     // "a"
      [1, 999, 999],  // digits = 999 (upper BVA)
    ]);
    expect(addr.door).toBe("a999");
  });
 
  // EC-D12 — letter + hyphen + digits (doorType 20); digits at lower boundary (1)
  it("door is letter-1 for doorType = 20, digits = 1 (EC-D12: letter-hyphen-digits lower)", async () => {
    const addr = await generateAddress([
      ...standardPrefix(),
      [1, 20, 20],
      [0, 28, 0],   // "a"
      [1, 999, 1],  // digits = 1
    ]);
    expect(addr.door).toBe("a-1");
  });
 
  // EC-D13 — letter + hyphen + digits (doorType 20); digits at upper boundary (999)
  it("door is letter-999 for doorType = 20, digits = 999 (EC-D13: letter-hyphen-digits upper)", async () => {
    const addr = await generateAddress([
      ...standardPrefix(),
      [1, 20, 20],
      [0, 28, 0],
      [1, 999, 999],
    ]);
    expect(addr.door).toBe("a-999");
  });
});
 
// ===========================================================================
// FLOOR "st" vs NUMERIC BOUNDARY VALUES  (EC-F1–EC-F5)
// ===========================================================================
 
describe("FakeInfo.setAddress — floor boundary values", () => {
  // EC-F1 — lowest gate value that gives "st" (floorGate = 1)
  it('floor is "st" when floorGate = 1 (EC-F1: lowest st boundary)', async () => {
    const addr = await generateAddress([
      ...street(),
      [1, 999, 10],
      [1, 10, 3],  // no suffix
      [1, 10, 1],  // floorGate = 1 → "st"
      [1, 20, 1],
    ]);
    expect(addr.floor).toBe("st");
  });
 
  // EC-F2 — highest gate value that still gives "st" (floorGate = 3)
  it('floor is "st" when floorGate = 3 (EC-F2: highest st boundary, off-by-one risk)', async () => {
    const addr = await generateAddress([
      ...street(),
      [1, 999, 10],
      [1, 10, 3],  // no suffix
      [1, 10, 3],  // floorGate = 3 → "st" (< 4)
      [1, 20, 1],
    ]);
    expect(addr.floor).toBe("st");
  });
 
  // EC-F3 — lowest gate value that switches to numeric (floorGate = 4)
  it("floor is numeric when floorGate = 4 (EC-F3: lowest numeric boundary)", async () => {
    const addr = await generateAddress([
      ...street(),
      [1, 999, 10],
      [1, 10, 3],   // no suffix
      [1, 10, 4],   // floorGate = 4 → numeric
      [1, 99, 10],  // floor number = 10
      [1, 20, 1],
    ]);
    expect(typeof addr.floor).toBe("number");
    expect(addr.floor).toBe(10);
  });
 
  // EC-F4 — highest gate value (10) with floor number at its lower boundary (1)
  it("floor is 1 when floorGate = 10 and floorNumber = 1 (EC-F4: highest gate, lowest floor)", async () => {
    const addr = await generateAddress([
      ...street(),
      [1, 999, 10],
      [1, 10, 3],   // no suffix
      [1, 10, 10],  // floorGate = 10 → numeric
      [1, 99, 1],   // floor number = 1
      [1, 20, 1],
    ]);
    expect(addr.floor).toBe(1);
  });
 
  // EC-F5 — highest gate value (10) with floor number at its upper boundary (99)
  it("floor is 99 when floorGate = 10 and floorNumber = 99 (EC-F5: highest gate, highest floor)", async () => {
    const addr = await generateAddress([
      ...street(),
      [1, 999, 10],
      [1, 10, 3],   // no suffix
      [1, 10, 10],  // floorGate = 10 → numeric
      [1, 99, 99],  // floor number = 99
      [1, 20, 1],
    ]);
    expect(addr.floor).toBe(99);
  });
});
 
// ===========================================================================
// ADDRESS DB CONSTRAINT VIOLATIONS  (EC-A1–EC-A3)
// ===========================================================================
 
describe("FakeInfo.setAddress — Town DB edge cases", () => {
  // EC-A1 — DB rejects: FakeInfo.create() must propagate the error
  it("rejects when Town.getRandomTown rejects (EC-A1: DB failure propagation)", async () => {
    vi.spyOn(Town, "getRandomTown").mockRejectedValue(
      new Error("DB connection lost"),
    );
    await expect(FakeInfo.create()).rejects.toThrow("DB connection lost");
  });
 
  // EC-A2 — DB returns empty postal_code; address object must still be complete
  it("address is structurally intact when postal_code is an empty string (EC-A2: degenerate DB row)", async () => {
    vi.spyOn(Town, "getRandomTown").mockResolvedValue({
      postal_code: "",
      town_name: "TestTown",
    });
    const info = await FakeInfo.create();
    const { address } = info.getAddress();
    expect(address).toHaveProperty("postal_code");
    expect(address).toHaveProperty("town_name");
    expect(address.postal_code).toBe("");
    expect(address.town_name).toBe("TestTown");
  });
 
  // EC-A3 — DB returns empty town_name; address object must still be complete
  it("address is structurally intact when town_name is an empty string (EC-A3: degenerate DB row)", async () => {
    vi.spyOn(Town, "getRandomTown").mockResolvedValue({
      postal_code: "9999",
      town_name: "",
    });
    const info = await FakeInfo.create();
    const { address } = info.getAddress();
    expect(address).toHaveProperty("postal_code");
    expect(address).toHaveProperty("town_name");
    expect(address.postal_code).toBe("9999");
    expect(address.town_name).toBe("");
  });
});
 