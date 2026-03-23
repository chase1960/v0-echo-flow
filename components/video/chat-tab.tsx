"use client";

import { useState } from "react";
import { Question, ChatMessage } from "@/lib/types";
import { Send, Sparkles } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface ChatTabProps {
  questions: Question[];
}

// 预设问题
const presetQuestions = [
  "What are the key takeaways?",
  "What are the juciest quotes?",
];

// 详细问题卡片
const detailedQuestions = [
  "What is the historical price of gold in dollars per ounce?",
  "How has the volume of gold purchased by central banks changed since 2022?",
  "Why do central banks want to diversify their reserves away from dollars?",
];

export function ChatTab({ questions }: ChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cheatsheetCount, setCheatsheetCount] = useState(1);

  const handleQuestionClick = async (questionText: string) => {
    // 查找预设答案
    const preset = questions.find(q => q.question === questionText);
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: questionText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const aiMessage: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: "assistant",
      content: preset?.answer || "Based on the video content, I can provide insights about this topic. The video discusses various aspects related to your question, highlighting key points and providing detailed explanations.",
    };

    setMessages((prev) => [...prev, aiMessage]);
    setIsLoading(false);
  };

  const handleGenerateCheatsheet = () => {
    if (cheatsheetCount > 0) {
      setCheatsheetCount(prev => prev - 1);
      // 这里可以添加生成 cheatsheet 的逻辑
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const aiMessage: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: "assistant",
      content: "Based on the video content, I can provide more details about this topic. The analysis shows important insights that help understand the key concepts discussed in the video.",
    };

    setMessages((prev) => [...prev, aiMessage]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto pr-2">
        {messages.length === 0 ? (
          <div className="space-y-4">
            {/* Generate Cheatsheet Button */}
            <button
              onClick={handleGenerateCheatsheet}
              disabled={cheatsheetCount === 0}
              className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-full text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
            >
              <Sparkles className="size-4" />
              Generate cheatsheet image ({cheatsheetCount} left)
            </button>

            {/* Preset Questions - Pills */}
            <div className="flex flex-wrap gap-2">
              {presetQuestions.map((q, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionClick(q)}
                  className="px-4 py-2 border border-border rounded-full text-sm hover:bg-accent transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Detailed Question Cards */}
            <div className="space-y-2 pt-2">
              {detailedQuestions.map((q, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionClick(q)}
                  className="w-full text-left px-4 py-3 border border-border rounded-xl text-sm hover:bg-accent transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[90%] px-4 py-3 rounded-2xl text-sm ${
                    message.role === "user"
                      ? "bg-foreground text-background"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted px-4 py-3 rounded-2xl">
                  <Spinner className="size-4" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="pt-4 mt-auto border-t border-border">
        <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the video..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-full bg-foreground text-background disabled:opacity-50 disabled:cursor-not-allowed hover:bg-foreground/90 transition-colors"
          >
            <Send className="size-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
