import { square } from "mylib"
import { expect, it } from "vitest"

it("works", () => {
  expect(square(3)).toBe(9)
  expect(square(-5)).toBe(25)
})
