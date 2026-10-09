export class NutritionPlanConflictError extends Error {
  constructor() {
    super("A nutrition plan version already exists for this user.");
    this.name = "NutritionPlanConflictError";
  }
}
