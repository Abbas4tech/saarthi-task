import { Appointment, Customer } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface Props {
  appointments: Appointment[];
  customers: Customer[];
  selectedCustomerId: string | null;
  onReview: (appointmentId: string) => void;
  onRecord: (appointmentId: string) => void;
}

const statusConfig: Record<
  Appointment["status"],
  { label: string; badge: "success" | "warning" | "destructive" | "default" }
> = {
  DONE: { label: "Completed", badge: "success" },
  PENDING: { label: "Awaiting action", badge: "warning" },
  CANCELLED: { label: "Cancelled", badge: "destructive" },
};

export function AppointmentBoard({
  appointments,
  customers,
  selectedCustomerId,
  onReview,
  onRecord,
}: Props) {
  const visibleAppointments = selectedCustomerId
    ? appointments.filter(
        (appointment) => appointment.customerId === selectedCustomerId
      )
    : appointments;

  return (
    <Card className="space-y-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-tight text-zinc-500">
          Engagement timeline
        </p>
        <h2 className="text-lg font-semibold text-zinc-950">Appointments</h2>
      </header>

      <div className="space-y-3">
        {visibleAppointments.map((appointment) => {
          const customer = customers.find(
            (c) => c.id === appointment.customerId
          );
          const status = statusConfig[appointment.status];

          return (
            <article
              key={appointment.id}
              className="rounded-2xl border border-zinc-200 p-4 shadow-sm dark:border-zinc-800"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-400">
                    {customer?.name ?? "Unknown customer"}
                  </p>
                  <h3 className="text-base font-semibold text-zinc-950">
                    {appointment.title}
                  </h3>
                  <p className="text-sm text-zinc-500">
                    {formatDate(appointment.scheduledFor)}
                  </p>
                </div>
                <Badge variant={status.badge}>{status.label}</Badge>
              </div>
              <p className="mt-3 text-sm text-zinc-600">{appointment.notes}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {appointment.status === "DONE" ? (
                  <Button
                    variant="outline"
                    onClick={() => onReview(appointment.id)}
                  >
                    Review recording
                  </Button>
                ) : null}
                {appointment.status === "PENDING" ? (
                  <Button onClick={() => onRecord(appointment.id)}>
                    Open recorder
                  </Button>
                ) : null}
                {appointment.status === "CANCELLED" ? (
                  <Button variant="ghost" disabled>
                    Awaiting reschedule
                  </Button>
                ) : null}
              </div>
            </article>
          );
        })}
        {visibleAppointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
            Select a customer to see their appointments.
          </div>
        ) : null}
      </div>
    </Card>
  );
}
