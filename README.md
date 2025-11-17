## Saarthi CRM

A Relationship Manager cockpit built with Next.js + shadcn-inspired UI primitives. It brings together customer filtering, appointment orchestration, and guided recording workflows where media is stored locally first and seamlessly synced in the background.

### Feature Highlights

- **Customer dossier** – searchable list with priority and segment tags for quick filtering.
- **Appointment timeline** – status-aware actions for `"Done"`, `"Pending"`, and `"Cancelled"` meetings plus recording & playback CTAs.
- **Recording cockpit** – RecordRTC-powered audio capture (WAV) with start/pause/resume/stop, customer routing, inline playback, and background uploads.
- **Mongo-backed delivery & storage** – the `/api/recordings` route writes metadata to MongoDB and streams the WAV blob into GridFS (chunked 256 KB pieces) so the actual media lives server-side before the RM shares it, and `/api/recordings/[id]` streams the audio back on-demand for playback.
- **Playback overlay** – lightweight media viewer for completed appointments with pause/play controls.
- **Local-first storage** – recordings land in `localStorage` instantly, then an uploader job pushes them to the `/api/recordings` route (Mongo-ready) before marking them `SYNCED`.

### Tech Stack

- **Next.js App Router** with TypeScript
- **Tailwind CSS** + shadcn-style primitives (`Button`, `Card`, `Badge`, etc.)
- **RecordRTC + MediaRecorder API** for audio input/output compatibility across browsers
- **MongoDB (via `mongodb` driver + GridFS)** for chunked audio persistence through `/api/recordings`
- **Mongo-ready domain types** defined in `src/lib/types.ts` (mock data lives in `src/lib/mock-data.ts`)

### Local Development

```bash
npm install
cp .env.example .env.local # or define env vars manually
npm run dev
# visit http://localhost:3000
```

Minimum env variables (see `/src/lib/mongo.ts`):

```
MONGODB_URI="your mongodb connection string"
# optional, defaults to "saarthi"
MONGODB_DB="saarthi"
```

### Extending Toward Production

- Replace the mock data with MongoDB queries (e.g., via Next.js Server Actions or Route Handlers).
- Point `/api/recordings` to your MongoDB driver / Prisma client so background uploads persist blobs + metadata server-side (already wired for the official `mongodb` driver).
- Swap the simulated demo data with real documents and secure the API with auth middleware / RLS.
- Wire Role-Based Access Control or audit logging before exposing recordings to end users.

### Folder Guide

| Path                               | Purpose                                                     |
| ---------------------------------- | ----------------------------------------------------------- |
| `src/app/page.tsx`                 | Main CRM experience and view-model logic                    |
| `src/components/crm/*`             | Customer list, appointment board, recorder, and playback UI |
| `src/hooks/useRecordingManager.ts` | MediaRecorder lifecycle, local storage, background sync     |
| `src/lib/types.ts`                 | Customer/appointment/recording domain contracts             |
| `src/lib/mock-data.ts`             | Sample data replacing MongoDB for now                       |
| `src/components/ui/*`              | Slim shadcn-inspired components used throughout             |

### Security & Privacy Considerations

- The recorder only runs client-side and requests explicit microphone access.
- Recordings remain local until upload succeeds, improving perceived latency and giving clear status.
- Types/models are structured to plug into MongoDB with customer-specific scoping, enabling future privacy controls.
