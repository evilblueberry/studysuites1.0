/// <reference types="node" />
// eslint-disable-next-line @typescript-eslint/no-require-imports
import { PrismaClient, Visibility, SuiteStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding StudySuite demo data...");

  // Demo user (Clerk auth won't create this automatically in seed, but we need a placeholder)
  // In production, users are created on first login via getCurrentUser()
  // This seed creates a demo user you can link to a real Clerk account by updating clerkId
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@studysuite.dev" },
    update: {},
    create: {
      clerkId: "clerk_demo_seed_user",
      name: "Alex Chen",
      email: "demo@studysuite.dev",
      avatarUrl: null,
    },
  });

  const demoUser2 = await prisma.user.upsert({
    where: { email: "jamie@studysuite.dev" },
    update: {},
    create: {
      clerkId: "clerk_demo_seed_user_2",
      name: "Jamie Rivera",
      email: "jamie@studysuite.dev",
      avatarUrl: null,
    },
  });

  // ─── Suite 1: PSYC 238 Exam 3 ─────────────────────────────────────────────

  const suite1 = await prisma.testSuite.upsert({
    where: { id: "seed-suite-psyc238" },
    update: {},
    create: {
      id: "seed-suite-psyc238",
      ownerId: demoUser.id,
      courseName: "PSYC 238",
      examTitle: "Exam 3",
      examDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      description: "Social psychology, persuasion, cognitive dissonance, conformity, and group dynamics.",
      visibility: Visibility.COLLABORATIVE,
      status: SuiteStatus.READY,
    },
  });

  // Topics for suite 1
  const topic1 = await prisma.topic.upsert({
    where: { id: "seed-topic-psyc-1" },
    update: {},
    create: {
      id: "seed-topic-psyc-1",
      suiteId: suite1.id,
      title: "Social Influence and Conformity",
      orderIndex: 0,
      summary: "How individuals change their behavior or beliefs in response to real or imagined social pressure, with emphasis on Asch and Milgram studies.",
      fullContent: `## Social Influence and Conformity

### High-Yield Overview
Social influence refers to the ways people affect the thoughts, feelings, and behaviors of others. Conformity is one key mechanism — individuals align their attitudes or behaviors with group norms.

### Key Experiments
**Asch Conformity Experiments (1951)**
- Participants judged line lengths in groups of confederates
- 75% conformed at least once when confederates gave wrong answers
- Factors increasing conformity: group size (up to 3-4), unanimity, ambiguity

**Milgram Obedience Studies (1963)**
- Participants delivered apparent electric shocks under authority pressure
- 65% delivered maximum "450V" shocks
- Key finding: situational factors override personal ethics under authority

### Why This Is Exam-Critical
Exam questions frequently test:
1. Distinctions between normative vs. informational social influence
2. Factors that increase/decrease conformity
3. Ethical implications of the studies
4. Application to real-world scenarios (jury rooms, marketing)

### Mini Recap
- Normative influence = wanting to fit in
- Informational influence = genuinely uncertain, looking to others for accuracy
- Conformity ≠ obedience — know the difference`,
      keyTerms: [
        { term: "Conformity", definition: "Changing one's behavior or beliefs to match the real or imagined group norm" },
        { term: "Normative Social Influence", definition: "Conforming due to desire for social acceptance and avoiding rejection" },
        { term: "Informational Social Influence", definition: "Conforming because one genuinely believes others have accurate information" },
        { term: "Obedience", definition: "Complying with a direct command from an authority figure" },
      ],
      commonTraps: [
        "Confusing normative and informational social influence",
        "Misremembering Milgram's exact percentage (65%, not 100%)",
        "Saying Asch studied obedience — he studied conformity",
      ],
    },
  });

  const topic2 = await prisma.topic.upsert({
    where: { id: "seed-topic-psyc-2" },
    update: {},
    create: {
      id: "seed-topic-psyc-2",
      suiteId: suite1.id,
      title: "Cognitive Dissonance Theory",
      orderIndex: 1,
      summary: "Festinger's theory of the discomfort from holding contradictory cognitions and the motivation to reduce that discomfort.",
      fullContent: `## Cognitive Dissonance Theory

### High-Yield Overview
Cognitive dissonance (Festinger, 1957) is the psychological discomfort experienced when holding two or more contradictory beliefs, values, or attitudes simultaneously — or when behavior contradicts beliefs.

### Core Mechanisms
Dissonance reduction strategies:
1. **Change behavior** to match beliefs
2. **Change the belief** to match behavior
3. **Add a new cognition** that reconciles the contradiction
4. **Minimize importance** of the dissonant cognition

### Classic Study: Festinger & Carlsmith (1959)
- Participants performed a boring task, then told next participant it was fun
- $1 group changed their attitude (task was interesting) MORE than $20 group
- Why? $20 justified the lie; $1 group needed to believe it to reduce dissonance

### Mini Recap
Less external justification → more attitude change to reduce dissonance`,
      keyTerms: [
        { term: "Cognitive Dissonance", definition: "Psychological discomfort from holding conflicting beliefs, attitudes, or from behavior-belief inconsistency" },
        { term: "Insufficient Justification", definition: "Having too little external reason for behavior, causing attitude change to reduce dissonance" },
        { term: "Post-decision Dissonance", definition: "Discomfort after making a difficult choice, leading to increased liking of chosen option" },
      ],
      commonTraps: [
        "Thinking more external reward = more attitude change (opposite is true)",
        "Confusing cognitive dissonance with confirmation bias",
        "Forgetting the three dissonance reduction strategies",
      ],
    },
  });

  const topic3 = await prisma.topic.upsert({
    where: { id: "seed-topic-psyc-3" },
    update: {},
    create: {
      id: "seed-topic-psyc-3",
      suiteId: suite1.id,
      title: "Persuasion: Elaboration Likelihood Model",
      orderIndex: 2,
      summary: "Petty & Cacioppo's dual-process model explaining how people are persuaded via central (systematic) and peripheral (heuristic) routes.",
      fullContent: `## Persuasion: Elaboration Likelihood Model

### High-Yield Overview
The ELM (Petty & Cacioppo, 1986) proposes two routes to persuasion:
- **Central Route**: Careful, effortful processing of argument quality
- **Peripheral Route**: Superficial reliance on cues (attractiveness, popularity, authority)

### When Each Route Is Used
Central route requires:
- High motivation to process
- High ability to process
- High involvement with the topic

Peripheral route used when:
- Low motivation or ability
- Time pressure
- Low personal relevance

### Implications
- Central route → stronger, longer-lasting attitude change
- Peripheral route → weaker, more temporary attitude change

### Mini Recap
Strong argument + engaged audience = central route.
Celebrity endorsement + distracted audience = peripheral route.`,
      keyTerms: [
        { term: "Elaboration Likelihood Model (ELM)", definition: "Theory proposing central and peripheral routes to persuasion depending on motivation and ability to process" },
        { term: "Central Route", definition: "Persuasion through careful evaluation of argument quality; requires motivation and ability" },
        { term: "Peripheral Route", definition: "Persuasion through heuristics and surface cues without deep message processing" },
      ],
      commonTraps: [
        "Saying peripheral route = ineffective — it's effective, just less durable",
        "Forgetting that ability AND motivation are both needed for central route",
        "Confusing ELM with Heuristic-Systematic Model (HSM)",
      ],
    },
  });

  // Flashcards for suite 1
  await prisma.flashcard.createMany({
    skipDuplicates: true,
    data: [
      { id: "seed-fc-1", suiteId: suite1.id, topicId: topic1.id, front: "What is normative social influence?", back: "Conforming due to the desire for social acceptance — wanting to fit in and avoid rejection, even if you privately disagree.", orderIndex: 0 },
      { id: "seed-fc-2", suiteId: suite1.id, topicId: topic1.id, front: "What percentage of Milgram's participants delivered the maximum shock?", back: "65% of participants administered the maximum 450V shock, despite apparent distress signals from the confederate.", orderIndex: 1 },
      { id: "seed-fc-3", suiteId: suite1.id, topicId: topic1.id, front: "What did the Asch conformity experiments demonstrate?", back: "That people will conform to group consensus even when the answer is clearly wrong — 75% conformed at least once across 12 critical trials.", orderIndex: 2 },
      { id: "seed-fc-4", suiteId: suite1.id, topicId: topic2.id, front: "What is cognitive dissonance?", back: "Psychological discomfort from holding two or more conflicting cognitions (beliefs, attitudes, or behaviors). People are motivated to reduce this discomfort.", orderIndex: 3 },
      { id: "seed-fc-5", suiteId: suite1.id, topicId: topic2.id, front: "In Festinger & Carlsmith (1959), why did the $1 group show more attitude change than the $20 group?", back: "The $1 group had insufficient external justification for lying, so they changed their attitude (deciding the task was actually interesting) to reduce dissonance. The $20 group justified the lie externally.", orderIndex: 4 },
      { id: "seed-fc-6", suiteId: suite1.id, topicId: topic3.id, front: "What two factors determine which ELM route is used?", back: "Motivation (personal relevance/interest) and ability (cognitive capacity, time, distraction) to process the message. Both needed for central route.", orderIndex: 5 },
      { id: "seed-fc-7", suiteId: suite1.id, topicId: topic3.id, front: "Which ELM route produces more durable attitude change?", back: "The central route produces stronger, more persistent, and more resistant-to-counterargument attitude change because it involves deeper cognitive elaboration.", orderIndex: 6 },
    ],
  });

  // Quiz for suite 1
  const quiz1 = await prisma.quiz.upsert({
    where: { id: "seed-quiz-psyc-1" },
    update: {},
    create: {
      id: "seed-quiz-psyc-1",
      suiteId: suite1.id,
      topicId: null,
      title: "Full Review Quiz: PSYC 238 Exam 3",
    },
  });

  await prisma.quizQuestion.createMany({
    skipDuplicates: true,
    data: [
      {
        id: "seed-qq-1",
        quizId: quiz1.id,
        questionText: "Milgram's obedience studies found that approximately what percentage of participants delivered the maximum shock level?",
        questionType: "MULTIPLE_CHOICE",
        choices: ["35%", "50%", "65%", "95%"],
        correctAnswer: "65%",
        explanation: "Milgram found that 65% of participants (ordinary adults) administered the maximum 450V shock when instructed to do so by an authority figure, demonstrating the power of situational authority over personal ethics.",
      },
      {
        id: "seed-qq-2",
        quizId: quiz1.id,
        questionText: "A student studying for an exam reads the textbook carefully and evaluates each argument on its merits. According to the ELM, they are using which route to persuasion?",
        questionType: "MULTIPLE_CHOICE",
        choices: ["Peripheral route", "Central route", "Heuristic route", "Automatic processing"],
        correctAnswer: "Central route",
        explanation: "The central route involves careful, effortful processing of argument quality — exactly what the student is doing. This requires both motivation (studying for the exam) and ability (understanding the material).",
      },
      {
        id: "seed-qq-3",
        quizId: quiz1.id,
        questionText: "In Festinger & Carlsmith's classic study, why did participants paid $1 show greater attitude change than those paid $20?",
        questionType: "MULTIPLE_CHOICE",
        choices: [
          "The $1 group needed to find intrinsic value in the task to justify their behavior (insufficient justification effect)",
          "The $20 group was more intelligent and saw through the deception",
          "Money increased motivation in the $20 group, making them enjoy the task more",
          "The $1 group spent more time on the task due to lower pay",
        ],
        correctAnswer: "The $1 group needed to find intrinsic value in the task to justify their behavior (insufficient justification effect)",
        explanation: "This is the insufficient justification effect. The $1 was not enough external justification for telling another person the boring task was fun, so participants reduced dissonance by convincing themselves the task was actually interesting.",
      },
    ],
  });

  // Essay prompt for suite 1
  await prisma.essayPrompt.create({
    data: {
      suiteId: suite1.id,
      topicId: topic1.id,
      prompt: "Discuss the role of situational factors in explaining conformity and obedience. Use specific research evidence to support your argument and address the ethical implications of this research.",
      outline: `**Introduction**
- Define conformity vs. obedience
- Thesis: situational factors are primary drivers

**Body 1: Conformity Evidence (Asch)**
- Describe Asch's methodology
- Key finding: 75% conformed at least once
- Situational variables (group size, unanimity)

**Body 2: Obedience Evidence (Milgram)**
- Describe Milgram's methodology
- Key finding: 65% maximum shock
- Situational variables (authority, proximity, institutional setting)

**Body 3: Ethical Implications**
- Deception in research
- Psychological harm to participants
- IRB standards today

**Conclusion**
- Restate situationist argument
- Broader implications for understanding human behavior`,
      keyPoints: [
        "Distinguish conformity from obedience before beginning",
        "Reference both Asch AND Milgram — don't rely on just one",
        "Use specific numbers/percentages from each study",
        "Address at least one ethical criticism",
        "Connect to real-world applications (workplace, military, mass compliance)",
      ],
    },
  });

  // Add Jamie as collaborator
  await prisma.testSuiteCollaborator.upsert({
    where: { suiteId_userId: { suiteId: suite1.id, userId: demoUser2.id } },
    update: {},
    create: {
      suiteId: suite1.id,
      userId: demoUser2.id,
      role: "EDITOR",
    },
  });

  // ─── Suite 2: CS 374 Midterm 2 ────────────────────────────────────────────

  const suite2 = await prisma.testSuite.upsert({
    where: { id: "seed-suite-cs374" },
    update: {},
    create: {
      id: "seed-suite-cs374",
      ownerId: demoUser.id,
      courseName: "CS 374",
      examTitle: "Midterm 2",
      examDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      description: "Algorithms: dynamic programming, graph algorithms, NP-completeness.",
      visibility: Visibility.PRIVATE,
      status: SuiteStatus.READY,
    },
  });

  const topicCS1 = await prisma.topic.upsert({
    where: { id: "seed-topic-cs-1" },
    update: {},
    create: {
      id: "seed-topic-cs-1",
      suiteId: suite2.id,
      title: "Dynamic Programming",
      orderIndex: 0,
      summary: "Breaking complex problems into overlapping subproblems and storing solutions to avoid redundant computation.",
      fullContent: `## Dynamic Programming

### High-Yield Overview
Dynamic programming (DP) is an algorithmic technique for solving problems with overlapping subproblems and optimal substructure. By memoizing or tabulating subproblem solutions, DP reduces exponential brute-force to polynomial time.

### Core Principles
1. **Optimal Substructure**: Optimal solution contains optimal solutions to subproblems
2. **Overlapping Subproblems**: Same subproblems are solved multiple times

### Approaches
- **Top-down (Memoization)**: Recursive with cache
- **Bottom-up (Tabulation)**: Iterative, fill table from base cases

### Classic Problems
- Fibonacci (O(n) with DP vs O(2^n) naive)
- Longest Common Subsequence
- 0/1 Knapsack
- Matrix Chain Multiplication
- Shortest Path (Bellman-Ford)

### Mini Recap
DP = recursion + cache + polynomial time`,
      keyTerms: [
        { term: "Optimal Substructure", definition: "Property where optimal solution to problem contains optimal solutions to its subproblems" },
        { term: "Overlapping Subproblems", definition: "Same subproblems are encountered multiple times during recursion" },
        { term: "Memoization", definition: "Top-down DP technique storing results of expensive function calls for reuse" },
        { term: "Tabulation", definition: "Bottom-up DP technique building solution table from smallest subproblems up" },
      ],
      commonTraps: [
        "Applying DP to problems without optimal substructure",
        "Confusing memoization (top-down) with tabulation (bottom-up)",
        "Forgetting to define the recurrence relation before implementing",
      ],
    },
  });

  const quiz2 = await prisma.quiz.upsert({
    where: { id: "seed-quiz-cs-1" },
    update: {},
    create: {
      id: "seed-quiz-cs-1",
      suiteId: suite2.id,
      topicId: topicCS1.id,
      title: "Quiz: Dynamic Programming",
    },
  });

  await prisma.quizQuestion.createMany({
    skipDuplicates: true,
    data: [
      {
        id: "seed-qq-cs-1",
        quizId: quiz2.id,
        questionText: "Which property is required for dynamic programming to apply to a problem?",
        questionType: "MULTIPLE_CHOICE",
        choices: [
          "Optimal substructure and overlapping subproblems",
          "Greedy choice property and independence",
          "Divide and conquer with non-overlapping subproblems",
          "Linear time complexity",
        ],
        correctAnswer: "Optimal substructure and overlapping subproblems",
        explanation: "DP requires both: optimal substructure (optimal solution contains optimal subproblem solutions) and overlapping subproblems (same subproblems solved repeatedly). Without both, DP provides no benefit over brute force.",
      },
    ],
  });

  await prisma.flashcard.createMany({
    skipDuplicates: true,
    data: [
      {
        id: "seed-fc-cs-1",
        suiteId: suite2.id,
        topicId: topicCS1.id,
        front: "What is the time complexity of naive recursive Fibonacci vs DP Fibonacci?",
        back: "Naive recursive: O(2^n) — exponential due to repeated computation. DP (memoized or tabulated): O(n) — each subproblem solved once.",
        orderIndex: 0,
      },
      {
        id: "seed-fc-cs-2",
        suiteId: suite2.id,
        topicId: topicCS1.id,
        front: "What is optimal substructure?",
        back: "A problem has optimal substructure if an optimal solution to the whole problem contains optimal solutions to its subproblems. Required for DP.",
        orderIndex: 1,
      },
    ],
  });

  // Progress entries
  await prisma.studyProgress.upsert({
    where: { userId_suiteId_topicId: { userId: demoUser.id, suiteId: suite1.id, topicId: null } },
    update: { completionPercent: 45, lastStudiedAt: new Date() },
    create: {
      userId: demoUser.id,
      suiteId: suite1.id,
      topicId: null,
      completionPercent: 45,
      masteryLevel: 2,
    },
  });

  await prisma.studyProgress.upsert({
    where: { userId_suiteId_topicId: { userId: demoUser.id, suiteId: suite1.id, topicId: topic1.id } },
    update: { completionPercent: 80, lastStudiedAt: new Date() },
    create: {
      userId: demoUser.id,
      suiteId: suite1.id,
      topicId: topic1.id,
      completionPercent: 80,
      masteryLevel: 4,
    },
  });

  // Friendship between demo users
  await prisma.friendship.upsert({
    where: { userAId_userBId: { userAId: demoUser.id, userBId: demoUser2.id } },
    update: {},
    create: {
      userAId: demoUser.id,
      userBId: demoUser2.id,
    },
  });

  console.log("✅ Seed complete!");
  console.log(`   Demo user: demo@studysuite.dev`);
  console.log(`   Suites: PSYC 238 Exam 3, CS 374 Midterm 2`);
  console.log(`   Topics: 4 total with flashcards, quizzes, essay prompts`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
