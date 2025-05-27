import { expect, it } from "vitest"

import { square } from "./square"

it("it works", () => {
  expect(square(3)).toBe(9)
  expect(square(-5)).toBe(25)
})
