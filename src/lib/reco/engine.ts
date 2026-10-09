import type { Goal } from "@/lib/profile/domain";

export type BmiCategory = "underweight" | "normal" | "overweight" | "obese";

export type GuidanceAction = {
  id: string;
  title: string;
  reason: string;
  href: "/profile" | "/tools/calories" | "/tools/tracking/weight";
};

export type Recommendation = {
  summary: string;
  focus: string[];
  limit: string[];
  mealIdeas: string[];
  priorities: string[];
  foodsToFocus: string[];
  foodsToLimit: string[];
  nextSteps: string[];
  actions: GuidanceAction[];
  warnings: string[];
  guidanceMode: "general" | "goal-review";
  contentVersion: string;
  mealIdeasNote: string;
  sources: { title: string; url: string }[];
};

// General guidance for the adult BMI flow. The caller must establish age
// eligibility separately; BMI and the selected goal cannot establish it.
export function buildRecommendations(params: {
  bmi: number;
  category: BmiCategory;
  goal: Goal;
}): Recommendation {
  const { bmi, category, goal } = params;
  if (!Number.isFinite(bmi) || bmi <= 0) throw new Error("A valid BMI is required.");

  const requiresGoalReview = category === "underweight" && goal !== "gain"
    || (category === "overweight" || category === "obese") && goal === "gain";
  const rangeSummary: Record<BmiCategory, string> = {
    underweight: "Your BMI is in the underweight range.",
    normal: "Your BMI is in the healthy range for adult BMI screening.",
    overweight: "Your BMI is in the overweight range.",
    obese: "Your BMI is in the obesity range.",
  };

  const goalTitles: Record<Goal, string> = {
    lose: "Use your current target calories as a planning guide",
    gain: "Use target calories alongside suitable strength training",
    maintain: "Use your target calories and keep routines consistent",
  };
  const firstAction: GuidanceAction = requiresGoalReview ? {
    id: "review-goal",
    title: "Review your goal before changing your intake",
    reason: "Your selected goal and adult BMI range need an individual review. Speak with a qualified health professional before following a weight-change target.",
    href: "/profile",
  } : {
    id: "review-targets",
    title: goalTitles[goal],
    reason: "Your saved plan already contains calorie and nutrient estimates. Avoid adding a separate surplus or deficit from general advice.",
    href: "/tools/calories",
  };

  const actions: GuidanceAction[] = [firstAction, {
    id: "record-weight",
    title: "Record your next measurement in similar conditions",
    reason: "A single measurement does not establish a trend. Consistent records help you review changes over time.",
    href: "/tools/tracking/weight",
  }];
  const foodsToFocus = [
    "Vegetables and fruit: choose a variety of locally available options",
    "Protein sources: beans, lentils, eggs or fish, as suitable for you",
    "Whole grains and starchy foods: wholegrain maize, oats or sweet potatoes",
    "Unsaturated fats: avocado, seeds or nuts, where suitable",
  ];
  const foodsToLimit = [
    "Frequent sugary drinks",
    "Foods high in salt and added sugar",
    "Frequent deep-fried foods",
  ];
  const priorities = [
    "Build varied meals from foods you can access and afford",
    "Choose one manageable habit to practise consistently",
    "Review changes over time rather than judging a single measurement",
  ];
  const warnings = [
    "BMI is a screening measure, not a diagnosis or a complete assessment of your nutritional needs.",
    "This guidance does not account for pregnancy, medical conditions, medicines or eating disorder history. Get individual advice where relevant.",
  ];
  if (requiresGoalReview) warnings.unshift(firstAction.reason);

  return {
    summary: `${rangeSummary[category]} (BMI: ${bmi.toFixed(1)}) ${requiresGoalReview
      ? "Review your goal with a qualified health professional before following weight-change targets."
      : "Use your plan alongside varied meals and consistent routines."}`,
    focus: foodsToFocus,
    limit: foodsToLimit,
    mealIdeas: [
      "Beans or lentils with wholegrain maize and leafy vegetables",
      "Sweet potatoes with beans or eggs and seasonal vegetables",
      "Oat or millet porridge with fruit and plain yoghurt or a suitable alternative",
    ],
    mealIdeasNote: "Examples, not a prescribed meal plan. Adapt ingredients to allergies, dietary needs, preferences and availability. Portions and nutrient totals have not been calculated.",
    priorities,
    foodsToFocus,
    foodsToLimit,
    nextSteps: actions.map((action) => action.title),
    actions,
    warnings,
    guidanceMode: requiresGoalReview ? "goal-review" : "general",
    contentVersion: "2026-10-07.1",
    sources: [
      { title: "WHO: Healthy diet", url: "https://www.who.int/en/news-room/fact-sheets/detail/healthy-diet" },
      { title: "WHO: Obesity and overweight", url: "https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight" },
    ],
  };
}
