import { notFound } from "next/navigation";
import { getPersonById } from "@/lib/queries";
import { BackButton } from "@/components/shared/BackButton";
import { PageHeader } from "@/components/shared/PageHeader";

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const person = await getPersonById(params.id);
    return { title: `Contact ${person?.full_name ?? "Person"}` };
  } catch {
    return { title: "Contact Person" };
  }
}

export default async function PersonContactPage({ params }: { params: { id: string } }) {
  let person;
  try {
    person = await getPersonById(params.id);
  } catch {
    notFound();
  }

  if (!person) notFound();

  const vipProfiles = person.vip_contact ?? [];
  const channels = [
    person.email_primary ? {
      label: "Primary email",
      value: person.email_primary,
      href: `mailto:${person.email_primary}`,
      cta: "Send email",
    } : null,
    person.email_secondary ? {
      label: "Secondary email",
      value: person.email_secondary,
      href: `mailto:${person.email_secondary}`,
      cta: "Send email",
    } : null,
    person.phone_primary ? {
      label: "Primary phone",
      value: person.phone_primary,
      href: `tel:${person.phone_primary}`,
      cta: "Call number",
    } : null,
    person.phone_secondary ? {
      label: "Secondary phone",
      value: person.phone_secondary,
      href: `tel:${person.phone_secondary}`,
      cta: "Call number",
    } : null,
  ].filter(Boolean) as Array<{ label: string; value: string; href: string; cta: string }>;

  return (
    <div className="flex flex-col gap-4">
      <BackButton href={`/people/${person.person_id}`} label="Person profile" ref={person.isl_ref} />

      <PageHeader
        title="Contact workspace"
        subtitle={`Direct contact channels and relationship context for ${person.full_name}`}
        actions={[
          person.email_primary
            ? { label: "Email primary", href: `mailto:${person.email_primary}`, variant: "primary" as const }
            : { label: "Email primary", variant: "primary" as const },
          person.phone_primary
            ? { label: "Call primary", href: `tel:${person.phone_primary}`, variant: "secondary" as const }
            : { label: "Call primary", variant: "secondary" as const },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col gap-4">
          <div className="isl-card">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[12px] font-medium">Contact channels</p>
            </div>
            <div className="p-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {channels.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">No direct email or phone contact is recorded yet.</p>
              ) : channels.map((channel) => (
                <div key={`${channel.label}-${channel.value}`} className="rounded-xl border border-border bg-white p-4">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{channel.label}</p>
                  <p className="mt-1 text-[12px] font-medium text-foreground break-all">{channel.value}</p>
                  <a
                    href={channel.href}
                    className="mt-3 inline-flex rounded-lg border border-border bg-white px-3 py-1.5 text-[11px] font-medium text-[#1E40AF] hover:bg-muted/50"
                  >
                    {channel.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="isl-card p-5">
            <p className="text-[12px] font-medium mb-3">Location and verification</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Detail label="Location" value={person.location} />
              <Detail label="District" value={person.district} />
              <Detail label="Region" value={person.region} />
              <Detail label="Primary phone verified" value={person.phone_primary?.startsWith("+232") ? "Yes" : "Needs review"} />
              <Detail label="NIN on record" value={person.nin ? "Yes" : "No"} />
              <Detail label="Preferred name" value={person.preferred_name} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="isl-card p-5">
            <p className="text-[12px] font-medium mb-3">Quick actions</p>
            <div className="flex flex-col gap-2">
              {person.email_primary && (
                <a href={`mailto:${person.email_primary}?subject=${encodeURIComponent(`Innovation SL follow-up for ${person.full_name}`)}`} className={ACTION}>
                  Draft follow-up email
                </a>
              )}
              {person.phone_primary && (
                <a href={`tel:${person.phone_primary}`} className={ACTION}>
                  Call primary number
                </a>
              )}
              <a href={`/people/${person.person_id}/outreach`} className={ACTION}>
                Open outreach drafts
              </a>
            </div>
          </div>

          <div className="isl-card p-5">
            <p className="text-[12px] font-medium mb-3">Relationship context</p>
            {vipProfiles.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">This person is not currently tagged as a VIP relationship contact.</p>
            ) : (
              <div className="space-y-3">
                {vipProfiles.map((vip: any) => (
                  <div key={vip.contact_id} className="rounded-xl border border-border bg-white p-4">
                    <p className="text-[12px] font-medium text-foreground">{vip.title ?? person.full_name}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{vip.organisation ?? "Organisation not set"}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-2">{vip.contact_type}</p>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Events attended: {vip.events_attended ?? 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Relationship owner: {vip.relationship_owner ?? "Not assigned"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                      {vip.engagement_notes ?? vip.notes ?? "No engagement notes recorded yet."}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-white px-4 py-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-[11px] font-medium text-foreground">{value || "-"}</p>
    </div>
  );
}

const ACTION = "rounded-lg border border-border bg-white px-3 py-2 text-[11px] font-medium text-foreground hover:bg-muted/50";
