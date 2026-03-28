import { afterEach, describe, expect, it, vi } from "vitest";
import { FakeInfo, Address } from "../../backend/src/FakeInfo";
import { Town } from "../../backend/src/Town";

/*
 * How these tests work
 * --------------------
 * setAddress() is private and relies on randInt(min, max), which internally
 * calls Math.random(). By mocking Math.random we can feed a predetermined
 * sequence of values and make every randInt call return exactly what we want
 * — no production code changes needed.
 *
 * Each entry in a sequence is a [min, max, target] tuple that maps to one
 * randInt call. The mock reverse-engineers the Math.random() float that makes
 * Math.floor(Math.random() * (max - min + 1)) + min === target.
 *
 * setAddress() calls randInt in this fixed order:
 *   1.  Street name chars  — 40 calls (first char avoids leading space)
 *   2.  House number       — randInt(1, 999)
 *   3.  Letter suffix gate — randInt(1, 10);  < 3 → append uppercase letter
 *   4.  (Suffix letter)    — randInt(1, 52)   — only when gate < 3
 *   5.  Floor gate         — randInt(1, 10);  < 4 → "st" (ground floor)
 *   6.  (Floor number)     — randInt(1, 99)   — only when gate ≥ 4
 *   7.  Door type          — randInt(1, 20)   — picks which door format
 *   8+. (Door extras)      — extra draws depending on the door branch
 */

type RandCall = [min: number, max: number, target: number];

// Mock Town so no DB connection is needed.
vi.spyOn(Town, "getRandomTown").mockResolvedValue({
  postal_code: "2100",
  town_name: "Copenhagen",
});

/**
 * Replaces Math.random with a function that walks through a list of
 * [min, max, target] tuples, returning the float that makes the
 * surrounding randInt(min, max) produce `target`.
 */
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

/** 40 randInt calls that fill the street name with arbitrary characters. */
function street(): RandCall[] {
  return [
    [1, 58, 1], // first char (index > 0 to avoid leading space)
    ...Array.from({ length: 39 }, (): RandCall => [0, 58, 0]),
  ];
}

/**
 * Shared prefix for most tests: street name, house number 18 (no letter
 * suffix), and numeric floor 27. Covers steps 1-6 so only the door-type
 * draws remain.
 */
function standardPrefix(): RandCall[] {
  return [
    ...street(),
    [1, 999, 18], // house number → "18"
    [1, 10, 3], // suffix gate ≥ 3 → no letter suffix
    [1, 10, 4], // floor gate ≥ 4 → numeric floor
    [1, 99, 27], // floor number → 27
  ];
}

/** Creates a bare FakeInfo, mocks the sequence, runs setAddress, returns the address. */
async function generateAddress(sequence: RandCall[]): Promise<Address> {
  const info = Object.create(FakeInfo.prototype) as FakeInfo;
  mockRandIntSequence(sequence);
  await (info as any).setAddress();
  return info.getAddress().address;
}

afterEach(() => {
  vi.restoreAllMocks();
  // Re-apply after restoreAllMocks clears it.
  vi.spyOn(Town, "getRandomTown").mockResolvedValue({
    postal_code: "2100",
    town_name: "Copenhagen",
  });
});

