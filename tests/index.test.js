import { expect, test, describe } from "vitest"
import {sayHello} from "../src/index.ts"


test("Testing sayHello", () => {
    expect(sayHello("Ruslan")).toBe(undefined)
})