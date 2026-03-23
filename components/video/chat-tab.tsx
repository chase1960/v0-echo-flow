"use client";

import { useState } from "react";
import { Question, ChatMessage } from "@/lib/types";
import { Send } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface ChatTabProps {
  questions: Question[];
}

export function ChatTab({ questions }: ChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleQuestionClick = (question: Question) => {
    // Add user question
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question.question,
    };

    // Add AI answer
    const aiMessage: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: "assistant",
      content: question.answer,
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
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

    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const aiMessage: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: "assistant",
      content:
        "Based on the video content, I can provide more details about this topic. The Feynman Technique emphasizes active learning through teaching. When you try to explain something in simple terms, you quickly discover which parts you don't fully understand. This self-testing aspect makes it more effective than passive review methods.",
    };

    setMessages((prev) => [...prev, aiMessage]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ask questions about the video or click a suggested question below:
            </p>
            <div className="flex flex-wrap gap-2">
              {questions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleQuestionClick(q)}
                  className="px-3 py-2 text-sm text-left bg-accent/50 hover:bg-accent rounded-lg transition-colors text-foreground"
                >
                  {q.question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent text-foreground"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-accent px-4 py-3 rounded-2xl">
                  <Spinner className="size-4" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Suggested Questions (shown when there are messages) */}
      {messages.length > 0 && (
        <div className="flex flex-wrap gap-2 py-3 border-t border-border mt-3">
          {questions.slice(0, 2).map((q) => (
            <button
              key={q.id}
              onClick={() => handleQuestionClick(q)}
              className="px-2.5 py-1.5 text-xs bg-accent/50 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            >
              {q.question}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="pt-3 border-t border-border mt-auto">
        <div className="flex items-center gap-2 bg-accent/30 rounded-xl px-4 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a follow-up question..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            <Send className="size-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
