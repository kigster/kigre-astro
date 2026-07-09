import { describe, expect, test } from "bun:test";
import { buildConfig } from "./cli";
import {
  latestPost,
  parsePostMeta,
  themeFromPost,
  type PostMeta,
} from "./posts";

const post = (fm: string, file = "2026-01-01--x.md") =>
  parsePostMeta(`---\n${fm}\n---\nbody`, file);

describe("parsePostMeta", () => {
  test("extracts title, tags, date, and draft", () => {
    const p = post(
      'title: "Hello World"\ndate: 2026-07-01\ntags: ["ai", "swift"]\ndraft: false',
      "2026-07-01--hello.md",
    );
    expect(p).toEqual({
      file: "2026-07-01--hello.md",
      title: "Hello World",
      tags: ["ai", "swift"],
      date: "2026-07-01",
      draft: false,
    });
  });

  test("returns null without frontmatter", () => {
    expect(parsePostMeta("just a body", "x.md")).toBeNull();
  });

  test("falls back to the filename date and defaults draft to false", () => {
    const p = post("title: T", "2025-12-31--t.md");
    expect(p?.date).toBe("2025-12-31");
    expect(p?.draft).toBe(false);
  });
});

const mk = (
  file: string,
  date: string,
  draft: boolean,
  tags: string[] = [],
): PostMeta => ({
  file,
  title: `Post ${file}`,
  tags,
  date,
  draft,
});

describe("latestPost", () => {
  const posts = [
    mk("a.md", "2026-06-01", false),
    mk("b.md", "2026-07-01", false),
    mk("c.md", "2026-07-05", true),
  ];

  test("picks the newest non-draft", () => {
    expect(latestPost(posts, { draft: false })?.file).toBe("b.md");
  });

  test("picks the newest draft when asked", () => {
    expect(latestPost(posts, { draft: true })?.file).toBe("c.md");
  });

  test("returns undefined when nothing matches", () => {
    expect(
      latestPost([mk("a.md", "2026-06-01", false)], { draft: true }),
    ).toBeUndefined();
  });
});

describe("themeFromPost", () => {
  test("prefers tags over the title", () => {
    expect(
      themeFromPost(mk("a.md", "2026-06-01", false, ["ai", "evals"])),
    ).toBe("ai, evals");
  });

  test("falls back to the title", () => {
    expect(themeFromPost(mk("a.md", "2026-06-01", false))).toBe("Post a.md");
  });
});

describe("buildConfig", () => {
  const none = () => undefined;
  const found = () => mk("b.md", "2026-07-01", false, ["ai", "agents"]);

  test("maps period and theme straight through", () => {
    expect(buildConfig({ period: 14, theme: " llms " }, none)).toEqual({
      daysBack: 14,
      theme: "llms",
    });
  });

  test("no flags → bare config", () => {
    expect(buildConfig({ period: 7 }, none)).toEqual({
      daysBack: 7,
      theme: undefined,
    });
  });

  test("--last derives the theme from the latest post", () => {
    expect(buildConfig({ period: 7, last: true }, found).theme).toBe(
      "ai, agents",
    );
  });

  test("--draft without --last throws", () => {
    expect(() => buildConfig({ period: 7, draft: true }, found)).toThrow(
      /--last/,
    );
  });

  test("--last with no matching post throws", () => {
    expect(() =>
      buildConfig({ period: 7, last: true, draft: true }, none),
    ).toThrow(/no draft post/);
  });
});
