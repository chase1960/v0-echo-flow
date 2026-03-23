import { NextRequest, NextResponse } from "next/server";
import { VideoAnalysis } from "@/lib/types";

// Mock data for demo purposes
const mockAnalysis: VideoAnalysis = {
  title: "How to Learn Anything Fast - The Feynman Technique",
  video_url: "https://www.youtube.com/watch?v=_f-qkGJBPts",
  summary:
    "This video explains the Feynman Technique, a powerful learning method developed by Nobel Prize-winning physicist Richard Feynman. The technique involves four steps: choose a concept, teach it to a child, identify gaps and review, and simplify and use analogies.",
  highlights: [
    {
      id: "1",
      time: 45,
      title: "Introduction to Feynman Technique",
      summary: "Overview of the learning method and its origins",
      color: "#f43f5e",
    },
    {
      id: "2",
      time: 120,
      title: "Step 1: Choose a Concept",
      summary: "Select a topic you want to learn and write it at the top of a blank page",
      color: "#8b5cf6",
    },
    {
      id: "3",
      time: 240,
      title: "Step 2: Teach It to a Child",
      summary: "Explain the concept in simple terms as if teaching a 12-year-old",
      color: "#3b82f6",
    },
    {
      id: "4",
      time: 380,
      title: "Step 3: Identify Gaps",
      summary: "Review your explanation and identify areas where you struggled",
      color: "#10b981",
    },
    {
      id: "5",
      time: 520,
      title: "Step 4: Simplify and Use Analogies",
      summary: "Refine your explanation using simple language and real-world analogies",
      color: "#f59e0b",
    },
  ],
  questions: [
    {
      id: "1",
      question: "What is the Feynman Technique?",
      answer:
        "The Feynman Technique is a learning method developed by physicist Richard Feynman. It involves four steps: 1) Choose a concept to learn, 2) Teach it as if explaining to a child, 3) Identify gaps in your understanding, and 4) Review and simplify using analogies. This technique helps identify knowledge gaps and reinforces learning through teaching.",
    },
    {
      id: "2",
      question: "Why does teaching help you learn better?",
      answer:
        "Teaching forces you to simplify complex concepts and identify gaps in your understanding. When you can't explain something simply, it reveals areas where your knowledge is incomplete. This active recall and reformulation process strengthens neural pathways and deepens comprehension.",
    },
    {
      id: "3",
      question: "How can I apply this to learning programming?",
      answer:
        "To apply the Feynman Technique to programming: 1) Pick a concept like 'recursion' or 'closures', 2) Write an explanation as if teaching a beginner, 3) When you get stuck, go back to documentation or tutorials, 4) Rewrite your explanation using simple analogies. You could even write blog posts or create tutorials to reinforce your learning.",
    },
    {
      id: "4",
      question: "What makes this technique different from other learning methods?",
      answer:
        "Unlike passive methods like re-reading or highlighting, the Feynman Technique is active and forces you to engage deeply with the material. It exposes knowledge illusions - when you think you understand something but actually don't. The emphasis on simple language prevents hiding behind jargon.",
    },
  ],
  transcript: [
    { id: "1", time: 0, text: "Have you ever spent hours studying something, only to realize you can't actually explain it to someone else?" },
    { id: "2", time: 8, text: "Today I'm going to share with you a powerful learning technique that can help you truly understand any concept." },
    { id: "3", time: 16, text: "It's called the Feynman Technique, named after the Nobel Prize-winning physicist Richard Feynman." },
    { id: "4", time: 25, text: "Feynman was known not just for his brilliance in physics, but for his ability to explain complex ideas in simple terms." },
    { id: "5", time: 35, text: "He believed that if you couldn't explain something simply, you didn't really understand it." },
    { id: "6", time: 45, text: "The Feynman Technique consists of four simple steps that anyone can follow." },
    { id: "7", time: 55, text: "Let me walk you through each one." },
    { id: "8", time: 60, text: "Step one: Choose a concept you want to learn." },
    { id: "9", time: 68, text: "Write the name of the concept at the top of a blank page." },
    { id: "10", time: 75, text: "This could be anything from quantum mechanics to machine learning to cooking techniques." },
    { id: "11", time: 85, text: "The key is to pick something specific rather than a broad topic." },
    { id: "12", time: 95, text: "For example, instead of 'physics', choose 'Newton's third law of motion'." },
    { id: "13", time: 105, text: "This specificity will help you focus your learning." },
    { id: "14", time: 120, text: "Step two: Teach it to a child." },
    { id: "15", time: 128, text: "Imagine you're explaining this concept to a twelve-year-old." },
    { id: "16", time: 135, text: "Write out your explanation using simple words and avoid jargon." },
    { id: "17", time: 145, text: "Children don't know technical terms, so you can't hide behind complex vocabulary." },
    { id: "18", time: 155, text: "Use short sentences and simple examples from everyday life." },
    { id: "19", time: 165, text: "If your explanation becomes too complicated, that's a signal you need to understand the concept better." },
    { id: "20", time: 180, text: "This is where the real learning happens." },
    { id: "21", time: 240, text: "Step three: Identify gaps in your explanation." },
    { id: "22", time: 250, text: "As you write, you'll notice areas where you struggle to explain clearly." },
    { id: "23", time: 260, text: "These are your knowledge gaps - the parts you don't truly understand yet." },
    { id: "24", time: 270, text: "Go back to your source material and study these specific areas." },
    { id: "25", time: 280, text: "Don't just re-read passively. Actively try to fill in the gaps in your explanation." },
    { id: "26", time: 295, text: "This targeted approach is much more efficient than reviewing everything." },
    { id: "27", time: 380, text: "Step four: Review and simplify." },
    { id: "28", time: 390, text: "Now that you've identified and filled your knowledge gaps, review your explanation." },
    { id: "29", time: 400, text: "Can you make it even simpler? Can you use better analogies?" },
    { id: "30", time: 410, text: "Analogies are powerful because they connect new information to things you already know." },
    { id: "31", time: 425, text: "For example, you could explain electricity like water flowing through pipes." },
    { id: "32", time: 440, text: "The voltage is like water pressure, and the current is like the flow rate." },
    { id: "33", time: 455, text: "Good analogies make abstract concepts concrete and memorable." },
    { id: "34", time: 520, text: "Let me give you a real-world example of how I used this technique." },
    { id: "35", time: 530, text: "I wanted to understand how neural networks work." },
    { id: "36", time: 540, text: "First, I wrote 'neural networks' at the top of my page." },
    { id: "37", time: 550, text: "Then I tried to explain it: A neural network is like a brain made of simple decision-makers." },
    { id: "38", time: 565, text: "Each decision-maker looks at some information and says yes or no." },
    { id: "39", time: 575, text: "When I got stuck explaining how they learn, I knew I needed to study backpropagation more." },
    { id: "40", time: 590, text: "After studying, I could explain it: They learn by checking their answers and adjusting their decision-making." },
    { id: "41", time: 605, text: "That's the Feynman Technique in action." },
    { id: "42", time: 615, text: "Remember: choose, teach, identify gaps, and simplify." },
    { id: "43", time: 625, text: "If you practice this regularly, you'll find that you understand concepts more deeply." },
    { id: "44", time: 635, text: "And you'll be able to explain them to others with confidence." },
    { id: "45", time: 645, text: "Thanks for watching, and happy learning!" },
  ],
};

export async function GET(request: NextRequest) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // In a real app, you would analyze the video here
  // For now, return mock data
  return NextResponse.json(mockAnalysis);
}
