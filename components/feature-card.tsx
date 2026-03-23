export function FeatureCard() {
  return (
    <div className="w-full max-w-xl mx-auto mt-8 px-4">
      <div className="relative bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden">
        {/* Gradient Blob Decoration */}
        <div className="absolute top-4 right-4 w-24 h-24 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-400/60 via-orange-300/50 to-blue-500/40 rounded-full blur-xl" />
          <div className="absolute inset-2 bg-gradient-to-tl from-blue-400/50 via-purple-300/30 to-rose-400/40 rounded-full blur-lg" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-xs">
          <h3 className="text-foreground font-medium text-base mb-2">
            {"Don't take the shortcut."}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {"EchoFlow doesn't summarize. We show you where to look instead. Find the highlights. Take notes. Ask questions."}
          </p>
        </div>
      </div>
    </div>
  );
}
