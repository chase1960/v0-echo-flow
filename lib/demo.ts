import type { AnalysisBundle, Anchor, AnchorKind, EventSegment, TranscriptItem } from "./types";

/**
 * Seed bundle. Used only when a video has no public captions *and* no model key
 * is configured. It is labelled `source: "demo"` everywhere in the UI so the
 * learner is never looking at invented analysis and thinking it is theirs.
 */

const raw: [number, number, string, string, AnchorKind, string, string][] = [
  [
    45, 118,
    "Feynman's test: if you can't say it simply, you don't know it",
    "The whole method rests on one criterion, simplicity, so this is the standard every later step is measured against.",
    "claim",
    "He believed that if you couldn't explain something simply, you didn't really understand it.",
    "Talking head, no visuals",
  ],
  [
    120, 178,
    "Step 1 · Pick one specific concept, not a field",
    "The most common failure is choosing a topic at the wrong granularity; this moment shows the fix with a concrete example.",
    "step",
    "Instead of 'physics', choose 'Newton's third law of motion'.",
    "Text on screen: concept name written at top of page",
  ],
  [
    240, 320,
    "Step 2 · Explain it to a twelve-year old",
    "This is the step that actually exposes gaps, and the constraint (no jargon) is what does the work.",
    "step",
    "Children don't know technical terms, so you can't hide behind complex vocabulary.",
    "Talking head",
  ],
  [
    380, 470,
    "Step 3 · The places you get stuck are the map",
    "Reframes feeling stupid as signal: the stuck points are the study list, which is why this step saves time.",
    "step",
    "These are your knowledge gaps - the parts you don't truly understand yet.",
    "Talking head",
  ],
  [
    520, 600,
    "Step 4 · Analogies anchor it, and there is a worked example",
    "Shows the technique applied end to end, which is the part most explanations skip.",
    "example",
    "A neural network is like a brain made of simple decision-makers.",
    "Text on screen: neural network sketch",
  ],
];

const transcript: TranscriptItem[] = [
  [0, "Have you ever spent hours studying something, only to realize you can't actually explain it to someone else?"],
  [8, "Today I'm going to share with you a powerful learning technique that can help you truly understand any concept."],
  [16, "It's called the Feynman Technique, named after the Nobel Prize-winning physicist Richard Feynman."],
  [25, "Feynman was known not just for his brilliance in physics, but for his ability to explain complex ideas in simple terms."],
  [35, "He believed that if you couldn't explain something simply, you didn't really understand it."],
  [45, "The Feynman Technique consists of four simple steps that anyone can follow."],
  [55, "Let me walk you through each one."],
  [60, "Step one: Choose a concept you want to learn."],
  [68, "Write the name of the concept at the top of a blank page."],
  [85, "The key is to pick something specific rather than a broad topic."],
  [95, "For example, instead of 'physics', choose 'Newton's third law of motion'."],
  [105, "This specificity will help you focus your learning."],
  [120, "Step two: Teach it to a child."],
  [128, "Imagine you're explaining this concept to a twelve-year-old."],
  [135, "Write out your explanation using simple words and avoid jargon."],
  [145, "Children don't know technical terms, so you can't hide behind complex vocabulary."],
  [165, "If your explanation becomes too complicated, that's a signal you need to understand the concept better."],
  [180, "This is where the real learning happens."],
  [240, "Step three: Identify gaps in your explanation."],
  [250, "As you write, you'll notice areas where you struggle to explain clearly."],
  [260, "These are your knowledge gaps - the parts you don't truly understand yet."],
  [270, "Go back to your source material and study these specific areas."],
  [295, "This targeted approach is much more efficient than reviewing everything."],
  [380, "Step four: Review and simplify."],
  [400, "Can you make it even simpler? Can you use better analogies?"],
  [410, "Analogies are powerful because they connect new information to things you already know."],
  [425, "For example, you could explain electricity like water flowing through pipes."],
  [520, "Let me give you a real-world example of how I used this technique."],
  [530, "I wanted to understand how neural networks work."],
  [550, "Then I tried to explain it: A neural network is like a brain made of simple decision-makers."],
  [575, "When I got stuck explaining how they learn, I knew I needed to study backpropagation more."],
  [615, "Remember: choose, teach, identify gaps, and simplify."],
].map(([time, text], index) => ({
  id: `c${index + 1}`,
  time: time as number,
  duration: 4,
  text: text as string,
}));

const segments: EventSegment[] = [
  { id: "s1", start: 0, end: 55, terms: [] },
  { id: "s2", start: 60, end: 118, terms: [] },
  { id: "s3", start: 120, end: 180, terms: [] },
  { id: "s4", start: 240, end: 300, terms: [] },
  { id: "s5", start: 380, end: 470, terms: [] },
  { id: "s6", start: 520, end: 620, terms: [] },
].map((segment, index) => ({
  ...segment,
  text: transcript
    .filter((item) => item.time >= segment.start && item.time < segment.end)
    .map((item) => item.text)
    .join(" "),
}));

const anchors: Anchor[] = raw.map(([start, end, title, why, kind, quote, visual], index) => ({
  id: `a${index + 1}`,
  start,
  end,
  title,
  why,
  kind,
  quote,
  visual,
  dependsOn: kind === "step" && index > 1 ? [`a${index}`] : [],
  confidence: 0.55,
  color: ["#f43f5e", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"][index % 5] as string,
}));

export const demoBundle: AnalysisBundle = {
  videoId: "_f-qkGJBPts",
  title: "How to Learn Anything Fast - The Feynman Technique",
  videoUrl: "https://www.youtube.com/watch?v=_f-qkGJBPts",
  duration: 660,
  summary:
    "Four verifiable steps for turning reading into recall: name one concept, explain it without jargon, treat every stuck point as your study list, then rebuild the explanation with an analogy you already understand.",
  anchors,
  segments,
  transcript,
  source: "demo",
  pipeline: {
    transcript: "youtube-captions",
    segmentation: "semantic-events",
    model: null,
    segments: segments.length,
    ms: 0,
    cached: false,
  },
  notice:
    "Sample analysis. No captions or no model key for this video, so this is seed data, not your video.",
};
