import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { FakeInfo, } from "../../backend/src/FakeInfo";
import {Town} from "../../backend/src/Town";

// Mocking town to avoid db call
vi.spyOn(Town, "getRandomTown").mockResolvedValue({
    postal_code: "2100",
    town_name: "Copenhagen",
});

describe("Phone number property-based test", () => {
    it("should always generate phone numbers with length of 8", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 50 }),
                async (amount: number) => {
                    const persons = await FakeInfo.getFakePersons(amount);

                    for (const person of persons) {
                        expect(person.phoneNumber.length).toBe(8);
                    }
                }
            )
        );
    });
});