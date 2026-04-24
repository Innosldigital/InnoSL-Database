import { getTrainingSessions } from "@/lib/queries";
import { PageHeader } from "@/components/shared/PageHeader";

export const metadata = { title: "Training & Workshops" };

function formatDate(value?: string | null) {
  return value ? value.slice(0, 10) : "-";
}

export default async function TrainingPage() {
  const sessions = await getTrainingSessions();
  const totalAttended = sessions.reduce((sum, session) => sum + (session.total_attended ?? 0), 0);
  const totalWomen = sessions.reduce((sum, session) => sum + (session.female_count ?? 0), 0);
  const avgSatisfaction = sessions.length > 0
    ? Math.round((sessions.reduce((sum, session) => sum + Number(session.satisfaction_score ?? 0), 0) / sessions.length) * 10) / 10
    : 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Training & workshops"
        subtitle="All sessions - facilitators - cohorts - 2018-2026"
        actions={[{ label: "+ Add session", href: "/training/new", variant: "primary" }]}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard label="Sessions" value={sessions.length} />
        <MetricCard label="Participants attended" value={totalAttended} />
        <MetricCard label="Women reached" value={totalWomen} helper={avgSatisfaction > 0 ? `Avg satisfaction ${avgSatisfaction}/10` : "No survey scores yet"} />
      </div>

      <div className="isl-card overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              {["Topic", "Date", "Format", "Funder", "Facilitator", "Attended", "Linked event"].map((heading) => (
                <th key={heading}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[11px] text-muted-foreground">
                  No training sessions recorded yet.
                </td>
              </tr>
            ) : sessions.map((session) => (
              <tr key={session.training_id}>
                <td>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{session.topic}</span>
                    <span className="text-[10px] text-muted-foreground">{session.session_type ?? "Session"}</span>
                  </div>
                </td>
                <td>{formatDate(session.session_date)}</td>
                <td>{session.format ?? "-"}</td>
                <td>{session.programme_funder ?? "-"}</td>
                <td>{session.facilitator ?? "-"}</td>
                <td>{session.total_attended ?? 0}</td>
                <td className="text-muted-foreground">{session.event?.name ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: number; helper?: string }) {
  return (
    <div className="isl-card p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      {helper ? <p className="mt-1 text-[11px] text-muted-foreground">{helper}</p> : null}
    </div>
  );
}
