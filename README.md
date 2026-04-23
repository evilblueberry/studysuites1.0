# StudySuite

A full-stack, collaborative exam-prep platform that turns uploaded class materials (PDFs, DOCX, TXT) into a structured study experience (flashcards, quizzes, essay prompts, and topics) using AI.

## Architecture

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Auth**: Clerk
- **Storage**: Supabase Storage (with local dev fallback)
- **AI**: Google Gemini 2.5 Flash

---

## 🚀 Setup Instructions

### 1. Clerk Setup (Authentication)
1. Go to [Clerk](https://clerk.com) and create a free account.
2. Create a new Application. Choose **Email** and **Google** as sign-in options.
3. On the dashboard, copy the `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` into your `.env.local` file.
4. **Syncing users to the database**: 
   - In the Clerk dashboard, go to **Webhooks** -> **Add Endpoint**.
   - URL: `https://<your-ngrok-or-prod-domain>/api/webhooks/clerk`
   - Events: Check `user.created`, `user.updated`, `user.deleted`.
   - Copy the "Signing Secret" to `CLERK_WEBHOOK_SECRET` in `.env.local`.
   - *(Note: In local dev without ngrok, webhook syncing won't run, but the app has a fallback in `src/lib/auth.ts` that will create the user on their first login anyway).*

### 2. Supabase Setup (Database & Storage)
1. Go to [Supabase](https://supabase.com) and create a free project.
2. **Database**:
   - Go to Project Settings -> Database.
   - Copy the **Transaction** connection string to `DATABASE_URL` in `.env.local`.
   - Copy the **Session** connection string to `DIRECT_URL` in `.env.local`.
   - Append `?pgbouncer=true` to the `DATABASE_URL` (but not the `DIRECT_URL`).
3. **Storage**:
   - Go to the **SQL Editor** in Supabase and run the script located in `supabase/init.sql`.
   - This creates a public bucket called `study-materials` with a 50MB limit and restricts access so only your backend (using the service key) can upload/delete files.
   - Go to Project Settings -> API.
   - Copy the Project URL to `NEXT_PUBLIC_SUPABASE_URL`.
   - Copy the `service_role` secret to `SUPABASE_SERVICE_ROLE_KEY`.

### 3. Gemini Setup (AI Generation)
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and get a free API key.
2. Paste it into `GEMINI_API_KEY` in `.env.local`.
3. *(Optional)* Set `USE_MOCK_AI=true` in `.env.local` if you want to test the UI without hitting the real AI API and spending tokens. The app will return hardcoded dummy data instantly.

### 4. Running Locally

```bash
# Install dependencies
npm install

# Push the schema to Supabase (creates the tables)
npx prisma db push

# (Optional) Seed the database with demo users, friends, and 2 complete suites
npm run db:seed

# Start the dev server
npm run dev
```

The app will be running at `http://localhost:3000`.

---

## Technical Details

### File Storage Abstraction
The app uses an abstracted `StorageProvider` (`src/services/storage/types.ts`). 
- If the Supabase env vars are present, it uses `Supabase Storage`. This is **required** if you want collaborators on different machines to be able to download the files.
- If you set `STORAGE_PROVIDER=local` in your `.env.local`, files will be saved to `public/uploads`. This is fine for single-player local dev, but breaks if deployed or used by friends across different devices.

### AI Pipeline
When a user uploads files:
1. The server extracts text using `pdf-parse` or `mammoth`.
2. The text is passed to `src/services/suiteProcessor.ts`.
3. The processor chunks the document (to respect token limits and keep outputs focused) using `src/services/ai/chunker.ts`.
4. It calls `generateTopics` via the Gemini 2.5 Flash model.
5. It then runs parallel requests to generate Flashcards, Quizzes, and Essay Prompts for each topic.
6. Progress is written to `suite.generationLog` in real-time, which the client UI polls to show a live progress bar.

### Collaborator Access
When you invite a friend via email, they get access to the suite. Because we use Supabase Storage, they can click the "Files" tab and download the exact PDF/DOCX you uploaded.
