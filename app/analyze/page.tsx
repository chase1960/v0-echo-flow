import { Suspense } from "react";
import { Header } from "@/components/header";
import { AnalyzeContent } from "./analyze-content";

export default function AnalyzePage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-20 px-4 max-w-4xl mx-auto">
        <Suspense fallback={<AnalyzeLoading />}>
          <AnalyzeContent />
        </Suspense>
      </div>
    </main>
  );
}

function AnalyzeLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-4 w-48 bg-muted rounded" />
      </div>
    </div>
  );
}
