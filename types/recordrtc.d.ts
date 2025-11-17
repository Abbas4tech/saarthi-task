declare module "recordrtc" {
  interface RecordRTCOptions {
    type?: "audio" | "video" | "canvas" | "gif";
    mimeType?: string;
    recorderType?: unknown;
    desiredSampRate?: number;
    disableLogs?: boolean;
  }

  export class RecordRTCPromisesHandler {
    constructor(
      stream: MediaStream | MediaStream[],
      options?: RecordRTCOptions
    );
    startRecording(): Promise<void>;
    stopRecording(): Promise<void>;
    pauseRecording(): Promise<void>;
    resumeRecording(): Promise<void>;
    getBlob(): Promise<Blob>;
    reset(): void;
  }
}
