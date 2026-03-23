import { Suspense } from "react";
import { Header } from "@/components/header";
import { NotesPageContent } from "./notes-page-content";

export default function NotesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-12">
        <Suspense fallback={<NotesSkeleton />}>
          <NotesPageContent />
        </Suspense>
      </main>
    </div>
  );
}

function NotesSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6">
      <div className="h-10 w-48 bg-muted rounded-lg animate-pulse mb-2" />
      <div className="h-5 w-64 bg-muted rounded animate-pulse mb-8" />
      <div className="h-12 w-full bg-muted rounded-xl animate-pulse mb-6" />
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-20 bg-muted rounded-full animate-pulse" />
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
