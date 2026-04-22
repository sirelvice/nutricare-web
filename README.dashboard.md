# NutriCare Dashboard — System Overview

## 🎯 Purpose

This document explains how the **NutriCare dashboard system works**, including:

* Data flow
* User journey
* Tool interactions
* How to demo the product

This is intended for:

* Developers
* QA testers
* Product demos

---

# 🧠 System Architecture

The dashboard follows a **single source of truth architecture**:

```
Profile → Tools → API → History → Dashboard
```

### Explanation:

### 1. Profile (User Context)

Stored locally.

Contains:

* Height
* Age
* Gender
* Activity level
* Goal

👉 This is the **foundation of all calculations**

---

### 2. Tools (User Actions)

#### BMI Tool

* Input: height + weight
* Sends data to API
* Receives:

  * BMI
  * Category
  * Recommendations
* Saves result → BMI History

---

#### Calories Tool

* Uses:

  * Profile data
  * Latest weight
* Calls API automatically
* Receives:

  * Target calories
* Saves result → Calories History

---

### 3. API (Core Logic)

Endpoint:

```
/api/recommendations
```

Responsible for:

* BMI calculation
* Category classification
* BMR → TDEE → Calories
* Nutrition recommendations

👉 This is the **single source of truth**

Frontend does NOT calculate core metrics.

---

### 4. History (Persistence Layer)

Stored in localStorage.

Types:

* BMI History
* Calories History
* Weight History

Used by:

* Dashboard
* Tools (pre-fill + context)

---

### 5. Dashboard (Read-Only Insights)

Displays:

* Latest BMI (from history)
* Latest weight (from tracking)
* Latest calorie target (from history)

👉 Dashboard NEVER calculates — it only reads data.

---

# 🔄 Data Flow Example

### BMI Flow

```
User inputs → BMI Tool → API → Result → Saved → Dashboard updates
```

---

### Calories Flow

```
Profile + Weight → API → Calories → Saved → Dashboard updates
```

---

# 🧑‍💻 User Journey (Expected Usage)

### First-Time User

1. Go to **Profile**
2. Enter:

   * Height
   * Age
   * Gender
   * Activity
   * Goal

---

### Then:

3. Go to **BMI Tool**
4. Enter weight → calculate

---

### Then:

5. Go to **Calories**

* Auto-calculates (no input needed if profile + weight exist)

---

### Finally:

6. View **Dashboard**

* See:

  * BMI
  * Weight trend
  * Calories

---

# 🎬 Demo Script (IMPORTANT)

Use this when presenting the app:

---

### Step 1 — Profile

> "We start by setting up user details"

* Enter height, age, etc.
* Save

---

### Step 2 — BMI

> "Now we calculate BMI and recommendations"

* Enter weight
* Click calculate
* Show:

  * BMI
  * Category
  * Recommendations

---

### Step 3 — Calories

> "Calories are automatically computed from profile and weight"

* Open calories page
* Show auto result

---

### Step 4 — Dashboard

> "Everything is now reflected in the dashboard"

* Show:

  * BMI card
  * Weight
  * Calories

---

# ⚠️ Key Rules (DO NOT BREAK)

* ❌ Do NOT calculate BMI in frontend

* ❌ Do NOT calculate calories in multiple places

* ❌ Do NOT store duplicate logic

* ✅ API is the only computation layer

* ✅ History is the only persisted result

* ✅ Dashboard is read-only

---

# 🧪 QA Checklist

Testers should verify:

### Profile

* Can save valid data
* Rejects invalid inputs

---

### BMI Tool

* Requires height + weight
* Saves result to history

---

### Calories Tool

* Auto-calculates when profile exists
* Saves result

---

### Dashboard

* Reflects latest:

  * BMI
  * Calories
  * Weight

---

# 🚀 Future Improvements

* Auto-sync dashboard (real-time updates)
* Remove manual recalculation completely
* Integrate macros & recommendations deeper
* Backend persistence (replace localStorage)

---

# 🧠 Summary

This system is designed to be:

* **Consistent** → one source of truth
* **Scalable** → reusable API logic
* **Predictable** → clear data flow
* **Maintainable** → no duplication

---

End of document.
