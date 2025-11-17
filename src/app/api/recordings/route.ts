import { NextResponse } from "next/server";
import { RecordingArtifact, RecordingDocument } from "@/lib/types";
import { getRecordingsBucket, getRecordingsCollection } from "@/lib/mongo";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

const mongoEnabled = Boolean(process.env.MONGODB_URI);
const inMemoryLedger: RecordingDocument[] = [];

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as RecordingArtifact;
    const storedAt = new Date().toISOString();
    let fileId: string | undefined;
    const documentPayload: RecordingArtifact = mongoEnabled
      ? { ...payload, dataUrl: "" }
      : payload;

    const document: RecordingDocument = {
      _id: payload.id,
      ...documentPayload,
      storedAt,
      fileId,
    };

    if (mongoEnabled) {
      const collection = await getRecordingsCollection();
      const bucket = await getRecordingsBucket();
      const buffer = dataUrlToBuffer(payload.dataUrl);
      const uploadStream = bucket.openUploadStream(payload.fileName, {
        metadata: {
          recordingId: payload.id,
          customerId: payload.customerId,
          mimeType: "audio/wav",
        },
      });
      await pipeline(Readable.from(buffer), uploadStream);
      fileId = uploadStream.id?.toString();
      document.fileId = fileId;
      await collection.updateOne(
        { _id: document._id },
        { $set: document },
        { upsert: true }
      );
    } else {
      inMemoryLedger.unshift(document);
    }

    return NextResponse.json({
      acknowledged: true,
      insertedId: payload.id,
      storedAt,
      mode: mongoEnabled ? "mongo" : "memory",
      fileId,
    });
  } catch (error) {
    console.error("Failed to persist recording", error);
    return NextResponse.json(
      { message: "Unable to persist recording" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { recordingId, customerId } = (await request.json()) as {
      recordingId?: string;
      customerId?: string;
    };

    if (!recordingId || !customerId) {
      return NextResponse.json(
        { message: "recordingId and customerId are required" },
        { status: 400 }
      );
    }

    const deliveredAt = new Date().toISOString();

    if (mongoEnabled) {
      const collection = await getRecordingsCollection();
      const result = await collection.updateOne(
        { _id: recordingId },
        { $set: { customerId, deliveredAt } }
      );

      if (!result.matchedCount) {
        return NextResponse.json(
          { message: "Recording not found" },
          { status: 404 }
        );
      }
    } else {
      const index = inMemoryLedger.findIndex(
        (recording) => recording._id === recordingId
      );

      if (index === -1) {
        return NextResponse.json(
          { message: "Recording not found" },
          { status: 404 }
        );
      }

      inMemoryLedger[index] = {
        ...inMemoryLedger[index],
        customerId,
        deliveredAt,
      };
    }

    return NextResponse.json({ deliveredAt });
  } catch (error) {
    console.error("Failed to update recording recipient", error);
    return NextResponse.json(
      { message: "Unable to update recording recipient" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    let recordings: RecordingDocument[] = [];

    if (mongoEnabled) {
      const collection = await getRecordingsCollection();
      recordings = await collection
        .find({}, { sort: { storedAt: -1 }, limit: 20 })
        .toArray();
    } else {
      recordings = inMemoryLedger.slice(0, 20);
    }

    return NextResponse.json({
      count: recordings.length,
      recordings,
      mode: mongoEnabled ? "mongo" : "memory",
    });
  } catch (error) {
    console.error("Failed to read recordings", error);
    return NextResponse.json(
      { message: "Unable to fetch recordings" },
      { status: 500 }
    );
  }
}

const dataUrlToBuffer = (dataUrl: string) => {
  const [, base64Payload] = dataUrl.split(",");
  return Buffer.from(base64Payload ?? "", "base64");
};
