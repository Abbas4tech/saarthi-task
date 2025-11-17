import { Appointment, Customer } from "./types";

export const customers: Customer[] = [
  {
    id: "cust-1",
    name: "Asha Menon",
    title: "Head of Customer Ops • Zephyr Labs",
    email: "asha.menon@zephyrlabs.io",
    priority: "High",
    segment: "Enterprise",
    location: "Bengaluru, India",
  },
  {
    id: "cust-2",
    name: "Ryan Barreto",
    title: "VP Product • Vanta Capital",
    email: "ryan.barreto@vanta.capital",
    priority: "Medium",
    segment: "Growth",
    location: "Singapore",
  },
  {
    id: "cust-3",
    name: "Meera Thomas",
    title: "CTO • Aurum Retail",
    email: "meera@aurumretail.com",
    priority: "Low",
    segment: "SMB",
    location: "Dubai, UAE",
  },
];

export const appointments: Appointment[] = [
  {
    id: "appt-1",
    customerId: "cust-1",
    title: "Quarterly health check",
    scheduledFor: new Date().toISOString(),
    status: "DONE",
    notes: "Walked through the escalations dashboard and platform uptime.",
    recordingId: "demo-recording",
  },
  {
    id: "appt-2",
    customerId: "cust-1",
    title: "AI handoff workshop",
    scheduledFor: new Date(Date.now() + 3600 * 1000).toISOString(),
    status: "PENDING",
    notes: "Need to finalise success criteria before Friday.",
  },
  {
    id: "appt-3",
    customerId: "cust-2",
    title: "Renewal prep",
    scheduledFor: new Date(Date.now() - 86400 * 1000).toISOString(),
    status: "CANCELLED",
    notes: "Client rescheduled after budget approvals slipped.",
  },
  {
    id: "appt-4",
    customerId: "cust-3",
    title: "Onboarding sprint demo",
    scheduledFor: new Date(Date.now() + 86400 * 1000 * 2).toISOString(),
    status: "PENDING",
    notes: "Need to showcase shipment workflow and success metrics.",
  },
];
