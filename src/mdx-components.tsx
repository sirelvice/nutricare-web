import type { MDXComponents } from "mdx/types";
import Link from "next/link";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => <h1 className="text-3xl font-semibold tracking-tight">{children}</h1>,
    h2: ({ children }) => <h2 className="mt-8 text-2xl font-semibold">{children}</h2>,
    p: ({ children }) => <p className="mt-4 text-slate-700 leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="mt-4 list-disc pl-5 text-slate-700">{children}</ul>,
    li: ({ children }) => <li className="mt-2">{children}</li>,
    a: ({ href, children }) =>
      href ? (
        <Link className="text-slate-900 underline underline-offset-4" href={href}>
          {children}
        </Link>
      ) : (
        <span>{children}</span>
      ),
    ...components,
  };
}
