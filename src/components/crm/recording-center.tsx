import { useEffect, useMemo, useRef, useState } from "react";
import { Appointment, Customer, RecordingArtifact } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useRecordingManager } from "@/hooks/useRecordingManager";
import { formatDate } from "@/lib/utils";

interface Props {
  appointment?: Appointment;
  customers: Customer[];
  onRecordingReady?: (artifact: RecordingArtifact) => void;
  onRecordingSynced?: (recording: RecordingArtifact) => void;
}

const stateLabel = {
  idle: "Recorder idle",
  recording: "Recording in progress",
  paused: "Paused",
  finalising: "Saving locally",
};

export function RecordingCenter({
  appointment,
  customers,
  onRecordingReady,
  onRecordingSynced,
}: Props) {
  const [recipientOverrides, setRecipientOverrides] = useState<
    Record<string, string>
  >({});

  const {
    status,
    recordings,
    isSupported,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    updateRecipient,
    deliverRecording,
  } = useRecordingManager();
  const syncedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    recordings.forEach((recording) => {
      if (
        recording.state === "SYNCED" &&
        !syncedRef.current.has(recording.id)
      ) {
        syncedRef.current.add(recording.id);
        onRecordingSynced?.(recording);
      }
    });
  }, [recordings, onRecordingSynced]);

  const selectedCustomer = appointment
    ? recipientOverrides[appointment.id] ??
      appointment.customerId ??
      customers[0]?.id
    : undefined;

  const updateSelectedCustomer = (customerId: string) => {
    if (!appointment) return;
    setRecipientOverrides((prev) => ({
      ...prev,
      [appointment.id]: customerId,
    }));
  };

  const handleStart = () => {
    if (!appointment) return;
    startRecording(appointment.id);
  };

  const handleStop = async () => {
    if (!appointment || !selectedCustomer) return;
    const artifact = await stopRecording(selectedCustomer);
    if (artifact) {
      onRecordingReady?.(artifact);
    }
  };

  const canStart = Boolean(appointment && status === "idle" && isSupported);
  const canPause = status === "recording";
  const canResume = status === "paused";
  const canStop = status === "recording" || status === "paused";

  const activeCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomer),
    [customers, selectedCustomer]
  );

  return (
    <Card className="space-y-4">
      <header className="flex flex-col gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-tight text-zinc-500">
            Capture
          </p>
          <h2 className="text-lg font-semibold text-zinc-200">
            Recording cockpit
          </h2>
        </div>
        {appointment ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 p-4">
            <p className="text-sm text-zinc-500">Preparing for</p>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-zinc-900">
                {appointment.title}
              </h3>
              <Badge variant="outline">
                {customers.find(
                  (customer) => customer.id === appointment.customerId
                )?.name ?? "Unknown"}
              </Badge>
            </div>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500">
            Select a pending appointment to activate the recorder.
          </p>
        )}
      </header>

      <section className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-zinc-400">
          Recorder state
        </p>
        <Badge variant={status === "recording" ? "warning" : "outline"}>
          {stateLabel[status]}
        </Badge>
        {!isSupported ? (
          <p className="text-sm text-rose-500">
            Recording is unavailable in this browser. Please switch to a modern
            Chromium browser.
          </p>
        ) : null}
        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      </section>

      <section className="flex flex-wrap gap-2">
        <Button onClick={handleStart} disabled={!canStart}>
          Start recording
        </Button>
        <Button variant="outline" onClick={pauseRecording} disabled={!canPause}>
          Pause
        </Button>
        <Button
          variant="outline"
          onClick={resumeRecording}
          disabled={!canResume}
        >
          Resume
        </Button>
        <Button variant="secondary" onClick={handleStop} disabled={!canStop}>
          Stop & save
        </Button>
      </section>

      <Separator />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-900">
            Send recording to
          </p>
          <select
            className="rounded-md border border-zinc-200 px-3 py-2 text-sm"
            value={selectedCustomer ?? ""}
            onChange={(event) => updateSelectedCustomer(event.target.value)}
            disabled={!appointment}
          >
            <option value="" disabled>
              Select customer
            </option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
        {activeCustomer ? (
          <p className="text-xs text-zinc-500">
            Delivering insights to {activeCustomer.name}
          </p>
        ) : null}
      </section>

      <Separator />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-900">
            Local recordings
          </p>
          <Badge variant="outline">{recordings.length} stored</Badge>
        </div>
        <div className="space-y-2">
          {recordings.map((recording) => (
            <RecordingRow
              key={recording.id}
              recording={recording}
              customers={customers}
              onRecipientChange={updateRecipient}
              onSend={deliverRecording}
            />
          ))}
          {recordings.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500">
              Recordings will appear here once captured. They are stored locally
              first and automatically synced in the background.
            </p>
          ) : null}
        </div>
      </section>
    </Card>
  );
}

interface RecordingRowProps {
  recording: RecordingArtifact;
  customers: Customer[];
  onRecipientChange: (recordingId: string, customerId: string) => void;
  onSend: (recordingId: string, customerId: string) => Promise<void>;
}

function RecordingRow({
  recording,
  customers,
  onRecipientChange,
  onSend,
}: RecordingRowProps) {
  const [sending, setSending] = useState(false);

  const stateBadge: Record<
    RecordingArtifact["state"],
    {
      label: string;
      variant: "success" | "warning" | "destructive" | "outline";
    }
  > = {
    LOCAL: { label: "Local only", variant: "warning" },
    UPLOADING: { label: "Uploading", variant: "warning" },
    SYNCED: { label: "Synced", variant: "success" },
    FAILED: { label: "Retry needed", variant: "destructive" },
  };

  const delivered = Boolean(recording.deliveredAt);
  const state = delivered
    ? { label: "Delivered", variant: "success" as const }
    : stateBadge[recording.state];

  const handleSend = async () => {
    if (!recording.customerId || delivered) return;
    try {
      setSending(true);
      await onSend(recording.id, recording.customerId);
    } catch (error) {
      console.error("Failed to deliver recording", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-zinc-900">{recording.fileName}</p>
          <p className="text-xs text-zinc-500">
            {(recording.size / 1024).toFixed(1)} KB •{" "}
            {new Date(recording.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <Badge variant={state.variant}>{state.label}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <select
          className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm"
          value={recording.customerId}
          onChange={(event) =>
            onRecipientChange(recording.id, event.target.value)
          }
        >
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSend}
          disabled={sending || delivered || !recording.customerId}
          loading={sending}
        >
          {delivered ? "Sent" : "Send to customer"}
        </Button>
        <div className="w-full text-xs">
          {delivered && recording.deliveredAt ? (
            <p className="text-emerald-600">
              Delivered {formatDate(recording.deliveredAt)}
            </p>
          ) : (
            <p className="text-zinc-500">
              Assign a recipient then click send to sync with CRM.
            </p>
          )}
        </div>
        {recording.dataUrl ? (
          <audio controls className="mt-2 w-full">
            <source src={recording.dataUrl} type="audio/wav" />
          </audio>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">
            Recording stored remotely. Use the timeline to review.
          </p>
        )}
      </div>
    </div>
  );
}
