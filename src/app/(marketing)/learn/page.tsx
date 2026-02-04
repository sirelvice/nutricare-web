import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const articles = [
  {
    title: "Understanding BMI: what it means and what it doesn’t",
    description: "BMI is a screening tool — learn how to interpret it responsibly.",
    tag: "Basics",
  },
  {
    title: "Protein, fibre, and energy: a simple way to build meals",
    description: "A practical model for balanced meals without complicated tracking.",
    tag: "Nutrition",
  },
  {
    title: "Healthy weight change: realistic goals and safer habits",
    description: "How to set targets you can sustain and track over time.",
    tag: "Guidance",
  },
  {
    title: "Why tracking trends matters more than single numbers",
    description: "Progress is direction — learn what to measure and why.",
    tag: "Tracking",
  },
  {
    title: "Nutrition for busy schedules: small changes that work",
    description: "Simple daily actions that improve outcomes without stress.",
    tag: "Lifestyle",
  },
  {
    title: "How programs can measure outcomes responsibly",
    description: "A partner view: aggregated insights, privacy-first reporting, and pilots.",
    tag: "Partners",
  },
];

export default function LearnPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Learn</Badge>
          <Badge variant="secondary">Guides</Badge>
          <Badge variant="secondary">Resources</Badge>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Practical nutrition education, clearly explained.
        </h1>

        <p className="max-w-3xl text-slate-600">
          Short guides designed to be easy to understand and useful — for individuals, and for program teams.
        </p>
      </section>

      {/* Articles */}
      <section className="grid gap-4 md:grid-cols-3">
        {articles.map((a) => (
          <Card key={a.title} className="rounded-3xl">
            <CardHeader className="space-y-2">
              <div className="text-xs font-medium text-slate-500">{a.tag}</div>
              <CardTitle className="text-lg leading-snug">{a.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">{a.description}</p>
              <Link href="#" className="text-sm font-medium text-slate-900 hover:underline">
                Read more →
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Note */}
      <section className="rounded-3xl border bg-slate-50 p-6 text-sm text-slate-600">
        More guides are coming soon. Meanwhile, you can start with the BMI tool and explore our Impact model.
      </section>
    </div>
  );
}
