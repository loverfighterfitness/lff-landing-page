// Service + location landing pages. Shared so the client page, the server-rendered
// crawler copy, the <head> meta and the JSON-LD all come from one source.

export type LeadGoal = "lose_weight" | "build_muscle" | "comp_prep" | "strength" | "general_fitness" | "other";

export type LocalPage = {
  path: string;
  /** <title>, keyword first, under ~60 chars */
  title: string;
  /** Meta description, under ~160 chars */
  description: string;
  eyebrow: string;
  h1: string;
  intro: string[];
  proof: { stat: string; label: string }[];
  sections: { heading: string; paragraphs?: string[]; bullets?: string[]; steps?: string[] }[];
  faqs: { question: string; answer: string }[];
  /** Pre-selects the contact form's goal */
  goal?: LeadGoal;
  /** Short name used in breadcrumbs, related links and the Service schema */
  name: string;
  serviceType: string;
  areaServed: string[];
  offer?: { price: string; description: string };
  related: string[];
};

export const localPages: LocalPage[] = [
  {
    path: "/personal-trainer-mount-barker",
    title: "Personal Trainer Mount Barker | Lover Fighter Fitness",
    description:
      "Personal training in Mount Barker with coach Levi Hurst at Snap Fitness Aston Hills. Evidence-based strength, muscle and fat loss coaching, Adelaide Hills.",
    eyebrow: "Mount Barker · Adelaide Hills",
    h1: "Personal training in Mount Barker",
    intro: [
      "I'm Levi, a coach based in Mount Barker. I train clients in person at Snap Fitness Aston Hills, and every session is built around one thing: a result you can measure.",
      "Not a template. Not a circuit designed to make you sweaty. A plan built around your body, your schedule and your goal, whether that's your first chin-up, a bigger total or two dress sizes down.",
    ],
    proof: [
      { stat: "XL → M", label: "Kim's dress size in four months" },
      { stat: "2nd", label: "Ruby at her first bodybuilding show" },
      { stat: "1-on-1", label: "and 2-on-1 sessions at Snap Aston Hills" },
    ],
    sections: [
      {
        heading: "What a session looks like",
        paragraphs: [
          "Every session has a job. We warm up for the lifts you're about to do, hit your main work hard enough to drive progress, and log every set so next week is measurably better than this one.",
          "I coach the why as we go. If I change your squat stance, you'll know which muscles it biases and why that suits your goal. You leave every session knowing more than when you walked in.",
        ],
      },
      {
        heading: "Who I work with",
        bullets: [
          "Beginners who want to learn to train properly, without getting hurt or wasting a year on bad programming.",
          "People who want to lose fat and keep it off, with nutrition they can actually live with.",
          "Lifters chasing strength: a bigger squat, bench or deadlift.",
          "Anyone building muscle, right through to bodybuilding competition prep.",
        ],
      },
      {
        heading: "Evidence, not gym myths",
        paragraphs: [
          "Muscle grows from mechanical tension. Not time under tension, not chasing a burn. Fat loss comes from a calorie deficit, and yes, you can overeat on whole foods.",
          "So I program around what the research supports: enough volume, taken close enough to failure, progressed week to week. Simple to explain. Hard to do without a coach keeping you honest.",
        ],
      },
      {
        heading: "Where I train",
        paragraphs: [
          "I coach out of Snap Fitness Aston Hills in Mount Barker, an easy trip from Littlehampton, Nairne, Hahndorf and the rest of the Adelaide Hills.",
          "Not local? I coach online too. Same programming, same weekly check-ins, from anywhere.",
        ],
      },
    ],
    faqs: [
      {
        question: "Where are sessions held?",
        answer:
          "At Snap Fitness Aston Hills in Mount Barker. If you're elsewhere in the Adelaide Hills, like Littlehampton, Nairne or Hahndorf, it's a short drive.",
      },
      {
        question: "Do you only train experienced lifters?",
        answer:
          "No. I coach complete beginners through to competitive bodybuilders. Your first sessions are about learning to move well and finding your starting point. From there, everything progresses week to week.",
      },
      {
        question: "Can I train with a friend or partner?",
        answer: "Yes. I run 2-on-1 sessions as well as 1-on-1.",
      },
      {
        question: "Do you help with nutrition?",
        answer:
          "Yes. Results come from training and nutrition together, so we set calorie and protein targets around your goal and keep them realistic for your life.",
      },
      {
        question: "How do I get started?",
        answer:
          "Send the form below with your goal. I'll get back to you within 24 hours, we'll chat about what you want, and then we book your first session.",
      },
    ],
    name: "Personal Training Mount Barker",
    serviceType: "Personal training",
    areaServed: ["Mount Barker", "Littlehampton", "Nairne", "Hahndorf", "Adelaide Hills"],
    related: ["/comp-prep-coach-adelaide", "/online-coaching"],
  },
  {
    path: "/comp-prep-coach-adelaide",
    title: "Comp Prep Coach Adelaide | Natural Bodybuilding | LFF",
    description:
      "Bodybuilding comp prep coaching in Adelaide with Levi Hurst. Evidence-based prep for natural federations like ICN: training, nutrition, posing and peak week.",
    eyebrow: "Adelaide · South Australia · Online",
    h1: "Comp prep coaching in Adelaide",
    intro: [
      "Ruby placed 2nd at her first bodybuilding show, ICN South Australia. I coached her through every week of that prep, and every athlete I coach gets the same approach.",
      "Prep is the hardest thing you'll do in this sport. You need a coach who reads your data every week, adjusts before things go sideways, and tells you the truth about your conditioning.",
    ],
    proof: [
      { stat: "2nd", label: "Ruby's debut show, ICN SA" },
      { stat: "Weekly", label: "check-ins with physique photos" },
      { stat: "$120", label: "per week, 4-week minimum" },
    ],
    sections: [
      {
        heading: "How I run a prep",
        bullets: [
          "Start early. Most natural athletes need somewhere around 16 to 24 weeks, sometimes more, depending on where they start. Rushing the deficit costs muscle.",
          "Lose at the right rate. For most naturals that's roughly 0.5 to 1% of bodyweight per week: fast enough to get there, slow enough to keep what you've built.",
          "Train to keep your muscle. Heavy, high-quality work maintains the mechanical tension that tells your body to hold on to muscle while calories come down.",
          "Adjust from data, not panic. Weight trends, check-ins and photos drive every change.",
          "Plan the finish. Peak week and show day are mapped out, so nothing is left to chance.",
        ],
      },
      {
        heading: "Federations and classes",
        paragraphs: [
          "We pick the federation and class that suit your physique in your first consult. Ruby competed with ICN, a natural, drug-tested federation, and natural bodybuilding is what I coach.",
        ],
      },
      {
        heading: "Posing",
        paragraphs: [
          "Posing wins shows. You send me posing video throughout prep and get feedback on every round, so you walk on stage presenting the physique you spent months building.",
        ],
      },
      {
        heading: "In person or online",
        paragraphs: [
          "I'm based in Mount Barker, so Adelaide athletes can train with me in person at Snap Fitness Aston Hills. Everyone else runs the same prep online through the coaching app.",
        ],
      },
    ],
    faqs: [
      {
        question: "How far out from my show should I start?",
        answer:
          "As early as you can. Most natural competitors need around 16 to 24 weeks, depending on starting body fat. If your show is closer than that, get in touch anyway. We'll work out whether it's realistic or whether a later show suits you better.",
      },
      {
        question: "Do you coach natural athletes?",
        answer: "Yes. Natural, drug-tested bodybuilding is my focus. Ruby placed 2nd at her ICN SA debut.",
      },
      {
        question: "Do you coach men and women?",
        answer: "Yes. I've coached both male and female clients through comp prep.",
      },
      {
        question: "What's included?",
        answer:
          "A custom training program, weekly check-ins, video form reviews and unlimited messaging, plus federation and class guidance, in-depth nutrition coaching, posing feedback, a full prep strategy and show-day support.",
      },
      {
        question: "How much does comp prep coaching cost?",
        answer: "$120 a week, with a 4-week minimum. After that it's month to month.",
      },
    ],
    goal: "comp_prep",
    name: "Comp Prep Coaching Adelaide",
    serviceType: "Bodybuilding competition preparation coaching",
    areaServed: ["Adelaide", "South Australia", "Australia"],
    offer: {
      price: "120",
      description:
        "Comp prep coaching: custom training, in-depth nutrition, weekly check-ins, posing feedback and show-day support. Billed weekly, 4-week minimum.",
    },
    related: ["/personal-trainer-mount-barker", "/online-coaching"],
  },
  {
    path: "/online-coaching",
    title: "Online Coaching Australia | Training & Nutrition | LFF",
    description:
      "Online coaching with Levi Hurst: a custom program, nutrition coaching, weekly check-ins and video form reviews. $80 a week, anywhere in Australia.",
    eyebrow: "Australia-wide · World-wide",
    h1: "Online coaching, built for you",
    intro: [
      "Online coaching with me is the same coaching my in-person clients get: a program built from scratch, a coach who reviews every check-in and every lift, and changes made from your data.",
      "It costs less than one in-person session a week, and it fits around your life. Any gym, any schedule, anywhere.",
    ],
    proof: [
      { stat: "$80", label: "per week, 4-week minimum" },
      { stat: "Weekly", label: "check-ins, every one reviewed by me" },
      { stat: "Unlimited", label: "messaging and form reviews" },
    ],
    sections: [
      {
        heading: "What you get",
        bullets: [
          "A custom training program built from scratch for your goal, equipment and schedule.",
          "Nutrition coaching, with workouts and food tracked in the coaching app.",
          "A weekly check-in covering training, nutrition, energy and sleep. I review every single one.",
          "Video form reviews on your lifts.",
          "Unlimited messaging, cookbook access and the LFF group chats.",
        ],
      },
      {
        heading: "How it works",
        steps: [
          "Send the form below with your goal.",
          "We do an onboarding call: your goals, training history, equipment and schedule.",
          "I build your program and nutrition targets.",
          "You train, log and check in every week, and I adjust from what the data says.",
        ],
      },
      {
        heading: "Why it works",
        paragraphs: [
          "A lot of online coaching is a PDF and a group chat. Mine is a coach reading your numbers every week. Progressive overload gets tracked, not guessed.",
          "When a lift stalls, we find out why, whether it's fatigue, volume, sleep or food, and change one thing at a time.",
        ],
      },
    ],
    faqs: [
      {
        question: "How is online coaching different from in-person PT?",
        answer:
          "You get a fully custom program, weekly check-ins, video form reviews and unlimited messaging, all for less than one in-person session a week. Train on your schedule, wherever you are.",
      },
      {
        question: "What's the minimum commitment?",
        answer:
          "4 weeks. After that you're month to month with no lock-in. Pause or cancel anytime with 7 days' notice.",
      },
      {
        question: "What if I'm a complete beginner?",
        answer:
          "Beginners are welcome. I build every program from scratch based on where you're at, and we do a full onboarding call before I write a single set.",
      },
      {
        question: "Can I do it from anywhere?",
        answer: "Yes. Everything runs through the coaching app, so it works in any gym, anywhere in Australia or overseas.",
      },
    ],
    name: "Online Coaching",
    serviceType: "Online fitness coaching",
    areaServed: ["Australia", "Worldwide"],
    offer: {
      price: "80",
      description:
        "Online coaching: custom training program, nutrition coaching, weekly check-ins, video form reviews and unlimited messaging. Billed weekly, 4-week minimum.",
    },
    related: ["/personal-trainer-mount-barker", "/comp-prep-coach-adelaide"],
  },
];

export const localPageByPath: Record<string, LocalPage> = Object.fromEntries(localPages.map(p => [p.path, p]));
