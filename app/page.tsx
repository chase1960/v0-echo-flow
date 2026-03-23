import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { FeatureCard } from "@/components/feature-card";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen pt-16">
        <HeroSection />
        <FeatureCard />
      </div>
    </main>
  );
}
