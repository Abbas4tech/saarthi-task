"use client";

import { useEffect, useMemo, useState } from "react";
import {
  customers as initialCustomers,
  appointments as initialAppointments,
} from "@/lib/mock-data";
import { Appointment, Customer, RecordingArtifact } from "@/lib/types";
import { CustomerList } from "@/components/crm/customer-list";
import { AppointmentBoard } from "@/components/crm/appointment-board";
import { RecordingCenter } from "@/components/crm/recording-center";
import { PlaybackPanel } from "@/components/crm/playback-panel";

type LibraryEntry = {
  url?: string;
  recordedAt: string;
  customerId?: string;
  fileId?: string;
  source: "local" | "remote";
};

const demoRecordingLibrary: Record<string, LibraryEntry> = {
  "demo-recording": {
    url: "https://interactive-examples.mdn.mozilla.net/media/examples/t-rex-roar.mp3",
    recordedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    source: "local",
  },
};

export default function Home() {
  const [customers] = useState<Customer[]>(initialCustomers);
  const [appointments, setAppointments] =
    useState<Appointment[]>(initialAppointments);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    customers[0]?.id ?? null
  );
  const [recorderAppointmentId, setRecorderAppointmentId] = useState<
    string | null
  >(null);
  const [library, setLibrary] =
    useState<Record<string, LibraryEntry>>(demoRecordingLibrary);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [playbackMedia, setPlaybackMedia] = useState<{
    url: string;
    recordedAt: string;
  } | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isFetchingPlayback, setIsFetchingPlayback] = useState(false);

  const selectedAppointment = useMemo(
    () =>
      appointments.find(
        (appointment) => appointment.id === recorderAppointmentId
      ),
    [appointments, recorderAppointmentId]
  );

  const playbackAppointment = useMemo(
    () => appointments.find((appointment) => appointment.id === playbackId),
    [appointments, playbackId]
  );

  const playbackMetadata =
    playbackAppointment && playbackMedia
      ? {
          title: playbackAppointment.title,
          customer:
            customers.find(
              (customer) => customer.id === playbackAppointment.customerId
            )?.name ?? "Unknown customer",
          recordedAt: playbackMedia.recordedAt,
          url: playbackMedia.url,
        }
      : undefined;

  const handleRecordingReady = (artifact: RecordingArtifact) => {
    setLibrary((prev) => ({
      ...prev,
      [artifact.id]: {
        url: artifact.dataUrl,
        recordedAt: artifact.createdAt,
        customerId: artifact.customerId,
        source: "local",
      },
    }));
    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === artifact.appointmentId
          ? { ...appointment, status: "DONE", recordingId: artifact.id }
          : appointment
      )
    );
    setRecorderAppointmentId(null);
  };

  const handleRecordingSynced = (recording: RecordingArtifact) => {
    setLibrary((prev) => {
      const current = prev[recording.id] ?? {
        recordedAt: recording.createdAt,
        source: "remote" as const,
      };
      return {
        ...prev,
        [recording.id]: {
          ...current,
          url: undefined,
          fileId: recording.fileId,
          source: "remote",
        },
      };
    });
  };

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    const appointment = playbackAppointment;
    if (!appointment || !appointment.recordingId) {
      setPlaybackMedia(null);
      setPlaybackError(null);
      setIsFetchingPlayback(false);
      return;
    }
    const entry = library[appointment.recordingId];
    if (entry?.source === "local" && entry.url) {
      setPlaybackMedia({ url: entry.url, recordedAt: entry.recordedAt });
      setPlaybackError(null);
      setIsFetchingPlayback(false);
      return;
    }
    const fetchRecording = async () => {
      setIsFetchingPlayback(true);
      setPlaybackError(null);
      try {
        const response = await fetch(
          `/api/recordings/${appointment.recordingId}`
        );
        if (!response.ok) {
          throw new Error("Recording is not available yet.");
        }
        const recordedAt =
          response.headers.get("x-recorded-at") ??
          entry?.recordedAt ??
          appointment.scheduledFor;
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setPlaybackMedia({ url: objectUrl, recordedAt });
        }
      } catch (err) {
        if (!cancelled) {
          setPlaybackError((err as Error).message);
          setPlaybackMedia(null);
        }
      } finally {
        if (!cancelled) {
          setIsFetchingPlayback(false);
        }
      }
    };
    fetchRecording();
    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [playbackAppointment, library]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-6 py-10 font-sans">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-tight text-zinc-500">
            Saarthi CRM
          </p>
          <h1 className="text-3xl font-semibold text-zinc-950">
            Relationship cockpit with recording workflows
          </h1>
          <p className="text-base text-zinc-500">
            Track customers, orchestrate appointments, capture calls, and ship
            insights with background uploads.
          </p>
        </header>

        <main className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <CustomerList
              customers={customers}
              searchTerm={searchTerm}
              onSearch={setSearchTerm}
              selectedCustomerId={selectedCustomerId}
              onSelect={(customerId) => {
                setSelectedCustomerId(customerId);
                setRecorderAppointmentId(null);
              }}
            />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <AppointmentBoard
              appointments={appointments}
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              onReview={(appointmentId) => setPlaybackId(appointmentId)}
              onRecord={(appointmentId) =>
                setRecorderAppointmentId(appointmentId)
              }
            />
            <RecordingCenter
              appointment={selectedAppointment}
              customers={customers}
              onRecordingReady={handleRecordingReady}
              onRecordingSynced={handleRecordingSynced}
            />
          </div>
        </main>
      </div>

      <PlaybackPanel
        open={Boolean(playbackAppointment)}
        metadata={playbackMetadata}
        loading={isFetchingPlayback}
        error={playbackError}
        onClose={() => setPlaybackId(null)}
      />
    </div>
  );
}
