import type { Goal } from "@/lib/profile/domain";

export type BmiCategory =
  | "underweight"
  | "normal"
  | "overweight"
  | "obese";

export type Recommendation = {
  summary: string;

  // ✅ UI contract (what frontend expects)
  focus: string[];
  limit: string[];
  mealIdeas: string[];

  // ✅ extended/internal (future use)
  priorities: string[];
  foodsToFocus: string[];
  foodsToLimit: string[];
  nextSteps: string[];
};

function macrosFromCalories(targetCalories: number, goal: Goal) {
  const proteinPct = goal === "lose" ? 0.3 : 0.25;
  const fatPct = 0.25;
  const carbsPct = 1 - proteinPct - fatPct;

  const proteinG = Math.round((targetCalories * proteinPct) / 4);
  const fatG = Math.round((targetCalories * fatPct) / 9);
  const carbsG = Math.round((targetCalories * carbsPct) / 4);

  return { proteinG, carbsG, fatG };
}

export function buildRecommendations(params: {
  bmi: number;
  category: BmiCategory;
  goal: Goal;
  targetCalories: number;
}): Recommendation & {
  macros: { proteinG: number; carbsG: number; fatG: number };
} {
  const { bmi, category, goal, targetCalories } = params;
  const macros = macrosFromCalories(targetCalories, goal);

  const common = {
    priorities: [
      "Drink water regularly (aim for clear/light urine)",
      "Prioritize sleep (7–9 hours where possible)",
      "Move daily (walks + basic strength work)",
    ],
    foodsToFocus: [
      "Whole foods: vegetables, fruits, legumes",
      "Lean protein: eggs, fish, chicken, beans",
      "High-fibre carbs: oats, brown rice, sweet potatoes",
      "Healthy fats: avocado, nuts, olive oil",
    ],
    foodsToLimit: [
      "Sugary drinks and sweets",
      "Ultra-processed snacks (high salt/fat)",
      "Deep-fried foods frequently",
      "Alcohol (if applicable)",
    ],
  };

  let summary = "";
  const nextSteps: string[] = [];

  if (category === "underweight") {
    summary =
      "Your BMI suggests you may be underweight. Focus on healthy calorie surplus with nutrient-dense meals.";
    nextSteps.push(
      "Increase calories gradually (+250–400/day) using healthy foods",
      "Add protein at every meal (aim to support muscle)",
      "Strength training 2–3x/week if possible"
    );
  } else if (category === "normal") {
    summary =
      "Your BMI is in a healthy range. Focus on consistency and long-term habits.";
    nextSteps.push(
      "Maintain target calories and keep meals balanced",
      "Add 150 minutes/week of moderate activity",
      "Track weight/waist monthly (not daily obsession)"
    );
  } else if (category === "overweight") {
    summary =
      "Your BMI suggests overweight range. A small calorie deficit plus movement can make a big difference.";
    nextSteps.push(
      "Keep a mild deficit (avoid extreme dieting)",
      "Increase vegetables and protein to stay full",
      "Walk daily + strength training 2x/week"
    );
  } else {
    summary =
      "Your BMI suggests obesity range. Focus on safe, steady progress and supportive habits.";
    nextSteps.push(
      "Start with gentle changes: reduce sugary drinks, increase protein and fibre",
      "Aim for daily walks and gradual strength training",
      "Consider professional guidance if you have medical conditions"
    );
  }

  // Goal-specific tuning
  if (goal === "lose") {
    nextSteps.unshift(
      "Follow your target calories and track 3–4 days/week for awareness"
    );
  }

  if (goal === "gain") {
    nextSteps.unshift(
      "Follow your target calories and prioritize protein + strength training"
    );
  }

  if (goal === "maintain") {
    nextSteps.unshift(
      "Follow target calories and keep activity consistent"
    );
  }

  return {
    summary: `${summary} (BMI: ${bmi.toFixed(1)})`,

    // ✅ FIX: align with UI
    focus: common.foodsToFocus,
    limit: common.foodsToLimit,
    mealIdeas: nextSteps,

    // keep extended fields
    priorities: common.priorities,
    foodsToFocus: common.foodsToFocus,
    foodsToLimit: common.foodsToLimit,
    nextSteps,

    macros,
  };
}