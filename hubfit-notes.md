# HubFit Plans Page Analysis

URL: https://app.hubfit.com/plans/6967041448b896df1e35d3cc

## Plans Available
1. **Online Coaching** — $80 AUD/week (Recurring Subscription)
   - Custom Program, Workout tracker, Nutrition tracker, Nutrition advice, Cookbook, Checkins, Groupchats, Forums, Message support

2. **Comp Prep Coaching** — $120 AUD/week (Recurring Subscription)
   - Everything in online coaching PLUS: initial consult, in-depth calorie/nutrition coaching, show day support, in-depth check-ins, posing advice, comp advice

## Integration Options
- The "Continue" buttons on HubFit go to a sign-up/payment flow within HubFit
- HubFit is a React SPA — no obvious embed/widget/API for external sites
- **Best approach**: Link the CTA buttons on the LFF landing page directly to this HubFit plans URL, or to specific plan checkout URLs if available

## Key Insight
- The simplest and most reliable integration is to make the "Get Started" / "Start Online Coaching" buttons on the landing page link directly to the HubFit plans page URL
- This keeps the payment/onboarding flow within HubFit where Levi already manages clients
