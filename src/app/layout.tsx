import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "StudySuite — Exam-Centered Study Platform",
    template: "%s | StudySuite",
  },
  description:
    "Turn your class materials into a structured, interactive study experience. Upload notes, generate study guides, flashcards, and quizzes — all organized around your specific exams.",
  keywords: [
    "study",
    "exam prep",
    "flashcards",
    "quiz",
    "study guide",
    "college",
    "notes",
    "test",
  ],
  openGraph: {
    title: "StudySuite — Exam-Centered Study Platform",
    description:
      "Turn your class materials into a structured, interactive study experience.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.variable} font-sans antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
