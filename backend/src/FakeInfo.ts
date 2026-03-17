/**
 * Generates information about fake Danish persons.
 * Uses a static async factory method (create()) because the address
 * generation requires an async DB call that a constructor cannot await.
 *
 * @author  Arturo Mora-Rioja (original PHP)
 * @version 1.0.0 TypeScript port
 */
import * as fs from "fs";
import * as path from "path";
import { Town } from "./Town";

const GENDER_FEMININE = "female";

const FILE_PERSON_NAMES = path.join(
  __dirname,
  "../../data/person-names.json",
);

export const PHONE_PREFIXES = [
  "2",
  "30",
  "31",
  "40",
  "41",
  "42",
  "50",
  "51",
  "52",
  "53",
  "60",
  "61",
  "71",
  "81",
  "91",
  "92",
  "93",
  "342",
  "344",
  "345",
  "346",
  "347",
  "348",
  "349",
  "356",
  "357",
  "359",
  "362",
  "365",
  "366",
  "389",
  "398",
  "431",
  "441",
  "462",
  "466",
  "468",
  "472",
  "474",
  "476",
  "478",
  "485",
  "486",
  "488",
  "489",
  "493",
  "494",
  "495",
  "496",
  "498",
  "499",
  "542",
  "543",
  "545",
  "551",
  "552",
  "556",
  "571",
  "572",
  "573",
  "574",
  "577",
  "579",
  "584",
  "586",
  "587",
  "589",
  "597",
  "598",
  "627",
  "629",
  "641",
  "649",
  "658",
  "662",
  "663",
  "664",
  "665",
  "667",
  "692",
  "693",
  "694",
  "697",
  "771",
  "772",
  "782",
  "783",
  "785",
  "786",
  "788",
  "789",
  "826",
  "827",
  "829",
];

const MIN_BULK_PERSONS = 2;
const MAX_BULK_PERSONS = 100;

interface Address {
  street: string;
  number: string;
  floor: string | number;
  door: string | number;
  postal_code: string;
  town_name: string;
}

export interface Person {
  CPR: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  address: Address;
  phoneNumber: string;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDigit(): string {
  return String(randInt(0, 9));
}

/**
 * Returns a random text of the given length using alphabetic characters and the space.
 * The first character is never a space.
 */
function getRandomText(
  length: number = 1,
  includeDanishCharacters: boolean = true,
): string {
  const validCharacters = [
    " ",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
  ];
  if (includeDanishCharacters) {
    validCharacters.push("æ", "ø", "å", "Æ", "Ø", "Å");
  }
  // Start from index 1 to avoid leading space
  let text = validCharacters[randInt(1, validCharacters.length - 1)];
  for (let i = 1; i < length; i++) {
    text += validCharacters[randInt(0, validCharacters.length - 1)];
  }
  return text;
}

export class FakeInfo {
  private cpr!: string;
  private firstName!: string;
  private lastName!: string;
  private gender!: string;
  private birthDate!: string;
  private address!: Address;
  private phone!: string;

  private constructor() {}

  /**
   * Factory method — use instead of `new FakeInfo()` because address
   * generation requires an async database call.
   */
  static async create(): Promise<FakeInfo> {
    const info = new FakeInfo();
    info.setFullNameAndGender();
    info.setBirthDate();
    info.setCpr();
    await info.setAddress();
    info.setPhone();
    return info;
  }

  /**
   * Picks a random person from the JSON file to obtain first name, last name, and gender.
   */
  private setFullNameAndGender(): void {
    const names = JSON.parse(fs.readFileSync(FILE_PERSON_NAMES, "utf-8"));
    const person = names.persons[randInt(0, names.persons.length - 1)];
    this.firstName = person.firstName;
    this.lastName = person.lastName;
    this.gender = person.gender;
  }

  /**
   * Generates a random birth date between 1900 and the current year.
   * Leap years are not taken into account (Feb capped at 28 days).
   */
  private setBirthDate(): void {
    const year = randInt(1900, new Date().getFullYear());
    const month = randInt(1, 12);
    let day: number;
    if ([1, 3, 5, 7, 8, 10, 12].includes(month)) {
      day = randInt(1, 31);
    } else if ([4, 6, 9, 11].includes(month)) {
      day = randInt(1, 30);
    } else {
      day = randInt(1, 28);
    }
    const d = new Date(year, month - 1, day);
    this.birthDate = d.toISOString().slice(0, 10);
  }

