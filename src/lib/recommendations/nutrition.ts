import type { Goal } from "@/lib/profile/domain";

export function getNutritionRecommendations(input: {
  bmi: number;
  bmiLabel: string;
  goal: Goal;
}) {
  const { bmiLabel, goal } = input;

  const rec = {
    summary: "",
    focus: [] as string[],
    limit: [] as string[],
    mealIdeas: [] as string[],
  };

  const addGoalModifier = () => {
    if (goal === "lose") rec.focus.unshift("Choose a mild deficit (avoid crash diets).");
    if (goal === "gain") rec.focus.unshift("Add an extra snack (protein + carbs) between meals.");
  };

  switch (bmiLabel) {
    case "Underweight": {
      rec.summary = "Focus on a healthy calorie surplus with protein and nutrient-dense foods.";
      rec.focus.push(
        "Add a 250–400 kcal/day surplus (gradual gain)",
        "Protein with every meal (eggs, beans, fish, chicken)",
        "Healthy fats (avocado, nuts, peanut butter, olive oil)",
        "Carb + protein combos (rice + beans, ugali + stew)"
      );
      rec.limit.push("Skipping meals", "Sugary drinks as a main calorie source");
      rec.mealIdeas.push(
        "Oats + milk + peanut butter",
        "Rice/ugali + beans + veg + avocado",
        "Yoghurt + banana + nuts"
      );
      addGoalModifier();
      break;
    }

    case "Normal": {
      rec.summary = "Maintain a balanced pattern: protein, fibre, and steady energy.";
      rec.focus.push(
        "Protein + fibre at meals (keeps you full)",
        "Vegetables daily (variety matters)",
        "Whole grains where possible",
        "Water first; reduce sugary drinks"
      );
      rec.limit.push("Frequent ultra-processed snacks", "Late heavy meals daily");
      rec.mealIdeas.push("Eggs + veg + fruit", "Githeri/beans + greens", "Fish + rice + salad");
      addGoalModifier();
      break;
    }

    case "Overweight": {
      rec.summary = "Aim for a mild calorie deficit and high-satiety meals (protein + fibre).";
      rec.focus.push(
        "Protein-forward meals (helps fullness)",
        "Fibre foods (veg, beans, whole grains)",
        "Portion awareness (especially oils and snacks)",
        "Daily movement (consistency beats intensity)"
      );
      rec.limit.push("Sugary drinks", "Frequent fried foods", "Constant snacking");
      rec.mealIdeas.push(
        "Beans + greens + small ugali",
        "Chicken/fish + veg + small rice",
        "Greek yoghurt + fruit"
      );
      addGoalModifier();
      break;
    }

    case "Obese Class I": {
      rec.summary = "Start with consistent routines: mild deficit, protein + fibre, and gradual changes.";
      rec.focus.push(
        "Mild deficit + consistent routine (avoid extreme restriction)",
        "Protein + fibre at each meal",
        "Swap sugary drinks for water",
        "Plan snacks (fruit, yoghurt, nuts) to reduce cravings"
      );
      rec.limit.push("Sugary drinks", "High-frequency fried foods", "Late heavy meals");
      rec.mealIdeas.push(
        "Veg stew + beans + small portion starch",
        "Fish + greens + salad",
        "Oats + yoghurt + fruit"
      );
      addGoalModifier();
      break;
    }

    case "Obese Class II": {
      rec.summary = "Focus on sustainable weight reduction with support when possible (diet + activity + habits).";
      rec.focus.push(
        "Prioritize protein and vegetables (fullness)",
        "Track weekly trends (avoid daily stress)",
        "Structured meals reduce snacking",
        "Consider professional guidance if available"
      );
      rec.limit.push("Sugary drinks", "Frequent takeout/fried foods", "Mindless snacking");
      rec.mealIdeas.push(
        "Chicken/beans + greens + small rice",
        "Mixed veg + lentils/beans",
        "Yoghurt + fruit"
      );
      addGoalModifier();
      break;
    }

    case "Obese Class III": {
      rec.summary = "Consider medical guidance where possible; begin with small, consistent changes.";
      rec.focus.push(
        "Build a simple routine (meal timing + hydration)",
        "Protein + fibre at meals to improve fullness",
        "Short daily walks if feasible (start small)",
        "Seek clinical support if available"
      );
      rec.limit.push("Sugary drinks", "Frequent fried foods", "Large late-night meals");
      rec.mealIdeas.push(
        "Soup/stew + beans + vegetables",
        "Fish/chicken + greens",
        "Oats + yoghurt + fruit"
      );
      addGoalModifier();
      break;
    }

    default: {
      // Fallback (shouldn't happen)
      rec.summary = "Focus on balanced meals: protein, fibre, and steady energy.";
      rec.focus.push("Protein + fibre at meals", "Vegetables daily", "Water first");
      rec.limit.push("Sugary drinks", "Ultra-processed snacks");
      rec.mealIdeas.push("Eggs + veg", "Beans + greens", "Fruit + yoghurt");
      addGoalModifier();
    }
  }

  return {
    bmiLabel,
    goal,
    ...rec,
  };
}
