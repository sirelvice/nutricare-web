import fs from "node:fs";
import path from "node:path";

export type LearnMeta = {
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  tags?: string[];
};

export type LearnPost = {
  slug: string;
  meta: LearnMeta;
};

export function getLearnPosts(): LearnPost[] {
  const dir = path.join(process.cwd(), "src/content/learn");
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  const posts: LearnPost[] = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const metaFile = path.join(dir, `${slug}.json`);

    let meta: LearnMeta = {
      title: slug,
      description: "",
      date: "1970-01-01",
      tags: [],
    };

    if (fs.existsSync(metaFile)) {
      try {
        meta = JSON.parse(fs.readFileSync(metaFile, "utf8")) as LearnMeta;
      } catch {
        // keep default meta
      }
    }

    return { slug, meta };
  });

  posts.sort((a, b) => (a.meta.date < b.meta.date ? 1 : -1));
  return posts;
}
