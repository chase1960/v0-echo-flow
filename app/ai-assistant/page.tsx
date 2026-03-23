import { Suspense } from "react";
import { Metadata } from "next";
import { Header } from "@/components/header";
import { AIAssistantContent } from "./ai-assistant-content";

export const metadata: Metadata = {
  title: "AI Video Assistant - EchoFlow",
  description: "AI-powered video summarization and Q&A",
};

export default function AIAssistantPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]">Loading...</div>}>
        <AIAssistantContent />
      </Suspense>
    </div>
  );
}
