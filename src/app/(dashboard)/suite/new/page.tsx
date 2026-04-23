"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  BookOpen,
  Calendar,
  Lock,
  Users,
} from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";

type Step = "details" | "upload" | "generating";

interface FormData {
  courseName: string;
  examTitle: string;
  examDate: string;
  description: string;
  visibility: "PRIVATE" | "COLLABORATIVE";
}

interface UploadedFile {
  file: File;
  id: string;
}

export default function NewSuitePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [form, setForm] = useState<FormData>({
    courseName: "",
    examTitle: "",
    examDate: "",
    description: "",
    visibility: "PRIVATE",
  });
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [suiteId, setSuiteId] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    onDrop: (accepted) => {
      setFiles((prev) => [
        ...prev,
        ...accepted.map((f) => ({ file: f, id: crypto.randomUUID() })),
      ]);
    },
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseName.trim() || !form.examTitle.trim()) {
      setError("Course name and exam title are required.");
      return;
    }
    setError(null);
    setStep("upload");
  };

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);
    setStep("generating");

    try {
      // 1. Create suite
      const suiteRes = await fetch("/api/suites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName: form.courseName,
          examTitle: form.examTitle,
          examDate: form.examDate ? new Date(form.examDate).toISOString() : null,
          description: form.description || null,
          visibility: form.visibility,
        }),
      });

      if (!suiteRes.ok) throw new Error("Failed to create suite");
      const { data: suite } = await suiteRes.json();
      setSuiteId(suite.id);

      // 2. Upload files if any
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f.file));

        const uploadRes = await fetch(`/api/suites/${suite.id}/files`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("File upload failed");
      }

      // 3. Poll status until READY (or timeout after 60s)
      const maxAttempts = 30; // 30 × 2s = 60s max
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const statusRes = await fetch(`/api/suites/${suite.id}/status`);
          if (statusRes.ok) {
            const { data } = await statusRes.json();
            if (data.status === "READY" || data.status === "ERROR") break;
          }
        } catch {
          // Network hiccup — keep polling
        }
      }
      router.push(`/suite/${suite.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("upload");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => (step === "upload" ? setStep("details") : router.back())}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === "upload" ? "Back to details" : "Back"}
        </button>

        {/* Step indicators */}
        <div className="flex items-center gap-3 mb-6">
          {(["details", "upload"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                  step === s || (step === "generating" && i < 2)
                    ? "bg-indigo-600 text-white"
                    : i < ["details", "upload"].indexOf(step)
                    ? "bg-emerald-500 text-white"
                    : "bg-accent text-muted-foreground"
                )}
              >
                {i < ["details", "upload"].indexOf(step) ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn("text-sm", step === s ? "text-foreground font-medium" : "text-muted-foreground")}>
                {s === "details" ? "Suite Details" : "Upload Files"}
              </span>
              {i === 0 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        <h1 className="text-3xl font-bold">
          {step === "details" ? "Create a New Test Suite" : step === "upload" ? "Upload Your Materials" : "Generating Your Suite..."}
        </h1>
        <p className="text-muted-foreground mt-1">
          {step === "details"
            ? "Tell us about the exam you're preparing for."
            : step === "upload"
            ? "Upload notes, slides, or any study material for this exam."
            : "Processing your materials and generating study content."}
        </p>
      </div>

      {/* Step: Details */}
      {step === "details" && (
        <form onSubmit={handleDetailsSubmit} className="space-y-5">
          <div className="glass-card p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Course Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. PSYC 238, CS 374, BIO 101"
                value={form.courseName}
                onChange={(e) => setForm({ ...form, courseName: e.target.value })}
                className="w-full bg-accent border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Exam Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Exam 3, Midterm 2, Final Exam"
                value={form.examTitle}
                onChange={(e) => setForm({ ...form, examTitle: e.target.value })}
                className="w-full bg-accent border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                <Calendar className="inline w-3.5 h-3.5 mr-1" />
                Exam Date (optional)
              </label>
              <input
                type="date"
                value={form.examDate}
                onChange={(e) => setForm({ ...form, examDate: e.target.value })}
                className="w-full bg-accent border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Description (optional)</label>
              <textarea
                placeholder="Topics covered, professor name, anything helpful..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full bg-accent border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-muted-foreground resize-none"
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium mb-2">Access</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "PRIVATE" as const, icon: Lock, label: "Private", desc: "Only you" },
                  { value: "COLLABORATIVE" as const, icon: Users, label: "Collaborative", desc: "Invite others" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, visibility: opt.value })}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all",
                      form.visibility === opt.value
                        ? "border-indigo-500/50 bg-indigo-500/10 text-foreground"
                        : "border-border bg-accent text-muted-foreground hover:border-white/20"
                    )}
                  >
                    <opt.icon className={cn("w-4 h-4", form.visibility === opt.value ? "text-indigo-400" : "")} />
                    <div>
                      <p className="font-medium text-sm">{opt.label}</p>
                      <p className="text-xs opacity-70">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 px-4 py-2.5 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-semibold transition-colors"
          >
            Continue to Upload <ArrowRight className="w-4.5 h-4.5" />
          </button>
        </form>
      )}

      {/* Step: Upload */}
      {step === "upload" && (
        <div className="space-y-5">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "glass-card border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200",
              isDragActive ? "border-indigo-500/70 bg-indigo-500/10" : "border-white/10 hover:border-white/20 hover:bg-accent/50"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-colors", isDragActive ? "bg-indigo-500/20" : "bg-accent")}>
                <Upload className={cn("w-7 h-7", isDragActive ? "text-indigo-400" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="font-semibold mb-1">
                  {isDragActive ? "Drop files here" : "Drag & drop files here"}
                </p>
                <p className="text-sm text-muted-foreground">
                  or <span className="text-indigo-400">browse</span> to select files
                </p>
              </div>
              <p className="text-xs text-muted-foreground">PDF, DOCX, TXT — up to 20MB each</p>
            </div>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="glass-card p-4 space-y-2">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-accent">
                  <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(f.file.size)}</p>
                  </div>
                  <button
                    onClick={() => removeFile(f.id)}
                    className="p-1 rounded hover:bg-red-400/10 text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="text-center py-2 text-xs text-muted-foreground">
            {files.length === 0
              ? "You can also skip upload and create an empty suite to add files later."
              : `${files.length} file${files.length === 1 ? "" : "s"} ready to upload`}
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 px-4 py-2.5 rounded-lg">{error}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3.5 rounded-xl font-semibold transition-colors"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><BookOpen className="w-4.5 h-4.5" /> Generate Study Suite</>
            )}
          </button>

          {files.length === 0 && (
            <button
              onClick={handleGenerate}
              className="w-full text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
            >
              Skip upload — create empty suite
            </button>
          )}
        </div>
      )}

      {/* Step: Generating */}
      {step === "generating" && (
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-indigo-400" />
            </div>
            <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-background flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Building your study suite</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              Extracting content, generating topics, flashcards, quiz questions, and essay prep. This usually takes 10–30 seconds.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            {["Extracting text from files", "Generating topic guides", "Creating flashcards", "Building quiz questions"].map((task, i) => (
              <div key={task} className="flex items-center gap-3 text-sm">
                <div className={cn("w-4 h-4 rounded-full border-2 border-indigo-500/50 flex items-center justify-center", i === 0 ? "border-indigo-500 bg-indigo-500/20" : "")}>
                  {i === 0 && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />}
                </div>
                <span className={cn(i === 0 ? "text-foreground" : "text-muted-foreground")}>{task}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
