import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLearnPosts } from "@/lib/content/learn";

export const metadata = { title: "Learn", description: "Explore the ideas behind nutrition estimates, health tools and personal tracking." };

export default function LearnPage() {
  const posts = getLearnPosts();
  return <div className="space-y-12">
    <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 sm:p-10 lg:p-12">
      <BookOpen aria-hidden="true" className="absolute -right-6 -bottom-10 size-64 -rotate-12 text-emerald-700/5" strokeWidth={1} />
      <div className="relative max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">The NutriCare journal</p><h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">A little understanding.<br />A clearer way forward.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Explore the ideas behind nutrition estimates and personal tracking. Take time to understand what the tools can tell you, and where their limits begin.</p></div>
    </section>
    <section aria-labelledby="articles-title"><div className="flex flex-wrap items-end justify-between gap-4"><h2 id="articles-title" className="text-2xl font-semibold tracking-tight">Explore the articles</h2><Button asChild variant="outline"><Link href="/register">Try NutriCare</Link></Button></div>
      <div className="mt-6 border-t border-slate-200">{posts.map((post, index) => <article key={post.slug} className="grid gap-5 border-b border-slate-200 py-8 lg:grid-cols-[auto_minmax(0,0.9fr)_minmax(0,1fr)] lg:gap-10">
        <span aria-hidden="true" className="text-3xl font-light text-emerald-700/50">{String(index + 1).padStart(2, "0")}</span>
        <div><h3 className="text-2xl font-semibold tracking-tight"><Link href={`/learn/${post.slug}`} className="rounded-md underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{post.meta.title}</Link></h3><div className="mt-4 flex flex-wrap gap-2">{post.meta.tags?.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div></div>
        <div><p className="leading-7 text-slate-600">{post.meta.description}</p><Link href={`/learn/${post.slug}`} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-emerald-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Read article<span className="sr-only">: {post.meta.title}</span><ArrowUpRight aria-hidden="true" size={18} /></Link></div>
      </article>)}</div>
      {posts.length === 0 && <p className="py-8 leading-7 text-slate-600">Articles are being prepared. Explore NutriCare while the journal takes shape.</p>}
    </section>
  </div>;
}
