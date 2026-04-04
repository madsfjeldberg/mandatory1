import { describe, it, expect, vi } from "vitest";
import { FakeInfo, Person } from "../../backend/src/FakeInfo";

vi.mock("../../backend/src/Town", () => ({
  Town: {
    getRandomTown: vi.fn().mockResolvedValue({
      postal_code: "1000",
      town_name: "København K",
    }),
  },
}));

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

async function createPerson(): Promise<Person> {
  return (await FakeInfo.create()).getFakePerson();
}

describe("FakeInfo — Full Person assembly (unit)", () => {
  describe("Top-level fields", () => {
    it("returns an object with all required top-level fields", async () => {
      const person = await createPerson();
      expect(person).toHaveProperty("CPR");
      expect(person).toHaveProperty("firstName");
      expect(person).toHaveProperty("lastName");
      expect(person).toHaveProperty("gender");
      expect(person).toHaveProperty("birthDate");
      expect(person).toHaveProperty("address");
      expect(person).toHaveProperty("phoneNumber");
    });

    it("all top-level fields are non-empty / truthy", async () => {
      const person = await createPerson();
      expect(person.CPR).toBeTruthy();
      expect(person.firstName).toBeTruthy();
      expect(person.lastName).toBeTruthy();
      expect(person.gender).toBeTruthy();
      expect(person.birthDate).toBeTruthy();
      expect(person.address).toBeTruthy();
      expect(person.phoneNumber).toBeTruthy();
    });
  });

  describe("birthDate field", () => {
    it("birthDate matches ISO date format YYYY-MM-DD", async () => {
      const { birthDate } = await createPerson();
      expect(birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("birthDate year is between 1900 and the current year", async () => {
      const { birthDate } = await createPerson();
      const year = parseInt(birthDate.slice(0, 4), 10);
      expect(year).toBeGreaterThanOrEqual(1900);
      expect(year).toBeLessThanOrEqual(new Date().getFullYear());
    });

    it("birthDate month is between 01 and 12", async () => {
      const { birthDate } = await createPerson();
      const month = parseInt(birthDate.slice(5, 7), 10);
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
    });

    it("birthDate day is between 01 and 31", async () => {
      const { birthDate } = await createPerson();
      const day = parseInt(birthDate.slice(8, 10), 10);
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(31);
    });
  });

  describe("address sub-fields", () => {
    it("address contains all required sub-fields", async () => {
      const { address } = await createPerson();
      expect(address).toHaveProperty("street");
      expect(address).toHaveProperty("number");
      expect(address).toHaveProperty("floor");
      expect(address).toHaveProperty("door");
      expect(address).toHaveProperty("postal_code");
      expect(address).toHaveProperty("town_name");
    });

    it("address.street is a non-empty string", async () => {
      const { address } = await createPerson();
      expect(typeof address.street).toBe("string");
      expect(address.street.length).toBeGreaterThan(0);
    });

    it("address.number is 1–3 digits with an optional single uppercase letter suffix", async () => {
      const results = await Promise.all(
        Array.from({ length: 50 }, () => createPerson()),
      );
      results.forEach(({ address }) => {
        expect(address.number).toMatch(/^\d{1,3}[A-Z]?$/);
      });
    });

    it("address.floor is 'st' or a positive integer between 1 and 99", async () => {
      const results = await Promise.all(
        Array.from({ length: 50 }, () => createPerson()),
      );
      results.forEach(({ address }) => {
        if (typeof address.floor === "string") {
          expect(address.floor).toBe("st");
        } else {
          expect(address.floor).toBeGreaterThanOrEqual(1);
          expect(address.floor).toBeLessThanOrEqual(99);
        }
      });
    });

    it("address.door is 'th', 'tv', 'mf', a number 1–50, or a letter+number pattern", async () => {
      const results = await Promise.all(
        Array.from({ length: 100 }, () => createPerson()),
      );
      results.forEach(({ address }) => {
        const door = address.door;
        const isNamedDoor = ["th", "tv", "mf"].includes(String(door));
        const isNumericDoor =
          typeof door === "number" && door >= 1 && door <= 50;
        const isLetterNumberDoor = typeof door === "string" && /^[a-zøæåA-ZØÆÅ]-?\d+$/i.test(door);
        expect(
          isNamedDoor || isNumericDoor || isLetterNumberDoor,
          `Unexpected door value: ${JSON.stringify(door)}`,
        ).toBe(true);
      });
    });

    it("address.postal_code matches the mocked value", async () => {
      const { address } = await createPerson();
      expect(address.postal_code).toBe("1000");
    });

    it("address.town_name matches the mocked value", async () => {
      const { address } = await createPerson();
      expect(address.town_name).toBe("København K");
    });
  });

  describe("Cross-field consistency", () => {
    it("CPR first 6 digits encode birthDate as DDMMYY", async () => {
      const person = await createPerson();
      const [year, month, day] = person.birthDate.split("-");
      const expectedDDMMYY = `${day}${month}${year.slice(2)}`;
      expect(person.CPR.slice(0, 6)).toBe(expectedDDMMYY);
    });

    it("CPR last digit is even when gender is female", async () => {
      const results = await Promise.all(
        Array.from({ length: 20 }, () => createPerson()),
      );
      results
        .filter((p) => p.gender === "female")
        .forEach((p) => {
          const lastDigit = parseInt(p.CPR.slice(-1), 10);
          expect(lastDigit % 2).toBe(0);
        });
    });
  });
});
