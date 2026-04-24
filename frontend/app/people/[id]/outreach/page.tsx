import { notFound } from "next/navigation";
import { getPersonById } from "@/lib/queries";
import { BackButton } from "@/components/shared/BackButton";
import { PageHeader } from "@/components/shared/PageHeader";

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const person = await getPersonById(params.id);
    return { title: `Outreach for ${person?.full_name ?? "Person"}` };
  } catch {
    return { title: "Outreach Draft" };
  }
}

export default async function PersonOutreachPage({ params }: { params: { id: string } }) {
  let person;
  try {
    person = await getPersonById(params.id);
  } catch {
    notFound();
  }

  if (!person) notFound();

  const templates = [
    {
      title: "Event invitation",
      body: `Hello ${person.preferred_name || person.full_name},\n\nInnovation SL would like to invite you to an upcoming programme activity. We believe your background and engagement history make you a strong fit for this session.\n\nPlease let us know if you would like to receive the full invitation details.\n\nBest regards,\nInnovation SL`,
    },
    {
      title: "Follow-up after engagement",
      body: `Hello ${person.preferred_name || person.full_name},\n\nThank you for engaging with Innovation SL. We are following up to understand your next steps and whether additional support, mentorship or programme referrals would be useful.\n\nPlease reply with a convenient time for a short follow-up.\n\nBest regards,\nInnovation SL`,
    },
    {
      title: "VIP relationship touchpoint",
      body: `Hello ${person.preferred_name || person.full_name},\n\nWe hope you are well. Innovation SL is reaching out to maintain our relationship and share a short update on current ecosystem activities and opportunities for collaboration.\n\nPlease let us know if you would be open to a brief catch-up.\n\nBest regards,\nInnovation SL`,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <BackButton href={`/people/${person.person_id}`} label="Person profile" ref={person.isl_ref} />

      <PageHeader
        title="Outreach drafts"
        subtitle={`Prepared outreach templates for ${person.full_name}`}
        actions={[
          person.email_primary
            ? {
                label: "Open email",
                href: `mailto:${person.email_primary}?subject=${encodeURIComponent(`Innovation SL outreach for ${person.full_name}`)}`,
                variant: "primary",
              }
            : { label: "Open email", variant: "primary" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col gap-4">
          {templates.map((template) => (
            <div key={template.title} className="isl-card p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-medium">{template.title}</p>
                {person.email_primary ? (
                  <a
                    href={`mailto:${person.email_primary}?subject=${encodeURIComponent(template.title)}&body=${encodeURIComponent(template.body)}`}
                    className="rounded-lg border border-border bg-white px-3 py-1.5 text-[11px] font-medium text-[#1E40AF] hover:bg-muted/50"
                  >
                    Use template
                  </a>
                ) : (
                  <span className="text-[10px] text-muted-foreground">No email on record</span>
                )}
              </div>
              <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-white p-4 text-[11px] leading-relaxed text-foreground border border-border">
                {template.body}
              </pre>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="isl-card p-5">
            <p className="text-[12px] font-medium mb-3">Recipient summary</p>
            <div className="space-y-2">
              <Summary label="Primary email" value={person.email_primary} />
              <Summary label="Primary phone" value={person.phone_primary} />
              <Summary label="First programme" value={person.first_programme} />
              <Summary label="Events attended" value={String(person.total_events_attended ?? 0)} />
              <Summary label="Programmes engaged" value={String(person.total_programmes ?? 0)} />
            </div>
          </div>

          <div className="isl-card p-5">
            <p className="text-[12px] font-medium mb-3">Suggested next step</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {person.total_events_attended > 2
                ? "This person has repeat engagement history. A personalised follow-up or invitation to a higher-touch programme is likely appropriate."
                : "This person has limited recorded engagement. Start with a concise invitation or check-in before sending a broader ask."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-white px-4 py-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-[11px] font-medium text-foreground">{value || "-"}</p>
    </div>
  );
}
