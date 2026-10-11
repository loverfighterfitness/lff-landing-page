// Long-form versions of Levi's reels. Each one is a page Google can rank, with the
// reel's idea expanded properly. Shared so the server renders the same copy for crawlers.

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "formula"; text: string };

export type Article = {
  slug: string;
  /** <title>, under ~60 chars */
  title: string;
  /** Meta description, under ~160 chars */
  description: string;
  h1: string;
  /** ISO date first published */
  date: string;
  readMinutes: number;
  topic: string;
  body: ArticleBlock[];
  /** Service page the article sells into */
  cta: { path: string; text: string };
};

export const articles: Article[] = [
  {
    slug: "predict-stage-weight",
    title: "How to Predict Your Stage Weight | Comp Prep | LFF",
    description:
      "Predict your bodybuilding stage weight from your lean mass and a target body fat. The formula, a worked example from a real prep, and why it works.",
    h1: "How to predict your stage weight, months out",
    date: "2026-10-10",
    readMinutes: 4,
    topic: "Comp prep",
    body: [
      {
        type: "p",
        text: "Fat loss is far more predictable than most people think. If you know roughly how much lean mass you're carrying and roughly how lean you need to be on stage, you can estimate your stage weight months before the show, then track against it every week.",
      },
      { type: "h2", text: "Step 1: Work out your lean mass" },
      {
        type: "p",
        text: "Lean mass is everything that isn't fat. Take your current bodyweight and remove your estimated body fat.",
      },
      { type: "formula", text: "Lean mass = bodyweight × (1 − current body fat %)" },
      { type: "h2", text: "Step 2: Pick a stage body fat" },
      {
        type: "p",
        text: "As a rough guide, women tend to compete somewhere around 12–15% body fat and men around 5–8%. Treat these as ranges, not targets to the decimal. Every body fat method has a real margin of error.",
      },
      { type: "h2", text: "Step 3: Divide, don't multiply" },
      {
        type: "p",
        text: "If you keep your lean mass through prep, which is the whole point of training hard and dieting at a sensible rate, your stage weight is your lean mass divided by the fraction of you that will be lean on stage.",
      },
      { type: "formula", text: "Stage weight = lean mass ÷ (1 − stage body fat %)" },
      {
        type: "p",
        text: "This is the step people get wrong. Multiplying your current bodyweight by (1 − stage body fat) doesn't give you a stage weight. It gives you your lean mass as if you were already at that body fat, which you aren't.",
      },
      { type: "h2", text: "A real example: Ruby's prep" },
      {
        type: "p",
        text: "Ruby started her prep at 72kg and an estimated 24% body fat. That's about 54.7kg of lean mass (72 × 0.76).",
      },
      {
        type: "ul",
        items: [
          "At 12% on stage: 54.7 ÷ 0.88 = 62.2kg",
          "At 15% on stage: 54.7 ÷ 0.85 = 64.4kg",
          "Predicted stage weight: 62.2–64.4kg",
          "Actual stage weight: 63.2kg",
        ],
      },
      {
        type: "p",
        text: "She landed inside the range we mapped out. Not because the formula is magic, but because she followed the plan and we tracked her weight every single day.",
      },
      { type: "h2", text: "Why the prediction holds up" },
      {
        type: "ul",
        items: [
          "Keep your lean mass. Heavy, high-quality training keeps the mechanical tension that tells your body to hold on to muscle while calories come down.",
          "Lose at a sensible rate. For most natural athletes that's roughly 0.5–1% of bodyweight per week. Faster than that and you start losing muscle, which breaks the maths.",
          "Track daily, adjust weekly. Daily weigh-ins averaged across the week cut through water noise. Decisions get made on the trend, not on one scary morning.",
        ],
      },
      {
        type: "p",
        text: "The prediction also tells you when to start. Divide the weight you need to lose by a realistic weekly rate and you have the length of your prep. Count back from show day, add a buffer, and that's your start date.",
      },
    ],
    cta: { path: "/comp-prep-coach-adelaide", text: "Want your stage weight mapped out for you? See comp prep coaching" },
  },
  {
    slug: "traps-taking-over-lateral-raises",
    title: "Traps Taking Over Lateral Raises? Read This | LFF",
    description:
      "Feeling your traps on lateral raises doesn't mean they're doing the work. Why your side delts still do the lifting, and what to do about it.",
    h1: "Your traps aren't stealing your lateral raise",
    date: "2026-10-10",
    readMinutes: 3,
    topic: "Hypertrophy",
    body: [
      {
        type: "p",
        text: "One of the most common things I hear about lateral raises: “I feel it in my traps, so I've dropped the weight.” If that's you, you're probably leaving side delt growth on the table for a problem that doesn't really exist.",
      },
      { type: "h2", text: "What each muscle actually does" },
      {
        type: "ul",
        items: [
          "Your side delts abduct the arm, lifting it out to the side. That's the movement in a lateral raise.",
          "Your upper traps elevate and upwardly rotate the shoulder blade. They help position the shoulder blade so the arm can move, but they can't raise the arm themselves.",
        ],
      },
      {
        type: "p",
        text: "So when your arm rises out to the side, the delts are doing the lifting. There's no version of the movement where your traps take that job over.",
      },
      { type: "h2", text: "Feeling it isn't the same as it working" },
      {
        type: "p",
        text: "Your traps can be working and you can feel them, especially late in a set when fatigue builds and you start to shrug. But feeling a muscle is not a measure of how much mechanical tension your delts are under. Your delts are still the prime mover on every rep.",
      },
      { type: "h2", text: "What to do instead" },
      {
        type: "ul",
        items: [
          "Stop dropping the weight just because you feel your traps. Load the movement properly.",
          "Lead with the elbow and think about moving the arm out, not up.",
          "Take your sets close to failure. Delts grow from tension, and they need load and effort to get it.",
          "If shrugging gets out of hand, use a cable or a chest-supported variation to make the movement more stable.",
        ],
      },
    ],
    cta: { path: "/online-coaching", text: "Want your program built around exercises like this? See online coaching" },
  },
  {
    slug: "how-many-sets-per-exercise",
    title: "How Many Sets Per Exercise for Hypertrophy? | LFF",
    description:
      "Why every set is worth a little less than the last, how fatigue stacks across sets and sessions, and how many hard sets per exercise actually make sense.",
    h1: "Every set is worth less than the last one",
    date: "2026-10-10",
    readMinutes: 4,
    topic: "Hypertrophy",
    body: [
      {
        type: "p",
        text: "More sets feels like more growth. Up to a point it is. But each extra set you do in a session gives you a little less stimulus than the one before it, and costs you a little more fatigue. Understanding that is the difference between productive volume and digging a hole.",
      },
      { type: "h2", text: "Why the first sets do the most work" },
      {
        type: "p",
        text: "Your first hard set is done fresh. You can produce the most force, so the muscle sees the most mechanical tension. Every set after that starts with some fatigue already on board. You get fewer reps at the same load, or need to drop the load, and the stimulus from each set shrinks while the recovery cost keeps climbing.",
      },
      {
        type: "p",
        text: "The research on training volume shows the same thing across whole programs: more sets tend to mean more growth, but with diminishing returns. Each additional set adds less than the last.",
      },
      { type: "h2", text: "Stimulus-to-fatigue ratio" },
      {
        type: "p",
        text: "Every set has a stimulus side and a fatigue side. Early sets are high stimulus for the fatigue they cost. Late sets are the opposite. And fatigue doesn't vanish overnight. It carries into your next session and drags down the quality of that one too.",
      },
      { type: "h2", text: "How many sets per exercise, then?" },
      {
        type: "ul",
        items: [
          "For most people, 2–4 hard sets per exercise is the productive zone.",
          "Make them count: take them close to failure, around 0–3 reps in reserve, with the same clean technique on the last rep as the first.",
          "If you want more weekly volume for a muscle, add another exercise or another session in the week rather than stacking sets 5, 6 and 7 onto the same movement.",
          "Three high-quality sets will beat six sloppy ones.",
        ],
      },
      {
        type: "p",
        text: "Chase quality, not quantity. Volume only drives growth while the sets you're adding are still good sets.",
      },
    ],
    cta: { path: "/online-coaching", text: "Want your volume programmed for you? See online coaching" },
  },
];

export const articleBySlug: Record<string, Article> = Object.fromEntries(articles.map(a => [a.slug, a]));

export const LEARN_INDEX = {
  path: "/learn",
  title: "Learn | Hypertrophy & Comp Prep Guides | LFF",
  description:
    "Evidence-based guides on hypertrophy, training and bodybuilding comp prep from coach Levi Hurst. No gym myths, just the why behind what works.",
  h1: "Learn",
  intro: "The why behind the training. Evidence-based breakdowns of hypertrophy and comp prep, expanded from my reels.",
};
