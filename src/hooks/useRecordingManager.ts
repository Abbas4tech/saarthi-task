import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RecordRTCPromisesHandler } from "recordrtc";
import { RecordingArtifact } from "@/lib/types";

const STORAGE_KEY = "crm-recordings";
/**
 * Manages RecordRTC lifecycle + local-first persistence.
 * 1. Captures microphone audio with pause/resume controls.
 * 2. Writes WAV blobs to localStorage for instant playback.
 * 3. Streams uploads to the API (Mongo-ready) in the background.
 */

type RecorderStatus = "idle" | "recording" | "paused" | "finalising";

const readRecordings = (): RecordingArtifact[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecordingArtifact[]) : [];
  } catch {
    return [];
  }
};

const persistRecordings = (value: RecordingArtifact[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

export const useRecordingManager = () => {
  const recorderRef = useRef<RecordRTCPromisesHandler | null>(null);
  const recorderLibRef = useRef<typeof import("recordrtc") | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inflightUploads = useRef<Set<string>>(new Set());

  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [recordings, setRecordings] = useState<RecordingArtifact[]>(() =>
    readRecordings()
  );
  const [activeAppointment, setActiveAppointment] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const isSupported = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices?.getUserMedia === "function",
    []
  );

  useEffect(() => {
    persistRecordings(recordings);
  }, [recordings]);

  const resetRecorder = () => {
    recorderRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    setActiveAppointment(null);
    setStatus("idle");
  };

  const startRecording = useCallback(
    async (appointmentId: string) => {
      if (!isSupported) {
        setError("Recording APIs are not supported in this browser.");
        return;
      }
      if (status === "recording") return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaStreamRef.current = stream;
        if (!recorderLibRef.current) {
          recorderLibRef.current = await import("recordrtc");
        }
        const recorder = new recorderLibRef.current.RecordRTCPromisesHandler(
          stream,
          {
            type: "audio",
            mimeType: "audio/wav",
          }
        );
        recorderRef.current = recorder;
        await recorder.startRecording();
        setStatus("recording");
        setActiveAppointment(appointmentId);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [isSupported, status]
  );

  const pauseRecording = useCallback(() => {
    if (recorderRef.current && status === "recording") {
      recorderRef.current.pauseRecording();
      setStatus("paused");
    }
  }, [status]);

  const resumeRecording = useCallback(() => {
    if (recorderRef.current && status === "paused") {
      recorderRef.current.resumeRecording();
      setStatus("recording");
    }
  }, [status]);

  const stopRecording = useCallback(
    async (customerId: string) => {
      if (!recorderRef.current) return null;
      setStatus("finalising");
      try {
        await recorderRef.current.stopRecording();
        const blob = await recorderRef.current.getBlob();
        const dataUrl = await blobToBase64(blob);
        const fileName = `appointment-${activeAppointment}-${Date.now()}.wav`;

        const artifact: RecordingArtifact = {
          id: crypto.randomUUID(),
          appointmentId: activeAppointment ?? "unassigned",
          customerId,
          createdAt: new Date().toISOString(),
          fileName,
          dataUrl,
          size: blob.size,
          state: "LOCAL",
        };

        setRecordings((prev) => [artifact, ...prev]);
        resetRecorder();
        return artifact;
      } catch (err) {
        setError((err as Error).message);
        resetRecorder();
        return null;
      }
    },
    [activeAppointment]
  );

  const updateRecipient = useCallback(
    (recordingId: string, customerId: string) => {
      setRecordings((prev) =>
        prev.map((recording) =>
          recording.id === recordingId
            ? { ...recording, customerId }
            : recording
        )
      );
    },
    []
  );

  const deliverRecording = useCallback(
    async (recordingId: string, customerId: string) => {
      try {
        const response = await fetch("/api/recordings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recordingId, customerId }),
        });

        if (!response.ok) {
          throw new Error("Failed to send recording to customer");
        }

        const payload = (await response.json()) as { deliveredAt: string };

        setRecordings((prev) =>
          prev.map((recording) =>
            recording.id === recordingId
              ? {
                  ...recording,
                  customerId,
                  deliveredAt: payload.deliveredAt,
                  state: "SYNCED",
                }
              : recording
          )
        );
      } catch (err) {
        setError((err as Error).message);
        throw err;
      }
    },
    []
  );

  const uploadRecording = useCallback(async (recording: RecordingArtifact) => {
    setRecordings((prev) =>
      prev.map((item) =>
        item.id === recording.id ? { ...item, state: "UPLOADING" } : item
      )
    );

    try {
      const response = await fetch("/api/recordings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recording),
      });

      if (!response.ok) {
        throw new Error("Failed to sync recording");
      }

      setRecordings((prev) =>
        prev.map((item) =>
          item.id === recording.id ? { ...item, state: "SYNCED" } : item
        )
      );
    } catch (err) {
      setError((err as Error).message);
      setRecordings((prev) =>
        prev.map((item) =>
          item.id === recording.id ? { ...item, state: "FAILED" } : item
        )
      );
    } finally {
      inflightUploads.current.delete(recording.id);
    }
  }, []);

  useEffect(() => {
    recordings.forEach((recording) => {
      const shouldSync =
        recording.state === "LOCAL" || recording.state === "FAILED";
      if (!shouldSync) return;
      if (inflightUploads.current.has(recording.id)) return;
      inflightUploads.current.add(recording.id);
      void uploadRecording(recording);
    });
  }, [recordings, uploadRecording]);

  return {
    status,
    activeAppointment,
    recordings,
    isSupported,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    updateRecipient,
    deliverRecording,
  };
};

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read recording"));
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
