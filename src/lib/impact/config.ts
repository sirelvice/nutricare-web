export type ImpactMetric = {
  label: string;
  value: string;
  note: string;
};

// No verified programme totals have been published. Do not invent metrics.
export const impactMetrics: ImpactMetric[] = [];

export const impactNarrative = {
  title: "A clear approach to measuring impact",
  body: [
    "NutriCare helps people understand saved nutrition targets and track their weight over time.",
    "Programme results have not been published. Product activity alone does not demonstrate better health outcomes.",
  ],
};

export const impactMeasures = [
  {
    title: "What the product supports",
    items: ["Personal profiles and saved nutrition targets", "Weight history and progress guidance", "Personal PDF reports"],
  },
  {
    title: "What a pilot would assess",
    items: ["Whether people can use the tools consistently", "Whether guidance is understandable and useful", "Outcomes agreed with partners before a pilot begins"],
  },
  {
    title: "Boundaries",
    items: ["Calculations and guidance are not a medical diagnosis", "Account records are separate from public impact information", "Programme reporting requires agreed measures and data safeguards"],
  },
];
