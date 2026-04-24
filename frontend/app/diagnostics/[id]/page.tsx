import { notFound } from "next/navigation";
import { getDiagnosticById } from "@/lib/queries";
import { BackButton } from "@/components/shared/BackButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { DiagnosticScoreGrid } from "@/components/diagnostics/DiagnosticScoreGrid";

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const diagnostic = await getDiagnosticById(params.id);
    return { title: diagnostic?.organisation?.name ?? "Diagnostic Record" };
  } catch {
    return { title: "Diagnostic Record" };
  }
}

export default async function DiagnosticDetailPage({ params }: { params: { id: string } }) {
  let diagnostic;
  try {
    diagnostic = await getDiagnosticById(params.id);
  } catch {
    notFound();
  }

  if (!diagnostic) notFound();

  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/diagnostics" label="Diagnostics" ref={diagnostic.isl_ref} />

      <PageHeader
        title={diagnostic.organisation?.name ?? "Diagnostic record"}
        subtitle={`${diagnostic.tool_used} · ${diagnostic.diag_date ?? "Date not set"}`}
        actions={[
          diagnostic.organisation?.org_id
            ? { label: "Organisation context", variant: "secondary" }
            : { label: "Organisation context", variant: "secondary" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-4">
          <DiagnosticScoreGrid diagnostic={diagnostic} />

          <div className="isl-card p-5">
            <p className="text-[12px] font-medium mb-3">Assessment notes</p>
            <div className="space-y-3">
              <NoteBlock label="Gap priority" value={diagnostic.gap_priority} />
              <NoteBlock label="TA recommended" value={diagnostic.ta_recommended} />
              <NoteBlock label="TA delivered" value={diagnostic.ta_delivered} />
              <NoteBlock label="Notes" value={diagnostic.notes} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="isl-card p-5">
            <p className="text-[12px] font-medium mb-3">Business context</p>
            <div className="space-y-2">
              <Detail label="Organisation" value={diagnostic.organisation?.name} />
              <Detail label="Sector" value={diagnostic.organisation?.sector} />
              <Detail label="Woman-led" value={diagnostic.woman_led_flag ? "Yes" : "No"} />
              <Detail label="Youth-led" value={diagnostic.youth_led_flag ? "Yes" : "No"} />
              <Detail label="Assessor" value={diagnostic.assessor} />
              <Detail label="Follow-up date" value={diagnostic.follow_up_date} />
              <Detail label="Tier" value={diagnostic.tier} />
            </div>
          </div>

          <div className="isl-card p-5">
            <p className="text-[12px] font-medium mb-3">Supporting files</p>
            <div className="space-y-2">
              <Linkish label="Scorecard document" href={diagnostic.scorecard_doc_link} />
              <Linkish label="Raw responses" href={diagnostic.raw_responses_link} />
            </div>
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
      <p className="mt-1 text-[11px] font-medium text-foreground break-words">{value || "-"}</p>
    </div>
  );
}

function NoteBlock({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-white px-4 py-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-foreground">{value || "No information recorded."}</p>
    </div>
  );
}

function Linkish({ label, href }: { label: string; href?: string | null }) {
  if (!href) {
    return <Detail label={label} value="Not available" />;
  }

  return (
    <a href={href} className="block rounded-xl border border-border bg-white px-4 py-3 hover:bg-muted/50">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-[11px] font-medium text-[#1E40AF] break-all">Open link</p>
    </a>
  );
}
