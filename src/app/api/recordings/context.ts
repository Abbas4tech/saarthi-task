import { RecordingDocument } from "@/lib/types";

export const mongoEnabled = Boolean(process.env.MONGODB_URI);

type GlobalWithLedger = typeof globalThis & {
  __recordingLedger?: RecordingDocument[];
};

const globalWithLedger = globalThis as GlobalWithLedger;

if (!globalWithLedger.__recordingLedger) {
  globalWithLedger.__recordingLedger = [];
}

export const inMemoryLedger = globalWithLedger.__recordingLedger!;
