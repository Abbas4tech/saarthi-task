import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
  metadata?: {
    title: string;
    customer: string;
    recordedAt: string;
    url: string;
  };
}

export function PlaybackPanel({
  open,
  onClose,
  metadata,
  loading,
  error,
}: Props) {
  if (!open) return null;

  const mimeType = metadata?.url.startsWith("data:audio/wav")
    ? "audio/wav"
    : "audio/mpeg";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-white p-6 shadow-2xl dark:bg-zinc-950">
        <header className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-400">
              Playback
            </p>
            <h3 className="text-xl font-semibold text-zinc-950 dark:text-zinc-100">
              {metadata?.title ?? "Loading recording"}
            </h3>
            {metadata ? (
              <p className="text-sm text-zinc-500">
                {metadata.customer} • {formatDate(metadata.recordedAt)}
              </p>
            ) : null}
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </header>
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
          {error ? (
            <p className="text-sm text-rose-500">{error}</p>
          ) : loading || !metadata ? (
            <p className="text-sm text-zinc-500">Fetching recording…</p>
          ) : (
            <audio controls autoPlay className="w-full">
              <source src={metadata.url} type={mimeType} />
              Your browser does not support the audio element.
            </audio>
          )}
        </div>
      </div>
    </div>
  );
}
