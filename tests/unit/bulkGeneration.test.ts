import { describe, it, expect, vi } from "vitest";
import { FakeInfo, PHONE_PREFIXES } from "../../backend/src/FakeInfo";
import { Town } from "../../backend/src/Town";

// Mock the DB so no real database connection is required.
vi.spyOn(Town, "getRandomTown").mockResolvedValue({
  postal_code: "2100",
  town_name: "Copenhagen",
});

describe("FakeInfo.getFakePersons — Bulk generation (unit)", () => {
  // -------------------------------------------------------------------------
  // Valid bulk sizes: boundary values (2 and 100) and a mid-range value (50)
  // -------------------------------------------------------------------------
  describe("Valid bulk sizes (2–100)", () => {
    it("returns exactly 2 persons for minimum bulk size (boundary value)", async () => {
      const persons = await FakeInfo.getFakePersons(2);
      expect(persons).toHaveLength(2);
    });

    it("returns exactly 100 persons for maximum bulk size (boundary value)", async () => {
      const persons = await FakeInfo.getFakePersons(100);
      expect(persons).toHaveLength(100);
    });

    it("returns exactly 50 persons for a mid-range bulk size", async () => {
      const persons = await FakeInfo.getFakePersons(50);
      expect(persons).toHaveLength(50);
    });

    it("returns an array for any valid bulk size", async () => {
      const persons = await FakeInfo.getFakePersons(10);
      expect(Array.isArray(persons)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Invalid bulk sizes: values below 2 and above 100 must be rejected
  // -------------------------------------------------------------------------
  describe("Invalid bulk sizes — rejection", () => {
    it("throws RangeError when amount is 1 (just below minimum)", async () => {
      await expect(FakeInfo.getFakePersons(1)).rejects.toThrow(RangeError);
    });

    it("throws RangeError when amount is 0", async () => {
      await expect(FakeInfo.getFakePersons(0)).rejects.toThrow(RangeError);
    });

    it("throws RangeError when amount is -1 (negative)", async () => {
      await expect(FakeInfo.getFakePersons(-1)).rejects.toThrow(RangeError);
    });

    it("throws RangeError when amount is 101 (just above maximum)", async () => {
      await expect(FakeInfo.getFakePersons(101)).rejects.toThrow(RangeError);
    });

    it("throws RangeError when amount is 200 (well above maximum)", async () => {
      await expect(FakeInfo.getFakePersons(200)).rejects.toThrow(RangeError);
    });
  });

  // -------------------------------------------------------------------------
  // Person structure: every person in a bulk result must be well-formed
  // -------------------------------------------------------------------------
  describe("Person structure in bulk result", () => {
    it("each person has all required top-level fields", async () => {
      const persons = await FakeInfo.getFakePersons(2);
      for (const person of persons) {
        expect(person).toHaveProperty("CPR");
        expect(person).toHaveProperty("firstName");
        expect(person).toHaveProperty("lastName");
        expect(person).toHaveProperty("gender");
        expect(person).toHaveProperty("birthDate");
        expect(person).toHaveProperty("address");
        expect(person).toHaveProperty("phoneNumber");
      }
    });

    it("each person has all required address sub-fields", async () => {
      const persons = await FakeInfo.getFakePersons(2);
      for (const { address } of persons) {
        expect(address).toHaveProperty("street");
        expect(address).toHaveProperty("number");
        expect(address).toHaveProperty("floor");
        expect(address).toHaveProperty("door");
        expect(address).toHaveProperty("postal_code");
        expect(address).toHaveProperty("town_name");
      }
    });

    // -----------------------------------------------------------------------
    // Phone prefix boundary values: phone number must always be 8 digits and
    // start with one of the 77 valid Danish mobile prefixes (1-, 2- and
    // 3-digit prefixes such as "2", "30", "342").
    // -----------------------------------------------------------------------
    it("each person's phone number is exactly 8 digits and uses a valid prefix", async () => {
      const persons = await FakeInfo.getFakePersons(10);
      for (const { phoneNumber } of persons) {
        expect(phoneNumber).toHaveLength(8);
        expect(phoneNumber).toMatch(/^\d{8}$/);
        const hasValidPrefix = PHONE_PREFIXES.some((prefix) =>
          phoneNumber.startsWith(prefix),
        );
        expect(
          hasValidPrefix,
          `Phone number ${phoneNumber} does not start with a valid prefix`,
        ).toBe(true);
      }
    });

    // -----------------------------------------------------------------------
    // Floor "st" vs numeric: floor must be either the string "st" (ground
    // floor) or a number in the range 1–99.
    // -----------------------------------------------------------------------
    it("each person's floor is 'st' or a number between 1 and 99", async () => {
      const persons = await FakeInfo.getFakePersons(10);
      for (const { address } of persons) {
        if (typeof address.floor === "string") {
          expect(address.floor).toBe("st");
        } else {
          expect(address.floor).toBeGreaterThanOrEqual(1);
          expect(address.floor).toBeLessThanOrEqual(99);
        }
      }
    });

    // -----------------------------------------------------------------------
    // Door format variations: door must be one of the known formats:
    //   "th" | "tv" | "mf" | numeric 1–50 | letter+digits | letter-hyphen-digits
    // -----------------------------------------------------------------------
    it("each person's door matches one of the expected formats", async () => {
      const persons = await FakeInfo.getFakePersons(10);
      for (const { address } of persons) {
        const door = address.door;
        const isNamedDoor = ["th", "tv", "mf"].includes(String(door));
        const isNumericDoor =
          typeof door === "number" && door >= 1 && door <= 50;
        const isLetterNumberDoor =
          typeof door === "string" &&
          /^[a-zøæå]-?\d+$/i.test(door);
        expect(
          isNamedDoor || isNumericDoor || isLetterNumberDoor,
          `Unexpected door value: ${JSON.stringify(door)}`,
        ).toBe(true);
      }
    });
  });
});
