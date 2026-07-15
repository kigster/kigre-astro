import { describe, expect, test } from "bun:test";
import { extractJsonText, StructuredOutputError } from "./structured";

describe("extractJsonText", () => {
  test("passes through bare JSON", () => {
    expect(extractJsonText('{"ok": true}')).toBe('{"ok": true}');
  });

  test("unwraps a ```json fence", () => {
    expect(extractJsonText('```json\n{"ok": true}\n```')).toBe('{"ok": true}');
  });

  test("unwraps an unlabelled fence", () => {
    expect(extractJsonText('```\n{"ok": true}\n```')).toBe('{"ok": true}');
  });

  test("strips prose surrounding the payload", () => {
    expect(
      extractJsonText('Sure! Here is the result:\n{"ok": true}\nHope that helps.'),
    ).toBe('{"ok": true}');
  });

  test("keeps nested braces intact", () => {
    const json = '{"themes": [{"name": "a", "paperIndices": [0, 1]}]}';
    expect(extractJsonText(`prefix ${json} suffix`)).toBe(json);
  });

  test("handles a top-level array", () => {
    expect(extractJsonText("[1, 2, 3]")).toBe("[1, 2, 3]");
  });

  test("throws on an empty response", () => {
    expect(() => extractJsonText("   ")).toThrow(StructuredOutputError);
  });

  test("throws when no JSON is present", () => {
    expect(() => extractJsonText("I cannot help with that.")).toThrow(
      StructuredOutputError,
    );
  });

  test("throws on unterminated JSON", () => {
    expect(() => extractJsonText('{"ok": tr')).toThrow(StructuredOutputError);
  });
});
