import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";

export default async function LearnPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const file = path.join(process.cwd(), "src/content/learn", `${slug}.mdx`);
  if (!fs.existsSync(file)) return notFound();

  const Post = (await import(`../../../../content/learn/${slug}.mdx`)).default;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <article className="prose prose-slate max-w-none">
        <Post />
      </article>
    </div>
  );
}
