import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Users, Zap, ChevronRight, Star, CheckCircle2, Upload, Sparkles, Target } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen hero-bg">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Brain className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg tracking-tight">StudySuite</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#compare" className="hover:text-foreground transition-colors">vs. Quizlet</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Upload. Generate. Study. Ace the exam.
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Your exams, turned into a{" "}
            <span className="gradient-text">complete study system</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your class notes, slides, and readings. StudySuite transforms them into
            structured study guides, flashcards, quizzes, and essay prep — organized around
            your specific exams.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-semibold text-base transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5"
            >
              Start Studying Free <ArrowRight className="w-4.5 h-4.5" />
            </Link>
            <Link
              href="/sign-in"
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-foreground px-8 py-4 rounded-xl font-semibold text-base transition-all duration-200"
            >
              Log In
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Free to use · No credit card required</p>
        </div>
      </section>

      {/* Feature preview cards */}
      <section className="pb-24 px-6" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Upload,
                color: "text-blue-400",
                bg: "bg-blue-400/10",
                title: "Upload Any Format",
                desc: "PDF, DOCX, TXT — drop your notes and we handle the rest.",
              },
              {
                icon: Sparkles,
                color: "text-violet-400",
                bg: "bg-violet-400/10",
                title: "Auto-Generated Content",
                desc: "Study guides, flashcards, quizzes, and essay prep generated instantly.",
              },
              {
                icon: Target,
                color: "text-indigo-400",
                bg: "bg-indigo-400/10",
                title: "Exam-Centered Organization",
                desc: "Everything is organized around specific tests — not random card sets.",
              },
              {
                icon: Users,
                color: "text-emerald-400",
                bg: "bg-emerald-400/10",
                title: "Collaborative Suites",
                desc: "Invite classmates to co-study. Share notes, add comments, work together.",
              },
              {
                icon: BookOpen,
                color: "text-amber-400",
                bg: "bg-amber-400/10",
                title: "Persistent Workspace",
                desc: "Access all past exam suites from your sidebar — build a study history.",
              },
              {
                icon: Brain,
                color: "text-pink-400",
                bg: "bg-pink-400/10",
                title: "Progress Tracking",
                desc: "Track mastery per topic. Know exactly what to focus on before exam day.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="glass-card p-6 hover:border-white/10 transition-all duration-200 group"
              >
                <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 border-t border-white/5" id="how-it-works">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How StudySuite works</h2>
            <p className="text-muted-foreground text-lg">From upload to exam-ready in minutes.</p>
          </div>
          <div className="space-y-12">
            {[
              {
                step: "01",
                title: "Create a Test Suite",
                desc: "Enter your course name, exam title, and optional exam date. Each suite represents one specific exam — PSYC 238 Exam 3, CS 374 Midterm 2, whatever you're studying for.",
              },
              {
                step: "02",
                title: "Upload Your Materials",
                desc: "Drop in PDFs, DOCX files, or text notes from that exam. Lecture notes, review sheets, textbook chapters — anything you'd study from.",
              },
              {
                step: "03",
                title: "Study the Generated Suite",
                desc: "Browse auto-generated topic guides, flip through flashcards, take practice quizzes, and prepare essay arguments — all structured around your specific exam content.",
              },
              {
                step: "04",
                title: "Collaborate & Track Progress",
                desc: "Invite classmates, add shared notes to any topic, and track your mastery as you study. See which topics you're strong on and which need more work.",
              },
            ].map((step, i) => (
              <div key={step.step} className="flex gap-8">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-400">{step.step}</span>
                </div>
                <div className="pt-3">
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison vs Quizlet */}
      <section className="py-24 px-6 border-t border-white/5" id="compare">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why not just use Quizlet?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Quizlet is great for individual flashcard sets. StudySuite is built for the whole exam.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card p-6 border-white/5">
              <h3 className="font-semibold text-muted-foreground mb-4 text-sm uppercase tracking-wider">Quizlet</h3>
              <ul className="space-y-3">
                {[
                  "Manual card creation only",
                  "Organized by card sets, not exams",
                  "No study guide generation",
                  "No essay prep or quiz generation",
                  "Collaboration is passive (shared links)",
                  "No progress tracking per exam",
                  "No file upload or content parsing",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="text-red-400 mt-0.5">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card p-6 border-indigo-500/20 bg-indigo-500/5">
              <h3 className="font-semibold text-indigo-400 mb-4 text-sm uppercase tracking-wider">StudySuite</h3>
              <ul className="space-y-3">
                {[
                  "Auto-generated from uploaded materials",
                  "Everything organized around specific exams",
                  "Full topic-by-topic study guides",
                  "Flashcards, quizzes, and essay prep generated",
                  "Real-time collaboration with classmates",
                  "Topic mastery and progress tracking",
                  "PDF, DOCX, TXT upload with text extraction",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card p-12 glow-indigo border-indigo-500/20">
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Ready to ace your next exam?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Upload your first set of notes and get a complete study suite in minutes.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-xl font-semibold text-base transition-all duration-200 shadow-lg shadow-indigo-500/20"
            >
              Create Your First Suite <ArrowRight className="w-4.5 h-4.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-sm">StudySuite</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 StudySuite. Built for students who take exams seriously.
          </p>
        </div>
      </footer>
    </div>
  );
}
