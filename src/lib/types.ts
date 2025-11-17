export type AppointmentStatus = "DONE" | "CANCELLED" | "PENDING";

export interface Customer {
  id: string;
  name: string;
  title: string;
  email: string;
  avatar?: string;
  priority: "High" | "Medium" | "Low";
  segment: "Enterprise" | "Growth" | "SMB";
  location: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  title: string;
  scheduledFor: string;
  status: AppointmentStatus;
  notes: string;
  recordingId?: string;
}

export interface RecordingArtifact {
  id: string;
  appointmentId: string;
  customerId: string;
  createdAt: string;
  fileName: string;
  dataUrl: string;
  size: number;
  state: "LOCAL" | "UPLOADING" | "SYNCED" | "FAILED";
  deliveredAt?: string;
}

export type RecordingDocument = RecordingArtifact & {
  _id: string;
  storedAt: string;
  fileId?: string;
};

export interface UploadJob {
  recordingId: string;
  startedAt: number;
  status: "PENDING" | "PROCESSING" | "DONE" | "ERROR";
}
