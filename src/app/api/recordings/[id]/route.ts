import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getRecordingsBucket, getRecordingsCollection } from "@/lib/mongo";
import { dataUrlToBuffer } from "../helpers";
import { inMemoryLedger, mongoEnabled } from "../context";

interface Params {
  id: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id: recordingId } = await params;

    if (!recordingId) {
      return NextResponse.json(
        { message: "Recording id is required" },
        { status: 400 }
      );
    }

    const document =
      (mongoEnabled
        ? await (await getRecordingsCollection()).findOne({ _id: recordingId })
        : inMemoryLedger.find((recording) => recording._id === recordingId)) ??
      null;

    if (!document) {
      return NextResponse.json(
        { message: "Recording not found" },
        { status: 404 }
      );
    }

    if (mongoEnabled) {
      if (!document.fileId) {
        return NextResponse.json(
          { message: "Recording is still processing" },
          { status: 409 }
        );
      }

      const bucket = await getRecordingsBucket();
      const stream = bucket.openDownloadStream(new ObjectId(document.fileId));
      return new Response(stream as unknown as ReadableStream, {
        headers: {
          "Content-Type": "audio/wav",
          "x-recorded-at": document.createdAt,
          "x-file-name": document.fileName,
        },
      });
    }

    if (document.dataUrl) {
      const buffer = dataUrlToBuffer(document.dataUrl);
      return new Response(buffer, {
        headers: {
          "Content-Type": "audio/wav",
          "x-recorded-at": document.createdAt,
          "x-file-name": document.fileName,
        },
      });
    }

    return NextResponse.json(
      { message: "Recording not available yet" },
      { status: 409 }
    );
  } catch (error) {
    console.error("Failed to stream recording", error);
    return NextResponse.json(
      { message: "Unable to stream recording" },
      { status: 500 }
    );
  }
}
