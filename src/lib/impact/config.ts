export type ImpactMetric = {
  label: string;
  value: string;
  note: string;
};

export const impactMetrics: ImpactMetric[] = [
  { label: "People reached", value: "—", note: "Set once pilots begin" },
  { label: "Facilities / sites", value: "—", note: "Partner implementations" },
  { label: "Screenings completed", value: "—", note: "BMI, calories, tracking" },
  { label: "Reports exported", value: "—", note: "Donor/partner snapshots" },
];

export const impactNarrative = {
  title: "Impact model",
  body: [
    "NutriCare is built to support nutrition programmes with privacy-first tools and measurable reporting.",
    "We focus on simple, explainable calculations (BMI, calories) and trend tracking (weight), with exportable summaries for partners.",
  ],
};

export const impactMeasures = [
  {
    title: "Outputs",
    items: ["Screenings completed", "Profiles saved", "Reports exported"],
  },
  {
    title: "Outcomes (pilot)",
    items: ["Improved nutrition knowledge", "Healthier meal patterns", "Weight trend improvement (where appropriate)"],
  },
  {
    title: "Safeguards",
    items: ["No medical diagnosis", "Privacy-first local storage (MVP)", "Professional guidance encouraged"],
  },
];
