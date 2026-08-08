import { describe, it, expect } from "vitest";
import { parseCsv, parseCsvWithHeader } from "./csv";

describe("parseCsv", () => {
  it("parses simple comma-separated rows", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles quoted fields containing commas", () => {
    expect(parseCsv('name,note\n"Doe, Jane",hello')).toEqual([
      ["name", "note"],
      ["Doe, Jane", "hello"],
    ]);
  });

  it("handles escaped quotes inside quoted fields", () => {
    expect(parseCsv('note\n"She said ""hi"""')).toEqual([["note"], ['She said "hi"']]);
  });

  it("skips blank lines", () => {
    expect(parseCsv("a,b\n\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("handles CRLF line endings", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("parseCsvWithHeader", () => {
  it("maps rows to objects keyed by the header", () => {
    expect(parseCsvWithHeader("matric_number,name\n2022/409799,Amara Chukwu")).toEqual([
      { matric_number: "2022/409799", name: "Amara Chukwu" },
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseCsvWithHeader("")).toEqual([]);
  });
});
