import { expect, test } from "bun:test";
import { OfficeToPdfError } from "../index.js";

test("OfficeToPdfError carries its name and message", () => {
  const error = new OfficeToPdfError("boom");
  expect(error.name).toBe("OfficeToPdfError");
  expect(error.message).toBe("boom");
});
