import { expect, test, describe, vi } from "vitest";
import { sayHello } from "../src/index.ts";

describe("Testing sayHello", () => {
    test("Should say hello to ruslan", () => {
        using consoleLogSpy = vi.spyOn(console, "log");
        expect(sayHello("Ruslan")).toBe(undefined);
        expect(consoleLogSpy).toHaveBeenCalledWith("Hello, Ruslan");
    });
});
