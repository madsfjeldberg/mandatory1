import { describe, it, expect, vi } from "vitest";
import { FakeInfo } from "../../backend/src/FakeInfo";
import { Town } from "../../backend/src/Town";

// Mock DB
vi.spyOn(Town, "getRandomTown").mockResolvedValue({
    postal_code: "2100",
    town_name: "Copenhagen",
});

describe("Name + Gender + LastName from JSON", () => {

    it("should return firstName, lastName and gender", async () => {
        const person = await FakeInfo.create();
        const result = person.getFullNameAndGender();

        expect(result).toHaveProperty("firstName");
        expect(result).toHaveProperty("lastName");
        expect(result).toHaveProperty("gender");
    });

    it("should return non-empty values", async () => {
        const person = await FakeInfo.create();
        const result = person.getFullNameAndGender();

        expect(result.firstName.length).toBeGreaterThan(0);
        expect(result.lastName.length).toBeGreaterThan(0);
        expect(result.gender.length).toBeGreaterThan(0);
    });

    it("should return gender as either male or female", async () => {
        const person = await FakeInfo.create();
        const result = person.getFullNameAndGender();

        expect(["male", "female"]).toContain(result.gender);
    });

});