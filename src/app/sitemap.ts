import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://nutricare.app"; // change later when you know your domain

  const routes = [
    "/", "/learn", "/impact", "/partners", "/about",
    "/privacy", "/terms", "/contact",
    "/login", "/register",
  ];

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
