"use client";

import { useState, useTransition } from "react";
import {
  applyCampaignDataImport,
  previewCampaignDataImport,
  type CampaignImportPreview,
  type CampaignImportResult,
} from "./actions";

export default function CampaignImportForm() {
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<CampaignImportPreview | null>(null);
  const [result, setResult] = useState<CampaignImportResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [inputError, setInputError] = useState("");
  const [isPending, startTransition] = useTransition();

  function updateRaw(value: string) {
    setRaw(value);
    setPreview(null);
    setResult(null);
    setConfirmed(false);
    setInputError("");
  }

  function previewImport() {
    setResult(null);
    setInputError("");
    startTransition(async () => {
      const nextPreview = await previewCampaignDataImport(raw);
      setPreview(nextPreview);
      setConfirmed(false);
    });
  }

  function applyImport() {
    if (!confirmed || !preview || preview.issues.length) {
      return;
    }
    setResult(null);
    startTransition(async () => {
      setResult(await applyCampaignDataImport(raw));
    });
  }

  async function loadFile(file: File | undefined) {
    if (!file) {
      return;
    }
    if (file.size > 500_000) {
      setInputError("Choose a JSON file smaller than 500 KB.");
      return;
    }
    try {
      updateRaw(await file.text());
    } catch (error) {
      setInputError(
        error instanceof Error
          ? `Unable to read the selected file: ${error.message}`
          : "Unable to read the selected file.",
      );
    }
  }

  const conflicts = preview?.records.filter((record) => record.status === "conflict") ?? [];
  const readyCount = preview?.records.filter((record) => record.status === "ready").length ?? 0;
  const skippedCount =
    preview?.records.filter((record) => record.status === "already_imported").length ?? 0;

  return (
    <div className="form-stack">
      <label>
        Select an AI-prepared JSON file
        <input
          accept="application/json,.json"
          onChange={(event) => void loadFile(event.currentTarget.files?.[0])}
          type="file"
        />
      </label>
      <label>
        Or paste the JSON here
        <textarea
          onChange={(event) => updateRaw(event.currentTarget.value)}
          placeholder='{"format":"pathfinder-campaign-import","version":1,...}'
          rows={14}
          value={raw}
        />
      </label>
      {inputError ? (
        <p className="error" role="alert">
          {inputError}
        </p>
      ) : null}
      <div className="section-heading">
        <a download href="/campaign-import-template.json">
          Download empty import template
        </a>
        <a href="/campaign-import-guide.md" rel="noreferrer" target="_blank">
          Read the AI preparation guide
        </a>
      </div>
      <button disabled={isPending || !raw.trim()} onClick={previewImport} type="button">
        {isPending ? "Checking…" : "Validate and preview"}
      </button>

      {preview ? (
        <section className="entry-list" aria-labelledby="import-preview-heading">
          <h3 id="import-preview-heading">
            Preview{preview.title ? `: ${preview.title}` : ""}
          </h3>
          <p className="muted">
            {readyCount} new records · {skippedCount} already imported and unchanged ·{" "}
            {conflicts.length} conflicts
          </p>
          {preview.issues.length ? (
            <div className="form-stack">
              <h4>Fix these validation or reference issues</h4>
              {preview.issues.map((issue, index) => (
                <p className="error" key={`${issue.path}-${index}`} role="alert">
                  <strong>{issue.path}:</strong> {issue.message}
                </p>
              ))}
            </div>
          ) : null}
          {preview.records.length ? (
            <div className="entry-list">
              {preview.records.map((record) => (
                <article className="entry-card" key={`${record.type}:${record.key}`}>
                  <p className="eyebrow">
                    {record.type} · {record.status.replace(/_/g, " ")}
                  </p>
                  <h4>{record.name}</h4>
                  <p className="muted">
                    {record.canon_status} · {record.visibility} · source key:{" "}
                    <code>{record.key}</code>
                  </p>
                  {record.message ? <p className="notice">{record.message}</p> : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">This file contains no records to import.</p>
          )}
          {conflicts.length ? (
            <p className="error" role="alert">
              Resolve every conflict in the campaign or choose a unique source key
              and record name before importing. Nothing has been changed.
            </p>
          ) : null}
          {preview.issues.length === 0 && conflicts.length === 0 && readyCount > 0 ? (
            <>
              <label className="checkbox-label">
                <input
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.currentTarget.checked)}
                  type="checkbox"
                />
                I reviewed the canon status, visibility, links, and private notes above.
              </label>
              <button
                disabled={isPending || !confirmed}
                onClick={applyImport}
                type="button"
              >
                {isPending ? "Importing…" : `Import ${readyCount} new records`}
              </button>
            </>
          ) : null}
        </section>
      ) : null}

      {result ? (
        <section className="entry-list" aria-labelledby="import-result-heading">
          <h3 id="import-result-heading">
            {result.error ? "Import stopped" : "Import complete"}
          </h3>
          <p className="muted">
            {result.imported.length} imported · {result.skipped.length} already imported
          </p>
          {result.error ? (
            <pre className="error" role="alert">
              {result.error}
            </pre>
          ) : (
            <p className="notice">
              Imported records are now available in the GM workspace. Player-shared
              records follow the existing campaign visibility policies.
            </p>
          )}
          {result.imported.length ? (
            <details>
              <summary>Show imported source keys</summary>
              <ul>
                {result.imported.map((key) => (
                  <li key={key}>{key}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
