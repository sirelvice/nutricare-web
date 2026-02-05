import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { getLearnPosts } from "@/lib/content/learn";

export default function LearnPage() {
  const posts = getLearnPosts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Learn</h1>
          <p className="text-slate-600">Evidence-informed articles about nutrition and health tools.</p>
        </div>

        <Button asChild variant="outline">
          <Link href="/register">Get started</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((p) => (
          <Card key={p.slug} className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg">{p.meta.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">{p.meta.description}</p>

              <div className="flex flex-wrap gap-2">
                {p.meta.tags?.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
              </div>

              <Button asChild variant="outline">
                <Link href={`/learn/${p.slug}`}>Read</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
