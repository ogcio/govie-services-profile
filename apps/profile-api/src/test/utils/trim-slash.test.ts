import { describe, expect, it } from "vitest";
import { trimSlash } from "../../../src/utils/trim-slash.js";

describe("trimSlash", () => {
  it("should remove trailing slashes", () => {
    const testCases = [
      { input: "path/", expected: "path" },
      { input: "path//", expected: "path" },
      { input: "path///", expected: "path" },
    ];

    for (const { input, expected } of testCases) {
      expect(trimSlash(input)).toBe(expected);
    }
  });

  it("should not modify strings without trailing slashes", () => {
    const testCases = [
      "path",
      "path/to/something",
      "http://example.com",
      "/path/with/leading/slash",
    ];

    for (const input of testCases) {
      expect(trimSlash(input)).toBe(input);
    }
  });

  it("should handle empty string", () => {
    expect(trimSlash("")).toBe("");
  });

  it("should handle single slash", () => {
    expect(trimSlash("/")).toBe("");
  });

  it("should preserve leading slashes", () => {
    const testCases = [
      { input: "/path/", expected: "/path" },
      { input: "/path//", expected: "/path" },
      { input: "//path///", expected: "//path" },
    ];

    for (const { input, expected } of testCases) {
      expect(trimSlash(input)).toBe(expected);
    }
  });
});
