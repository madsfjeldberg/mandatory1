import { describe, it, expect, vi } from "vitest";
import { FakeInfo, PHONE_PREFIXES } from "../../backend/src/FakeInfo";
import { Town } from "../../backend/src/Town";

// Mock DB
vi.spyOn(Town, "getRandomTown").mockResolvedValue({
    postal_code: "2100",
    town_name: "Copenhagen",
});

describe("Phone number tests", () => {

    it("should always generate phone numbers with length of 8", async () => {
        for (let i = 0; i < 100; i++) {
            const persons = await FakeInfo.getFakePersons(10);

            for (const person of persons) {
                expect(person.phoneNumber.length).toBe(8);
            }
        }
    });

    it("should always use a valid prefix from the list", async () => {
        for (let i = 0; i < 1000; i++) {
            const phone = (await FakeInfo.create()).getFakePerson().phoneNumber;

            const hasValidPrefix = PHONE_PREFIXES.some((prefix) =>
                phone.startsWith(prefix)
            );

            expect(hasValidPrefix).toBe(true);
        }
    });

    it("should only contain digits (no letters or symbols)", async () => {
        for (let i = 0; i < 1000; i++) {
            const phone = (await FakeInfo.create()).getFakePerson().phoneNumber;

            expect(phone).toMatch(/^\d+$/);
        }
    });

});