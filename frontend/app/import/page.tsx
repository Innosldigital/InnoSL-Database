"use client";
import { useState }          from "react";
import { ImportUploadZone }  from "@/components/import/ImportUploadZone";
import { FieldMapper }       from "@/components/import/FieldMapper";
import { ValidationPanel }   from "@/components/import/ValidationPanel";
import { DuplicateResolver } from "@/components/import/DuplicateResolver";
import { ApprovalPanel }     from "@/components/import/ApprovalPanel";
import { PipelineSteps }     from "@/components/import/PipelineSteps";
import { ConnectedSources }  from "@/components/import/ConnectedSources";
import { CleaningRules }     from "@/components/import/CleaningRules";
import { CompletenessBar }   from "@/components/import/CompletenessBar";
import { PageHeader }        from "@/components/shared/PageHeader";

export type ImportStep = 0 | 1 | 2 | 3 | 4;

export default function ImportPage() {
  const [step, setStep]               = useState<ImportStep>(0);
  const [uploadedData, setUploadedData] = useState<Record<string, string>[]>([]);
  const [fieldMap, setFieldMap]       = useState<Record<string, string>>({});
  const [targetTable, setTargetTable] = useState<string>("person");
  const [batchId, setBatchId]         = useState<string>("");
  const [stagingId, setStagingId]     = useState<string>("");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Data import & cleaning"
        subtitle="Upload, map, validate and approve new data · all sources 2018–2026"
        actions={[
          { label: "Run health audit", variant: "secondary" },
          { label: "View queue",       href: "/import/queue", variant: "primary" },
        ]}
      />

      <PipelineSteps current={step} onSelect={setStep} />

      <div className="isl-card">
        {step === 0 && (
          <ImportUploadZone
            onUploaded={(data, batch, sid) => {
              setUploadedData(data);
              setBatchId(batch);
              setStagingId(sid ?? "");
              setStep(1);
            }}
          />
        )}
        {step === 1 && (
          <FieldMapper
            data={uploadedData}
            onConfirm={(map, table) => {
              setFieldMap(map);
              setTargetTable(table);
              setStep(2);
            }}
          />
        )}
        {step === 2 && (
          <ValidationPanel
            data={uploadedData}
            fieldMap={fieldMap}
            targetTable={targetTable}
            onContinue={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <DuplicateResolver
            batchId={batchId}
            onContinue={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <ApprovalPanel
            batchId={batchId}
            stagingId={stagingId}
            fieldMap={fieldMap}
            targetTable={targetTable}
            data={uploadedData}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ConnectedSources />
        <CleaningRules />
      </div>

      <CompletenessBar />
    </div>
  );
}