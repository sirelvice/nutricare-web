type Goal = "lose" | "maintain" | "gain";

export function getNutritionRecommendations(input: {
  bmi: number;
  bmiLabel: string;
  goal: Goal;
}) {
  const { bmi, bmiLabel, goal } = input;

  const base = {
    summary: "",
    focus: [] as string[],
    limit: [] as string[],
    mealIdeas: [] as string[],
  };

  // BMI-based advice
  if (bmi < 18.5) {
    base.summary = "Focus on a healthy calorie surplus with protein and nutrient-dense foods.";
    base.focus.push(
      "Add a 250–400 kcal/day surplus (gradual gain)",
      "Protein with every meal (eggs, beans, fish, chicken)",
      "Healthy fats (avocado, nuts, peanut butter, olive oil)",
      "Carb + protein combos (rice + beans, ugali + stew)"
    );
    base.limit.push("Skipping meals", "Sugary drinks as a main calorie source");
    base.mealIdeas.push("Oats + milk + peanut butter", "Rice/ugali + beans + veg + avocado", "Yoghurt + banana + nuts");
  } else if (bmi < 25) {
    base.summary = "Maintain a balanced pattern: protein, fibre, and steady energy.";
    base.focus.push(
      "Protein + fibre at meals (keeps you full)",
      "Vegetables daily (variety matters)",
      "Whole grains where possible",
      "Water first; reduce sugary drinks"
    );
    base.limit.push("Frequent ultra-processed snacks", "Late heavy meals daily");
    base.mealIdeas.push("Eggs + veg + fruit", "Githeri/beans + greens", "Fish + rice + salad");
  } else if (bmi < 30) {
    base.summary = "Aim for a mild calorie deficit and high-satiety meals (protein + fibre).";
    base.focus.push(
      "Protein-forward meals (helps fullness)",
      "Fibre foods (veg, beans, whole grains)",
      "Portion awareness (especially oils and snacks)",
      "Walk daily if possible (small consistency)"
    );
    base.limit.push("Sugary drinks", "Frequent fried foods", "Constant snacking");
    base.mealIdeas.push("Beans + greens + small ugali", "Chicken/fish + veg + small rice", "Greek yoghurt + fruit");
  } else {
    base.summary = "Start with gradual, sustainable changes and consider professional guidance when possible.";
    base.focus.push(
      "Mild deficit + consistent routine (avoid extreme restriction)",
      "Protein + fibre at each meal",
      "Replace sugary drinks with water",
      "Track progress weekly, not daily stress"
    );
    base.limit.push("Sugary drinks", "High-frequency fried foods", "Large late-night meals");
    base.mealIdeas.push("Veg stew + beans + small portion starch", "Fish + greens + salad", "Oats + yoghurt + fruit");
  }

  // Goal modifier
  if (goal === "lose") {
    base.focus.unshift("Choose a mild deficit (avoid crash diets)");
  }
  if (goal === "gain") {
    base.focus.unshift("Add extra snacks (protein + carbs) between meals");
  }

  return {
    bmiLabel,
    goal,
    ...base,
  };
}
