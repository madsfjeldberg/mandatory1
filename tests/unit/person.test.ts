import { describe, it, expect, vi } from "vitest";
import { FakeInfo, Person, PHONE_PREFIXES } from "../../backend/src/FakeInfo";
 

vi.mock("../../backend/src/Town", () => ({
  Town: {
    getRandomTown: vi.fn().mockResolvedValue({
      postal_code: "2100",
      town_name: "Copenhagen",
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
 

describe("Endpoint: /cpr — getCpr()", () => {

  it("returns a string", async () => {
    const info = await FakeInfo.create();
    expect(typeof info.getCpr()).toBe("string");
  });
 

  it("CPR has exactly 10 characters (EP — valid length partition)", async () => {
    const info = await FakeInfo.create();
    expect(info.getCpr()).toHaveLength(10);
  });
 

  it("CPR contains only numeric digits (EP — valid character class)", async () => {
    const info = await FakeInfo.create();
    expect(info.getCpr()).toMatch(/^\d{10}$/);
  });
 

  it("first six digits of CPR match the person's birth date as DDMMYY (EP — date encoding)", async () => {
    const person = await createPerson();
    const [year, month, day] = person.birthDate.split("-");
    const expectedDDMMYY = `${day}${month}${year.slice(2)}`;
    expect(person.CPR.slice(0, 6)).toBe(expectedDDMMYY);
  });
 

  it("last digit is even when gender is female (EP — gender parity rule)", async () => {
   
    const persons = await Promise.all(
      Array.from({ length: 20 }, () => createPerson()),
    );
    const females = persons.filter((p) => p.gender === "female");
    females.forEach((p) => {
      expect(parseInt(p.CPR.slice(-1), 10) % 2).toBe(0);
    });
  });
});
 

describe("Endpoint: /name-gender — getFullNameAndGender()", () => {

  it("returns an object with firstName, lastName, and gender (EP — valid shape)", async () => {
    const info = await FakeInfo.create();
    const result = info.getFullNameAndGender();
    expect(result).toHaveProperty("firstName");
    expect(result).toHaveProperty("lastName");
    expect(result).toHaveProperty("gender");
  });
 

  it("does not include CPR or birthDate (EP — scope boundary)", async () => {
    const info = await FakeInfo.create();
    const result = info.getFullNameAndGender() as Record<string, unknown>;
    expect(result).not.toHaveProperty("CPR");
    expect(result).not.toHaveProperty("birthDate");
  });
 

  it("all fields are non-empty strings (EP — valid content partition)", async () => {
    const info = await FakeInfo.create();
    const result = info.getFullNameAndGender();
    expect(result.firstName.length).toBeGreaterThan(0);
    expect(result.lastName.length).toBeGreaterThan(0);
    expect(result.gender.length).toBeGreaterThan(0);
  });
 

  it("gender is either 'male' or 'female' (EP — valid gender partition)", async () => {
    const info = await FakeInfo.create();
    expect(["male", "female"]).toContain(info.getFullNameAndGender().gender);
  });
});
 

describe("Endpoint: /name-gender-dob — getFullNameGenderAndBirthDate()", () => {
  // Valid partition: response shape contains the four expected keys
  it("returns firstName, lastName, gender, and birthDate (EP — valid shape)", async () => {
    const info = await FakeInfo.create();
    const result = info.getFullNameGenderAndBirthDate();
    expect(result).toHaveProperty("firstName");
    expect(result).toHaveProperty("lastName");
    expect(result).toHaveProperty("gender");
    expect(result).toHaveProperty("birthDate");
  });
 

  it("does not include CPR (EP — scope boundary)", async () => {
    const info = await FakeInfo.create();
    const result = info.getFullNameGenderAndBirthDate() as Record<
      string,
      unknown
    >;
    expect(result).not.toHaveProperty("CPR");
  });
 

  it("birthDate is in YYYY-MM-DD format (EP — valid date format)", async () => {
    const info = await FakeInfo.create();
    expect(info.getFullNameGenderAndBirthDate().birthDate).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
  });
 

  it("birth year is between 1900 and the current year (BVA — year boundaries)", async () => {
    const currentYear = new Date().getFullYear();

    const results = await Promise.all(
      Array.from({ length: 30 }, () => FakeInfo.create()),
    );
    results.forEach((info) => {
      const year = parseInt(
        info.getFullNameGenderAndBirthDate().birthDate.slice(0, 4),
        10,
      );
      expect(year).toBeGreaterThanOrEqual(1900);
      expect(year).toBeLessThanOrEqual(currentYear);
    });
  });
});
 

describe("Endpoint: /cpr-name-gender — getCprFullNameAndGender()", () => {

  it("returns CPR, firstName, lastName, and gender (EP — valid shape)", async () => {
    const info = await FakeInfo.create();
    const result = info.getCprFullNameAndGender();
    expect(result).toHaveProperty("CPR");
    expect(result).toHaveProperty("firstName");
    expect(result).toHaveProperty("lastName");
    expect(result).toHaveProperty("gender");
  });
 

  it("does not include birthDate (EP — scope boundary)", async () => {
    const info = await FakeInfo.create();
    const result = info.getCprFullNameAndGender() as Record<string, unknown>;
    expect(result).not.toHaveProperty("birthDate");
  });
 

  it("CPR last-digit parity is consistent with gender for females (EP — data consistency)", async () => {
    const persons = await Promise.all(
      Array.from({ length: 20 }, () => FakeInfo.create()),
    );
    persons
      .map((i) => i.getCprFullNameAndGender())
      .filter((r) => r.gender === "female")
      .forEach((r) => {
        expect(parseInt(r.CPR.slice(-1), 10) % 2).toBe(0);
      });
  });
});
 

describe("Endpoint: /cpr-name-gender-dob — getCprFullNameGenderAndBirthDate()", () => {

  it("returns CPR, firstName, lastName, gender, and birthDate (EP — valid shape)", async () => {
    const info = await FakeInfo.create();
    const result = info.getCprFullNameGenderAndBirthDate();
    expect(result).toHaveProperty("CPR");
    expect(result).toHaveProperty("firstName");
    expect(result).toHaveProperty("lastName");
    expect(result).toHaveProperty("gender");
    expect(result).toHaveProperty("birthDate");
  });
 

  it("CPR date prefix (DDMMYY) is consistent with the birthDate field (EP — cross-field consistency)", async () => {
    const info = await FakeInfo.create();
    const result = info.getCprFullNameGenderAndBirthDate();
    const [year, month, day] = result.birthDate.split("-");
    const expectedPrefix = `${day}${month}${year.slice(2)}`;
    expect(result.CPR.slice(0, 6)).toBe(expectedPrefix);
  });
 
  // Valid partition: all string fields are non-empty
  it("all string fields are non-empty (EP — valid content partition)", async () => {
    const info = await FakeInfo.create();
    const result = info.getCprFullNameGenderAndBirthDate();
    expect(result.CPR.length).toBeGreaterThan(0);
    expect(result.firstName.length).toBeGreaterThan(0);
    expect(result.lastName.length).toBeGreaterThan(0);
    expect(result.gender.length).toBeGreaterThan(0);
    expect(result.birthDate.length).toBeGreaterThan(0);
  });
});
 

describe("Endpoint: /address — getAddress()", () => {

  it("returns an object with a top-level 'address' key (EP — valid wrapper shape)", async () => {
    const info = await FakeInfo.create();
    expect(info.getAddress()).toHaveProperty("address");
  });
 

  it("address object has street, number, floor, door, postal_code, town_name (EP — valid field set)", async () => {
    const info = await FakeInfo.create();
    const { address } = info.getAddress();
    expect(address).toHaveProperty("street");
    expect(address).toHaveProperty("number");
    expect(address).toHaveProperty("floor");
    expect(address).toHaveProperty("door");
    expect(address).toHaveProperty("postal_code");
    expect(address).toHaveProperty("town_name");
  });
 

  it("does not include CPR, firstName, or phoneNumber (EP — scope boundary)", async () => {
    const info = await FakeInfo.create();
    const result = info.getAddress() as Record<string, unknown>;
    expect(result).not.toHaveProperty("CPR");
    expect(result).not.toHaveProperty("firstName");
    expect(result).not.toHaveProperty("phoneNumber");
  });
 

  it("street is a non-empty string (EP — valid content)", async () => {
    const info = await FakeInfo.create();
    expect(typeof info.getAddress().address.street).toBe("string");
    expect(info.getAddress().address.street.length).toBeGreaterThan(0);
  });
 

  it("postal_code and town_name match the mocked Town values (EP — DB delegation)", async () => {
    const info = await FakeInfo.create();
    const { address } = info.getAddress();
    expect(address.postal_code).toBe("2100");
    expect(address.town_name).toBe("Copenhagen");
  });
});
 

describe("Endpoint: /phone — getPhoneNumber()", () => {

  it("returns a string (EP — valid type partition)", async () => {
    const info = await FakeInfo.create();
    expect(typeof info.getPhoneNumber()).toBe("string");
  });
 

  it("phone number is exactly 8 digits (EP — valid length partition)", async () => {
    const info = await FakeInfo.create();
    expect(info.getPhoneNumber()).toHaveLength(8);
  });
 

  it("phone number contains only digits (EP — valid character class)", async () => {
    const info = await FakeInfo.create();
    expect(info.getPhoneNumber()).toMatch(/^\d{8}$/);
  });
 

  it("phone number starts with a valid Danish prefix (EP — valid prefix partition)", async () => {
    const info = await FakeInfo.create();
    const phone = info.getPhoneNumber();
    const hasValidPrefix = PHONE_PREFIXES.some((prefix) =>
      phone.startsWith(prefix),
    );
    expect(hasValidPrefix).toBe(true);
  });
});
 

describe("Endpoint: /person (single) — getFakePerson()", () => {

  it("contains CPR, firstName, lastName, gender, birthDate, address, and phoneNumber (EP — valid shape)", async () => {
    const person = await createPerson();
    expect(person).toHaveProperty("CPR");
    expect(person).toHaveProperty("firstName");
    expect(person).toHaveProperty("lastName");
    expect(person).toHaveProperty("gender");
    expect(person).toHaveProperty("birthDate");
    expect(person).toHaveProperty("address");
    expect(person).toHaveProperty("phoneNumber");
  });
 

  it("all string fields are non-empty (EP — valid content partition)", async () => {
    const person = await createPerson();
    expect(person.CPR.length).toBeGreaterThan(0);
    expect(person.firstName.length).toBeGreaterThan(0);
    expect(person.lastName.length).toBeGreaterThan(0);
    expect(person.gender.length).toBeGreaterThan(0);
    expect(person.birthDate.length).toBeGreaterThan(0);
    expect(person.phoneNumber.length).toBeGreaterThan(0);
  });
 

  it("CPR date prefix matches birthDate and parity matches gender for females (EP — cross-field consistency)", async () => {
    const persons = await Promise.all(
      Array.from({ length: 20 }, () => createPerson()),
    );
    persons.forEach((p) => {
    
      const [year, month, day] = p.birthDate.split("-");
      const expectedPrefix = `${day}${month}${year.slice(2)}`;
      expect(p.CPR.slice(0, 6)).toBe(expectedPrefix);
    });
  
    persons
      .filter((p) => p.gender === "female")
      .forEach((p) => {
        expect(parseInt(p.CPR.slice(-1), 10) % 2).toBe(0);
      });
  });
 

  it("address sub-object has all required fields (EP — nested shape)", async () => {
    const person = await createPerson();
    expect(person.address).toMatchObject({
      street: expect.any(String),
      number: expect.any(String),
      floor: expect.anything(),
      door: expect.anything(),
      postal_code: expect.any(String),
      town_name: expect.any(String),
    });
  });
 

  it("phoneNumber is 8 digits with a valid Danish prefix (EP — phone validity)", async () => {
    const person = await createPerson();
    expect(person.phoneNumber).toMatch(/^\d{8}$/);
    expect(PHONE_PREFIXES.some((prefix) => person.phoneNumber.startsWith(prefix))).toBe(true);
  });
 

  it("birthDate is in YYYY-MM-DD format (EP — date format)", async () => {
    const person = await createPerson();
    expect(person.birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
 
  // Valid partition: gender is 'male' or 'female'
  it("gender is 'male' or 'female' (EP — valid gender partition)", async () => {
    const person = await createPerson();
    expect(["male", "female"]).toContain(person.gender);
  });
});
 

describe("Endpoint: /person?n= (bulk) — getFakePersons()", () => {

  it("returns exactly 2 persons for n = 2 (BVA — lower boundary)", async () => {
    const persons = await FakeInfo.getFakePersons(2);
    expect(persons).toHaveLength(2);
  });
 

  it("returns exactly 100 persons for n = 100 (BVA — upper boundary)", async () => {
    const persons = await FakeInfo.getFakePersons(100);
    expect(persons).toHaveLength(100);
  });
 

  it("clamps n = 1 up to the minimum of 2 (EP — below-minimum partition)", async () => {
    const persons = await FakeInfo.getFakePersons(1);
    expect(persons.length).toBeGreaterThanOrEqual(2);
  });
 

  it("clamps n = 101 down to the maximum of 100 (EP — above-maximum partition)", async () => {
    const persons = await FakeInfo.getFakePersons(101);
    expect(persons).toHaveLength(100);
  });
 

  it("each person in the bulk result has all required fields (EP — valid shape per item)", async () => {
    const persons = await FakeInfo.getFakePersons(5);
    persons.forEach((person) => {
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
    });
  });
 

  it("result is an array (EP — valid return type)", async () => {
    const persons = await FakeInfo.getFakePersons(3);
    expect(Array.isArray(persons)).toBe(true);
  });
});