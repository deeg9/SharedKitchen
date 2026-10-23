<div align="center">

# SharedKitchen

A collaborative cookbook for households. Plan meals together, sync grocery lists, split budgets, and share recipes.

<img src="docs/images/hero.webp" alt="SharedKitchen landing page" width="820" />

</div>

---

## Features

- **Shared meal plan**: a household calendar of meals, with who is cooking each night
- **Synced grocery list**: generated from the meal plan, grouped by aisle, synced in real time
- **Budget tracking**: monthly grocery targets with category breakdowns
- **Household invites**: bring in roommates, a partner, or family
- **Premium**: Stripe subscription

<p align="center">
  <img src="docs/images/plan_home.webp" alt="plan home screen design" width="240" />
  <img src="docs/images/grocery_list.webp" alt="grocery list screen design" width="240" />
  <img src="docs/images/budget_dashboard.webp" alt="budget dashboard screen design" width="240" />
</p>

## Stack

| Layer | Tech |
|---|---|
| App | Expo 55, React Native, expo-router, Zustand |
| Data & auth | Supabase |
| Billing | Stripe |
| Landing page | Static HTML + Tailwind (`index.html`) |

## Running it

```bash
cp .env.example .env   # fill in your own keys
npm install
npx expo start
```

## Status

SharedKitchen was built in 2026 and is no longer live. The code is published here as a portfolio project. Read the case study at [diegofill.com/projects/sharedkitchen](https://diegofill.com/projects/sharedkitchen).

<details>
<summary>Full landing page</summary>

<img src="docs/images/landing.webp" alt="The full SharedKitchen landing page" width="820" />

</details>

---

Built by [Diego Fill](https://diegofill.com).