  /**
   * Generates a CPR number from the existing birth date and gender.
   * Format: DDMMYY + 4 digits. Last digit is even for females, odd for males.
   */
  private setCpr(): void {
    let finalDigit = randInt(0, 9);
    if (this.gender === GENDER_FEMININE && finalDigit % 2 === 1) {
      finalDigit++;
    }
    this.cpr =
      this.birthDate.slice(8, 10) + // DD
      this.birthDate.slice(5, 7) + // MM
      this.birthDate.slice(2, 4) + // YY (last two digits)
      getRandomDigit() +
      getRandomDigit() +
      getRandomDigit() +
      String(finalDigit);
  }

  /**
   * Generates a random Danish address and fetches a postal code / town from the DB.
   */
  private async setAddress(): Promise<void> {
    this.address = {} as Address;

    this.address.street = getRandomText(40);

    this.address.number = String(randInt(1, 999));
    // ~20% of addresses include a letter suffix
    if (randInt(1, 10) < 3) {
      this.address.number += getRandomText(1, false).toUpperCase();
    }

    // ~30% of addresses are on the ground floor
    if (randInt(1, 10) < 4) {
      this.address.floor = "st";
    } else {
      this.address.floor = randInt(1, 99);
    }

    /*
     * Door distribution (PHP-compatible):
     *   1-7   (35%) → th
     *   8-14  (35%) → tv
     *   15-16 (10%) → mf
     *   17-18 (10%) → 1-50
     *   19     (5%) → lowercase_letter + 1-999
     *   20     (5%) → lowercase_letter + '-' + 1-999
     */
    const doorType = randInt(1, 20);
    if (doorType < 8) {
      this.address.door = "th";
    } else if (doorType < 15) {
      this.address.door = "tv";
    } else if (doorType < 17) {
      this.address.door = "mf";
    } else if (doorType < 19) {
      this.address.door = randInt(1, 50);
    } else {
      const lowerCaseLetters = [
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
        "q",
        "r",
        "s",
        "t",
        "u",
        "v",
        "w",
        "x",
        "y",
        "z",
        "ø",
        "æ",
        "å",
      ];
      let door = lowerCaseLetters[randInt(0, lowerCaseLetters.length - 1)];
      if (doorType === 20) {
        door += "-";
      }
      door += String(randInt(1, 999));
      this.address.door = door;
    }

    const town = await Town.getRandomTown();
    this.address.postal_code = town.postal_code;
    this.address.town_name = town.town_name;
  }

  /**
   * Generates a fake Danish phone number using an official prefix list.
   * Total length is 8 digits.
   */
  private setPhone(): void {
    let phone = PHONE_PREFIXES[randInt(0, PHONE_PREFIXES.length - 1)];
    const digitsNeeded = 8 - phone.length;
    for (let i = 0; i < digitsNeeded; i++) {
      phone += getRandomDigit();
    }
    this.phone = phone;
  }

  // ---- Public getters ----

  getCpr(): string {
    return this.cpr;
  }

  getFullNameAndGender(): {
    firstName: string;
    lastName: string;
    gender: string;
  } {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      gender: this.gender,
    };
  }

  getFullNameGenderAndBirthDate(): {
    firstName: string;
    lastName: string;
    gender: string;
    birthDate: string;
  } {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      gender: this.gender,
      birthDate: this.birthDate,
    };
  }

  getCprFullNameAndGender(): {
    CPR: string;
    firstName: string;
    lastName: string;
    gender: string;
  } {
    return {
      CPR: this.cpr,
      firstName: this.firstName,
      lastName: this.lastName,
      gender: this.gender,
    };
  }

  getCprFullNameGenderAndBirthDate(): {
    CPR: string;
    firstName: string;
    lastName: string;
    gender: string;
    birthDate: string;
  } {
    return {
      CPR: this.cpr,
      firstName: this.firstName,
      lastName: this.lastName,
      gender: this.gender,
      birthDate: this.birthDate,
    };
  }

  getAddress(): { address: Address } {
    return { address: this.address };
  }

  getPhoneNumber(): string {
    return this.phone;
  }

  getFakePerson(): Person {
    return {
      CPR: this.cpr,
      firstName: this.firstName,
      lastName: this.lastName,
      gender: this.gender,
      birthDate: this.birthDate,
      address: this.address,
      phoneNumber: this.phone,
    };
  }

  static async getFakePersons(
    amount: number = MIN_BULK_PERSONS,
  ): Promise<Person[]> {
    if (amount < MIN_BULK_PERSONS) amount = MIN_BULK_PERSONS;
    if (amount > MAX_BULK_PERSONS) amount = MAX_BULK_PERSONS;

    const persons: Person[] = [];
    for (let i = 0; i < amount; i++) {
      const info = await FakeInfo.create();
      persons.push(info.getFakePerson());
    }
    return persons;
  }
}
