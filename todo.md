# LFF Redesign Todo

## V2 — Brown/Cream Redesign (DONE)
- [x] Remove all gold, pure brown/cream palette
- [x] Integrate real logos and Levi photo
- [x] Update pricing from 2026 sheet

## V3 — Online Coaching Focus (DONE)
- [x] Replace AI hero bg with solid #54412F brown
- [x] Remove F2F and Hybrid packages from CoachingSection — online only ($80/wk)
- [x] Update hero copy to focus on online coaching / lead gen
- [x] Update WhySection to be online-coaching specific
- [x] Update ContactSection copy for lead gen focus
- [x] Remove any remaining F2F references across all components

## V4 — Full-Stack + File Storage (DONE)
- [x] Upgrade to full-stack (db, server, user, tRPC)
- [x] Add media_assets table to DB schema
- [x] Run db:push migration
- [x] Build storage router (upload, list, delete) — admin only
- [x] Build admin media library UI at /admin
- [x] All 7 vitest tests passing

## Bug Fixes
- [x] Fix green text colour on published site — all text should be cream, not green

## V5 — Stan Store-Inspired Minimal Redesign (DONE)
- [x] Single brown color (#54412F) throughout — remove all dark/surface/mid variants
- [x] Large centered logo as hero centerpiece
- [x] Centered hero layout with pill-style buttons
- [x] Minimal divider-based section separation (no alternating backgrounds)
- [x] Rounded card corners (rounded-2xl) throughout
- [x] Pill-style CTA buttons matching modern minimal aesthetic
- [x] Simplified navbar with centered logo and balanced left/right nav links
- [x] Clean grid layout for WhySection features

## V6 — Logo & Navbar Polish
- [x] Remove brown background from LFF logo PNG (Python PIL background removal)
- [x] Upload transparent logo to CDN
- [x] Update hero, navbar, and footer to use transparent logo
- [x] Fix navbar formatting (proper flex layout, inline styles for reliability)
- [x] Precise OKLCH color values matching exact #54412F and #EAE6D2

## V7 — Lead Capture Form
- [x] Add leads table to DB schema (name, email, goal, source, createdAt)
- [x] Run db:push migration
- [x] Build submitLead tRPC procedure (public, validates input, saves to DB, notifies owner)
- [x] Replace email CTA in ContactSection with inline lead capture form
- [x] Form fields: name, email, goal (dropdown), message (optional)
- [x] Success state: thank you message after submission
- [x] Write vitest tests for lead submission procedure (8 tests, all passing)

## V8 — Phone Capture + Copy Update
- [x] Update leads DB schema: swap email for phone (varchar 30)
- [x] Run db:push migration
- [x] Update leads.submit tRPC procedure: validate phone instead of email
- [x] Update ContactSection: phone input, new "still not sure" copy
- [x] Update vitest tests for phone validation (16 tests, all passing)

## V9 — Photo Carousel in AboutSection
- [x] Upload 4 new photos to CDN (DSC00890, DSC00920, medals photo, arms-crossed portrait)
- [x] Build photo carousel component (touch/swipe, dot indicators, auto-advance)
- [x] Replace static photo in AboutSection with carousel
- [x] Arms-crossed portrait (3364F913) as cover/first slide

## V10 — New Carousel Photo + Real Google Testimonials
- [x] Upload gym mirror flex photo to CDN
- [x] Add new photo to AboutSection carousel (now 5 photos total)
- [x] Scraped real Google reviews from Lover Fighter Fitness Google Business (5.0 ★ · 15 reviews)
- [x] Replace placeholder testimonials with real reviews: Ari Jackson, Hamish Johnson, Leigh Hill
- [x] Added Google 5.0 ★ rating badge to testimonials section header

## V11 — Stripe Payment Links + World-wide
- [x] Update hero tagline from "AUSTRALIA-WIDE" to "WORLD-WIDE"
- [x] Hero "Start Coaching" button → Standard Stripe link
- [x] Hero "See Packages" button → scroll to coaching section (keep as-is)
- [x] Navbar "Get Started" button → Standard Stripe link (desktop + mobile)
- [x] FloatingCTA button → Standard Stripe link
- [x] Comp Prep package "Get Started" → Comp Prep Stripe link
- [x] Online Coaching package "Get Started" → Standard Stripe link
- [x] Removed HubFit reference from coaching section footer note

## V12 — HubFit Stripe Links
- [x] Swap all buttons to HubFit-generated Stripe links (auto-creates client accounts)
- [x] Comp Prep → https://buy.stripe.com/00wfZg51AaaL1NKgUQbQY00
- [x] Standard Online Coaching → https://buy.stripe.com/eVq4gy2Tsgz9cso1ZWbQY01
- [x] Hero, Navbar, FloatingCTA → Standard link (default)

## V13 — Revert to HubFit Package Links
- [x] Swap all buttons back to app.hubfit.com/plans/... links (auto-creates client accounts)

## V14 — Add Kim Morrison Testimonial
- [x] Add Kim Morrison's Google review to TestimonialsSection (word-for-word, review count updated to 16)

## V15 — Remove Leigh Hill Placeholder Photo
- [x] Removed placeholder comp prep image from Leigh Hill's testimonial card

## V16 — Direct Stripe Payment Links (Automation Live)
- [x] Standard coaching buttons → https://buy.stripe.com/3cI00j4Aq0bdf3S08Mbwk04
- [x] Comp Prep button → https://buy.stripe.com/3cI9AT9UK7DFaNC1cQbwk05
- [x] Hero, Navbar, FloatingCTA → Standard link (default)

## V17 — Hide VSL Placeholder
- [x] Hidden VSL video block in HeroSection (placeholder comment left in place for easy re-enable)

## V18 — Bigger Bolder Typography
- [x] Increase subtext size across all sections (hero, why, about, contact)
- [x] Make coaching package features list bold and eye-catching (text-base font-semibold, 90% opacity)
- [x] Increase feature list text size and opacity (check icons size-16, 80% opacity)
- [x] Boost body text weight from font-light to font-normal throughout
- [x] Section label overlines: text-xs → text-sm, font-light → font-medium
- [x] Footer: text visibility increased, fixed Australia-Wide → World-Wide

## V19 — Live Google Reviews + Dynamism
- [ ] Set up Google Places API key secret
- [ ] Build tRPC procedure to fetch LFF Google reviews via Places API
- [ ] Replace hardcoded TestimonialsSection with live Google reviews component
- [ ] Add subtle grainy texture to section backgrounds
- [ ] Add animated stats counter (reviews, clients, rating)
- [ ] Add cream accent pops on icons and labels
- [ ] Show dynamism examples to user for selection

## V19 — Styled Google Review Cards + Grainy Texture + Dynamism
- [x] Redesign TestimonialsSection as styled Google review cards (Google logo, stars, avatar initials, date)
- [x] Add subtle grainy SVG noise texture overlay to section backgrounds
- [x] Add animated stats counter section (5.0 stars, 16 reviews, years coaching, 100% online)
- [x] Add cream accent pops on icons, labels, and hover states
- [x] Add scroll-triggered fade-in animations on section entry
- [x] Fix Australia-wide → world-wide in About bio and WhySection

## V20 — Logo, Borders, Carousel Fix
- [x] Make hero logo 1.5x bigger
- [x] Thicken all borders across the site by at least 2x
- [x] Fix carousel to start on first photo, then auto-advance after delay (8s first, 5s after)

## V21 — Dynamic Interactions & Conversion Elements
- [x] Coaching card hover: 3D tilt + scale up + lift shadow + cream glow — pops out of screen
- [x] Hero CTA buttons: cta-pulse + btn-shimmer on "Start Coaching"
- [x] Why section feature cards: hover lift + icon scale + background tint
- [x] Testimonial cards: hover lift + border glow
- [x] Floating CTA: pulsing ring animation around the "Start Now" button
- [x] Contact form submit button: shimmer sweep + scale on hover
- [x] Marquee ticker strip: scrolling social proof strip between Stats→Why and Coaching→Testimonials

## V22 — SEO Fixes
- [x] Add meta description (50-160 chars) to index.html
- [x] Add meta keywords to index.html
- [x] Add Open Graph tags for social sharing
- [x] Add Twitter Card tags
- [x] Add canonical URL and robots meta tag

## V23 — Mobile Coaching Cards + Cleanup
- [x] Remove marquee ticker strips from Home.tsx
- [x] Remove pulse-ring from floating CTA (keep btn-shimmer)
- [x] Coaching cards on mobile: scroll-activated liquid glass-inspired effect (scale + glow + frosted sheen as card enters viewport center)

## V24 — OG Image for Social Sharing
- [x] Generate branded 1200x630 OG image using real LFF logo
- [x] Upload to CDN via manus-upload-file --webdev
- [x] Add og:image and twitter:image meta tags to index.html

## V25 — Sitemap & Robots
- [x] Create sitemap.xml in client/public/
- [x] Create robots.txt pointing to sitemap

## V26 — FAQ Section
- [x] Create FAQSection component with accordion-style questions
- [x] Add to Home.tsx above ContactSection
- [x] Cover: minimum commitment, cancellation, app used, check-in process, comp prep experience, pricing value
- [x] Add Ruby Frang's Google review to TestimonialsSection (placeholder — to update when she rewrites it)
- [x] Add Laura Koerbin's Google review to TestimonialsSection (Local Guide, 9 months coaching)

## V27 — Ruby's Transformation Photos
- [x] Upload transformation photo and comp day photo to CDN
- [x] Display both images side-by-side on Ruby's testimonial card

## V29 — Alternating Section Colours (More Cream)
- [x] Hero: keep brown (anchor)
- [x] Stats: flip to cream bg, brown text/accents
- [x] Why section: keep brown
- [x] Coaching: flip to cream bg, brown accents
- [x] Testimonials: keep brown
- [x] About: flip to cream bg, brown accents
- [x] FAQ: keep brown
- [x] Contact: flip to cream bg, brown accents
- [x] Footer: keep brown (anchor)
- [x] All text, borders, icons readable on flipped sections — TypeScript clean

## V30 — Floating Cream Panels on Brown Background
- [x] Set ALL section backgrounds back to brown (#54412F) — one continuous bg
- [x] Stats: wrap content in floating cream rounded panel with shadow
- [x] Coaching: wrap cards in cream rounded panel with shadow
- [x] About: wrap bio + carousel in cream rounded panel with shadow
- [x] Contact: wrap form in cream rounded panel with shadow
- [x] FAQ: wrap accordion in cream rounded panel with shadow (brown text on cream)
- [x] All panels fully rounded (rounded-3xl)
- [x] Drop shadow on all floating panels — TypeScript clean

## V31 — Coaching Panel Simplification
- [x] One unified cream rounded-3xl panel wrapping both packages
- [x] Remove all internal brown divider lines
- [x] Increase font size and weight on package names, prices, and feature lists
- [x] Keep the 3D hover pop-out effect on desktop, scroll-activate on mobile

## V32 — Package Cards Maximum Impact
- [x] Massive price display — $80/$120 at clamp(5rem,10vw,7rem) weight-900, the hero of each card
- [x] Add value anchor: "Less than $12 a day" / "Less than $18 a day"
- [x] Standard card: cream bg, brown text
- [x] Comp Prep card: full inverted brown bg, cream text — dramatic contrast
- [x] Section heading: "SERIOUS COACHING. REAL RESULTS." weight-900
- [x] "Most Popular" badge with stars on comp prep card
- [x] CTA buttons inverted per card colour — TypeScript clean

## V33 — Hero Mixed Typography
- [x] Added Playfair Display Italic 700/800/900 via Google Fonts
- [x] First line: Bebas Neue heavy sans-serif uppercase "COACHING BUILT"
- [x] Second line: Playfair Display italic 800 "for you." — cream, slightly softened opacity
- [x] Thin animated rule between headline and subtext (scaleX reveal)
- [x] TypeScript clean

## V34 — Font Swap: DM Serif Display
- [x] Replace Playfair Display with DM Serif Display in Google Fonts link
- [x] Update HeroSection fontFamily reference

## V35 — Font Swap: Agbalumo
- [x] Replace DM Serif Display with Agbalumo in Google Fonts link
- [x] Update HeroSection fontFamily reference (removed italic — Agbalumo is a display font, no italic variant)

## V36 — Agbalumo Caps
- [x] Change second headline line from "for you." to "FOR YOU."

## V37 — Custom Font: Sharpen
- [x] Upload Sharpen.ttf to CDN (https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/Sharpen_63b681b2.ttf)
- [x] Add @font-face rule to index.css
- [x] Update HeroSection fontFamily to use Sharpen

## V38 — Sharpen Lowercase
- [x] Change second headline line from "FOR YOU." to "for you."

## V39 — Sharpen Title Case
- [x] Change second headline line to "For You." (capital F and Y)
- [x] Increase "For You." font size (clamp 3.2rem to 8.5rem)
- [x] Fix text cutoff — increased line-height to 1.1 and added padding-bottom

## V42 — Serif Font Swap
- [x] Replace Sharpen with Cormorant Garamond italic for "For You." line
- [x] Increase Cormorant Garamond weight from 400 to 600 for bolder impact

## V44 — Ruby's Updated Review
- [x] Swap Ruby's old review with her new comprehensive comp prep review
- [x] Move Ruby's review to first position in testimonials section
- [x] Update date to "1 hour ago" (NEW)
- [x] Fix "View all reviews on Google" link to correct Google Maps URL

## V45 — Website Modernization & Conversion Optimization
- [x] Update stats display: change "16+ reviews" to "100+ success stories"
- [ ] Add hero image: professional headshot or training photo (right side or background) — SKIPPED (using Meet Levi section)
- [x] Add micro-interactions: hover effects on buttons (scale, shadow, color shift) — CSS animations added to index.css
- [x] Add scroll animations: fade-in and slide-up on section entry — CSS keyframes added
- [x] Add animated stats counter: 0 → 100 success stories counter animation — Already implemented
- [x] Add social proof bar: trust bar below hero with key metrics — SocialProofBar component created
- [x] Enhance testimonial cards: more visual distinction (shadows, borders, hover effects) — Already implemented
- [ ] Add icons to "What You Get" section: visual icons for each benefit
- [ ] Enhance CTA hierarchy: primary/secondary/tertiary button styling
- [ ] Add testimonial carousel: swipeable on mobile, auto-advance
- [ ] Add video section: "Meet Levi" intro video or transformation montage
- [ ] Add interactive elements: comp prep quiz or macro calculator
- [ ] Add subtle gradients: depth and layering to sections
- [x] Add floating sticky CTA: mobile bottom CTA button — FloatingMobileCTA component created
- [ ] Test mobile responsiveness: ensure all CTAs are thumb-friendly
- [ ] Test performance: ensure page loads in <3 seconds

## Bug Fix — SMS #1 Calculator Link
- [x] Fix broken link in SMS #1 — update to correct working URL for the calculator page (now uses www.loverfighterfitness.com/calculator)

## SMS Booking Link Update
- [ ] Update SMS #3 placeholder Calendly link with real Square booking link

## SMS Booking Link Update
- [x] Update SMS #3 placeholder Calendly link with shortened Square booking link (https://tinyurl.com/yov35eof)

## Bug Fix — SMS Macro Mismatch
- [x] Fix macro values in SMS #1 to match what the website displays to the user

## Calculator Activity Level & Cut Goal Updates
- [x] Change activity level labels to step-based with lower multipliers
- [x] Change cut goals from percentage multipliers to flat calorie deficits (-750 extreme, -400 moderate)

## Calculator Disclaimer
- [x] Add disclaimer to results page: estimates only, personalised coaching plan provides exact targets

## Calculator Lead Notifications
- [x] Add Manus owner notification on calculator submission
- [x] Add Gmail email notification on calculator submission

## Phase 3 — Leads Dashboard + Goal in Notifications
- [x] Add goal field to calculator submission schema, DB, and notifications
- [x] Build admin leads dashboard page (all submissions, name/phone/goal/macros/date)
- [ ] Test full flow end-to-end after publishing

## Phase 4 — Dashboard UX + PWA
- [x] Add Follow Up button on leads dashboard (pre-filled SMS/email links)
- [x] Add CSV export button on leads dashboard
- [x] Add leads dashboard link to Admin page
- [x] Add PWA manifest + home screen icons (iOS and Android) with LFF logo

## Phase 5 — Lead Notes & Status Pipeline
- [x] Add notes and status columns to calculator_leads DB schema
- [x] Add updateLeadNotes and updateLeadStatus tRPC procedures
- [x] Add inline notes editor and status tag selector to leads dashboard UI

## Phase 6 — PWA Push Notifications
- [x] Generate VAPID keys and store as secrets
- [x] Add push_subscriptions DB table and subscribe/unsubscribe tRPC procedures
- [x] Add service worker (sw.js) with push event handler
- [x] Add notification permission request on app open
- [x] Fire push notification from calculator router on new lead

## Phase 6b — PWA Start URL
- [x] Update manifest start_url to /admin/leads so PWA opens directly to leads dashboard

## Bug Fix — AdminLeads Dark Styling
- [x] Fix AdminLeads dark/weird styling — restore LFF brown/cream aesthetic while keeping notes and status features

## AdminLeads Color Scheme Update
- [x] Change AdminLeads background to brown (#54412F) with cream (#EAE6D2) lead cards

## Homepage UX Updates
- [x] Remove nav section tabs (About, Coaching, Results, Contact) from navbar
- [x] Add subtle calculator icon to navbar (right side)
- [x] Implement scroll-triggered logo reveal — logo merges into navbar as user scrolls down
- [x] Start with no logo in navbar, appears as you scroll

## Navbar Logo Positioning
- [x] Update navbar so logo merges into center top (not left side) as user scrolls

## Navbar Mobile Menu
- [x] Remove hamburger menu on mobile — show Instagram and Calculator icons directly on all screen sizes

## Stripe Checkout Integration
- [x] Add Stripe products.ts with price IDs for Standard and Comp Prep packages
- [x] Build /api/stripe/webhook endpoint with signature verification
- [x] Build createCheckoutSession tRPC procedure
- [x] Update CoachingSection "Get Started" buttons to trigger checkout session
- [x] Update HeroSection "Start Coaching" button to trigger checkout session
- [x] Update FloatingCTA and FloatingMobileCTA to trigger checkout session
- [x] Create /success page with on-brand thank you message
- [x] Create /cancel page redirecting back to coaching section (cancel_url goes to /#coaching)
- [x] Send owner notification on successful payment via webhook
- [x] Write vitest tests for checkout session procedure (10 tests, all passing)

## Persistent SMS Job Queue
- [x] Add sms_jobs table to DB schema (leadId, phone, message, smsNumber, sendAt, sentAt, status)
- [x] Run db:push migration
- [x] Build sms job scheduler — polls DB every 60s, sends due jobs, marks as sent
- [x] Replace setTimeout in calculator router with DB job enqueue
- [x] Start scheduler on server boot
- [x] Write vitest tests for job queue (8 tests, all passing)

## SMS Jobs Admin Dashboard
- [x] Add getSmsJobs tRPC procedure (admin only — returns all jobs with lead name)
- [x] Add retrySmsJob tRPC procedure (reset failed job to pending)
- [x] Add SMS Jobs tab to admin leads dashboard
- [x] Show job status (pending/sent/failed), scheduled time, lead name, SMS number
- [x] Add retry button on failed jobs

## CRM & Referral Improvements (Mar 2026)

- [x] Fix clickable phone/email links in lead cards (tel: and mailto: links)
- [x] Add follow-up reminder field to leads (date + reminder note)
- [x] Show follow-up reminders in CRM with overdue highlighting
- [x] Add schema migration for follow-up reminder fields
- [x] Build referral system: referral_codes table, unique codes per client
- [x] Referral tracking: track which leads came from a referral code
- [x] Admin referral tab: show referral codes, usage count, referred leads
- [x] Public referral link: /ref/[code] redirects to site and tracks the visit

## Referral Rewards (Mar 2026)

- [x] Create Stripe coupon for 2 weeks free (14-day free trial extension)
- [x] Pass referral coupon into Stripe checkout session when referredBy is set
- [x] Update /ref/[code] welcome page to show "2 weeks free" offer
- [x] Update CRM referrals tab to flag referrer when their referral converts (manual reward reminder)

## Content Tracker
- [x] Add content tracker as hidden page at /content-tracker
- [x] Fix content tracker layout, emoji rendering, and add LFF logo to header
- [x] Convert content tracker to standalone PWA at /content-tracker for iOS home screen

## SEO Fixes
- [x] Reduce homepage keywords from 11 to 3-8 focused keywords