describe("FakeInfo.setAddress", () => {
  // --- House-number letter suffix ---

  it("appends a letter suffix when suffix gate < 3", async () => {
    const address = await generateAddress([
      ...street(),
      [1, 999, 42], // house number
      [1, 10, 2], // suffix gate < 3 → add letter
      [1, 52, 27], // letter index → uppercased to "A"
      [1, 10, 4], // floor gate (numeric)
      [1, 99, 9], // floor number
      [1, 20, 6], // door type → "th"
    ]);
    expect(address.number).toBe("42A");
  });

  it("keeps house number plain when suffix gate ≥ 3", async () => {
    const address = await generateAddress([
      ...street(),
      [1, 999, 42], // house number
      [1, 10, 3], // suffix gate ≥ 3 → no letter
      [1, 10, 4], // floor gate
      [1, 99, 9], // floor number
      [1, 20, 6], // door type
    ]);
    expect(address.number).toBe("42");
  });

  // --- Floor ---

  it('sets floor to "st" when floor gate < 4', async () => {
    const address = await generateAddress([
      ...street(),
      [1, 999, 18], // house number
      [1, 10, 3], // no suffix
      [1, 10, 3], // floor gate < 4 → "st"
      [1, 20, 6], // door type
    ]);
    expect(address.floor).toBe("st");
  });

  it("sets a numeric floor when floor gate ≥ 4", async () => {
    const address = await generateAddress([
      // standardPrefix() already has floor gate = 4 and floor number = 27
      ...standardPrefix(),
      [1, 20, 1], // door type → "th"
    ]);
    expect(address.floor).toBe(27);
  });

  // --- Door distribution ---

  it('door is "th" for doorType 1-7', async () => {
    const address = await generateAddress([...standardPrefix(), [1, 20, 7]]);
    expect(address.door).toBe("th");
  });

  it('door is "tv" for doorType 8-14', async () => {
    const address = await generateAddress([...standardPrefix(), [1, 20, 8]]);
    expect(address.door).toBe("tv");
  });

  it('door is "mf" for doorType 15-16', async () => {
    const address = await generateAddress([...standardPrefix(), [1, 20, 15]]);
    expect(address.door).toBe("mf");
  });

  it("door is a number (1-50) for doorType 17-18", async () => {
    const address = await generateAddress([
      ...standardPrefix(),
      [1, 20, 17], // numeric door branch
      [1, 50, 33], // door number
    ]);
    expect(address.door).toBe(33);
  });

  it("door is letter + digits for doorType 19", async () => {
    const address = await generateAddress([
      ...standardPrefix(),
      [1, 20, 19],
      [0, 28, 0], // letter index → "a"
      [1, 999, 321], // digits
    ]);
    expect(address.door).toBe("a321");
  });

  it("door is letter + hyphen + digits for doorType 20", async () => {
    const address = await generateAddress([
      ...standardPrefix(),
      [1, 20, 20],
      [0, 28, 0], // letter index → "a"
      [1, 999, 321], // digits
    ]);
    expect(address.door).toBe("a-321");
  });

  // --- Boundary values: gate cutoffs ---

  it("suffix gate = 1 (lowest) still adds a letter", async () => {
    const address = await generateAddress([
      ...street(),
      [1, 999, 10],
      [1, 10, 1], // gate = 1, which is < 3 → add letter
      [1, 52, 27], // letter index → "A"
      [1, 10, 4],
      [1, 99, 5],
      [1, 20, 1],
    ]);
    expect(address.number).toBe("10A");
  });

  it("floor gate = 3 (highest for ground floor) gives 'st'", async () => {
    const address = await generateAddress([
      ...street(),
      [1, 999, 18],
      [1, 10, 3],
      [1, 10, 3], // gate = 3, which is < 4 → "st"
      [1, 20, 1],
    ]);
    expect(address.floor).toBe("st");
  });

  // --- Danish characters in door letter ---

  it("door letter can be ø (index 26)", async () => {
    const address = await generateAddress([
      ...standardPrefix(),
      [1, 20, 19],
      [0, 28, 26], // ø
      [1, 999, 5],
    ]);
    expect(address.door).toBe("ø5");
  });

  it("door letter can be æ (index 27)", async () => {
    const address = await generateAddress([
      ...standardPrefix(),
      [1, 20, 19],
      [0, 28, 27], // æ
      [1, 999, 5],
    ]);
    expect(address.door).toBe("æ5");
  });

  it("door letter can be å (index 28)", async () => {
    const address = await generateAddress([
      ...standardPrefix(),
      [1, 20, 19],
      [0, 28, 28], // å
      [1, 999, 5],
    ]);
    expect(address.door).toBe("å5");
  });

  // --- Street structure ---

  it("street is exactly 40 characters", async () => {
    const address = await generateAddress([...standardPrefix(), [1, 20, 1]]);
    expect(address.street).toHaveLength(40);
  });

  it("street does not start with a space", async () => {
    const address = await generateAddress([...standardPrefix(), [1, 20, 1]]);
    expect(address.street[0]).not.toBe(" ");
  });
});
