"use client";

import { useEffect, useRef, useState } from "react";
import {
  savePlayerCharacterPdfFormData,
  type CharacterPdfFormSaveState,
} from "../actions";
import {
  isCharacterPdfFormData,
  type CharacterPdfFormData,
} from "@/lib/character-pdf";

type PdfEditorStatus = {
  error?: string;
  message?: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

export default function CharacterPdfEditor({
  characterId,
  initialFormData,
}: {
  characterId: string;
  initialFormData: CharacterPdfFormData;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const annotationStorageRef = useRef<{
    [Symbol.iterator](): IterableIterator<[string, object]>;
  } | null>(null);
  const initialFormDataRef = useRef(initialFormData);
  const [loadError, setLoadError] = useState("");
  const [status, setStatus] = useState<PdfEditorStatus>({
    message: "Loading the Pathfinder sheet…",
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let cancelled = false;
    let loadingTask:
      | ReturnType<typeof import("pdfjs-dist").getDocument>
      | undefined;
    let viewer: import("pdfjs-dist/web/pdf_viewer.mjs").PDFViewer | undefined;
    let eventBus:
      | import("pdfjs-dist/web/pdf_viewer.mjs").EventBus
      | undefined;
    let linkService:
      | import("pdfjs-dist/web/pdf_viewer.mjs").PDFLinkService
      | undefined;

    const markAsChanged = () => {
      setIsDirty(true);
      setStatus({ message: "Unsaved changes." });
    };
    const setPageWidth = () => {
      if (viewer) {
        viewer.currentScaleValue = "page-width";
      }
    };

    container.addEventListener("input", markAsChanged);
    container.addEventListener("change", markAsChanged);

    async function loadSheet() {
      try {
        const [pdfjs, pdfViewerModule] = await Promise.all([
          import("pdfjs-dist"),
          import("pdfjs-dist/web/pdf_viewer.mjs"),
        ]);
        if (cancelled || !container) {
          return;
        }

        pdfjs.GlobalWorkerOptions.workerSrc =
          `/pdfjs-worker?version=${encodeURIComponent(pdfjs.version)}`;
        eventBus = new pdfViewerModule.EventBus();
        linkService = new pdfViewerModule.PDFLinkService({ eventBus });
        viewer = new pdfViewerModule.PDFViewer({
          container,
          eventBus,
          linkService,
        });
        linkService.setViewer(viewer);
        eventBus.on("pagesinit", setPageWidth);

        loadingTask = pdfjs.getDocument({
          url: "/pathfinder-character-sheet.pdf",
        });
        const pdfDocument = await loadingTask.promise;
        if (cancelled) {
          await loadingTask.destroy();
          return;
        }

        for (const [fieldId, value] of Object.entries(
          initialFormDataRef.current,
        )) {
          pdfDocument.annotationStorage.setValue(fieldId, value);
        }
        annotationStorageRef.current = pdfDocument.annotationStorage;
        linkService.setDocument(pdfDocument);
        viewer.setDocument(pdfDocument);
        setStatus({ message: "Sheet ready. Changes are saved when you choose Save." });
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "The character sheet could not be loaded.",
          );
          setStatus({});
        }
      }
    }

    void loadSheet();

    return () => {
      cancelled = true;
      container.removeEventListener("input", markAsChanged);
      container.removeEventListener("change", markAsChanged);
      eventBus?.off("pagesinit", setPageWidth);
      viewer?.cleanup();
      void loadingTask?.destroy();
      annotationStorageRef.current = null;
    };
  }, [characterId]);

  async function saveSheet() {
    const annotationStorage = annotationStorageRef.current;
    if (!annotationStorage || !isDirty || isSaving) {
      return;
    }

    const formData = Object.fromEntries(annotationStorage);
    if (!isCharacterPdfFormData(formData)) {
      setStatus({
        error: "The edited character sheet contains invalid or oversized form data.",
      });
      return;
    }

    setIsSaving(true);
    setStatus({ message: "Saving character sheet…" });
    let result: CharacterPdfFormSaveState;
    try {
      result = await savePlayerCharacterPdfFormData(characterId, formData);
    } catch (error) {
      setStatus({ error: `Unable to save the character sheet: ${getErrorMessage(error)}` });
      setIsSaving(false);
      return;
    }
    setIsSaving(false);

    if (result.error) {
      setStatus({ error: result.error });
      return;
    }

    const latestFormData = Object.fromEntries(annotationStorage);
    const changedDuringSave =
      JSON.stringify(latestFormData) !== JSON.stringify(formData);
    setIsDirty(changedDuringSave);
    setStatus({
      message: changedDuringSave
        ? "Saved, but newer edits made during the save still need saving."
        : result.message ?? "Character sheet saved.",
    });
  }

  return (
    <section className="entry-card canonical-pdf-card">
      <div className="character-sheet-controls">
        <button
          type="button"
          onClick={saveSheet}
          disabled={!isDirty || isSaving || Boolean(loadError)}
        >
          {isSaving ? "Saving…" : "Save character sheet"}
        </button>
        <a download href="/pathfinder-character-sheet.pdf">
          Download a blank PDF
        </a>
        {status.error ? (
          <p className="error" role="alert">
            {status.error}
          </p>
        ) : status.message ? (
          <p aria-live="polite" className="muted">
            {status.message}
          </p>
        ) : null}
      </div>
      {loadError ? (
        <p className="error" role="alert">
          Unable to load the Pathfinder sheet: {loadError}
        </p>
      ) : null}
      <div className="character-sheet-canvas">
        <div
          aria-label="Editable Pathfinder character sheet"
          className="pdfjs-viewer-container"
          ref={containerRef}
          role="region"
        >
          <div className="pdfViewer" />
        </div>
      </div>
    </section>
  );
}
