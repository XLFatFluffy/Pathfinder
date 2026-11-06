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
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

export default function CharacterPdfEditor({
  characterId,
  initialFormData,
  fullPage = false,
}: {
  characterId: string;
  initialFormData: CharacterPdfFormData;
  fullPage?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocumentRef =
    useRef<import("pdfjs-dist").PDFDocumentProxy | null>(null);
  const annotationStorageRef = useRef<{
    [Symbol.iterator](): IterableIterator<[string, object]>;
  } | null>(null);
  const initialFormDataRef = useRef(initialFormData);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);
  const isSavingRef = useRef(false);
  const retrySaveRef = useRef<() => void>(() => {});
  const [loadError, setLoadError] = useState("");
  const [printError, setPrintError] = useState("");
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState<PdfEditorStatus>({
    message: "Loading character sheet…",
  });
  const [isSaving, setIsSaving] = useState(false);

  async function printCharacterSheet() {
    const pdfDocument = pdfDocumentRef.current;
    if (!pdfDocument) {
      return;
    }

    const printWindow = window.open("about:blank", "_blank");
    if (!printWindow) {
      setPrintError("Allow pop-ups to print your completed character sheet.");
      return;
    }

    setPrintError("");
    setIsPreparingPrint(true);
    setStatus({ message: "Preparing the completed sheet for printing…" });

    try {
      const pdfData = await pdfDocument.saveDocument();
      const pdfUrl = URL.createObjectURL(
        new Blob([new Uint8Array(pdfData).buffer], {
          type: "application/pdf",
        }),
      );
      printWindow.addEventListener(
        "load",
        () => {
          try {
            printWindow.addEventListener(
              "pagehide",
              () => URL.revokeObjectURL(pdfUrl),
              { once: true },
            );
            printWindow.focus();
            printWindow.print();
          } catch (error) {
            setPrintError(
              `The print dialog could not be opened: ${getErrorMessage(error)}. Use the PDF tab's print control instead.`,
            );
          }
        },
        { once: true },
      );
      printWindow.location.replace(pdfUrl);
      setStatus({
        message: "Your completed sheet is ready in the print dialog.",
      });
    } catch (error) {
      printWindow.close();
      setPrintError(
        `Unable to prepare the character sheet for printing: ${getErrorMessage(error)}`,
      );
    } finally {
      setIsPreparingPrint(false);
    }
  }

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

    async function saveChanges() {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      const annotationStorage = annotationStorageRef.current;
      if (!annotationStorage || !isDirtyRef.current) {
        return;
      }
      if (isSavingRef.current) {
        saveTimerRef.current = setTimeout(() => {
          void saveChanges();
        }, 250);
        return;
      }

      const formData = Object.fromEntries(annotationStorage);
      if (!isCharacterPdfFormData(formData)) {
        if (!cancelled) {
          setStatus({
            error: "The character sheet has invalid or oversized form data.",
          });
        }
        return;
      }

      isSavingRef.current = true;
      if (!cancelled) {
        setIsSaving(true);
        setStatus({ message: "Saving…" });
      }

      let result: CharacterPdfFormSaveState;
      try {
        result = await savePlayerCharacterPdfFormData(characterId, formData);
      } catch (error) {
        result = { error: `Unable to save character sheet: ${getErrorMessage(error)}` };
      }

      isSavingRef.current = false;
      if (!cancelled) {
        setIsSaving(false);
      }
      if (result.error) {
        if (!cancelled) {
          setStatus({ error: result.error });
        }
        return;
      }

      const latestFormData = Object.fromEntries(annotationStorage);
      const hasNewerChanges =
        JSON.stringify(latestFormData) !== JSON.stringify(formData);
      isDirtyRef.current = hasNewerChanges;
      if (hasNewerChanges) {
        if (cancelled) {
          void saveChanges();
        } else {
          setStatus({ message: "Saving latest changes…" });
          saveTimerRef.current = setTimeout(() => {
            void saveChanges();
          }, 0);
        }
      } else if (!cancelled) {
        setStatus({ message: result.message ?? "All changes saved." });
      }
    }

    function scheduleSave(delay = 700) {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        void saveChanges();
      }, delay);
    }

    function markChanged() {
      markModified(700);
    }

    function markChangedImmediately() {
      markModified(0);
    }

    function markModified(delay: number) {
      if (!annotationStorageRef.current) {
        return;
      }
      isDirtyRef.current = true;
      setStatus({ message: "Unsaved changes…" });
      scheduleSave(delay);
    }

    function saveOnPageHide() {
      void saveChanges();
    }

    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (isDirtyRef.current || isSavingRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    }

    function saveOnFocusOut() {
      if (isDirtyRef.current) {
        scheduleSave(0);
      }
    }

    retrySaveRef.current = () => {
      void saveChanges();
    };

    const setPageWidth = () => {
      if (viewer) {
        viewer.currentScaleValue = "page-width";
      }
    };

    container.addEventListener("input", markChanged);
    container.addEventListener("change", markChangedImmediately);
    container.addEventListener("focusout", saveOnFocusOut);
    window.addEventListener("pagehide", saveOnPageHide);
    window.addEventListener("beforeunload", warnBeforeUnload);

    async function loadSheet() {
      try {
        const pdfjs = await import("pdfjs-dist");
        const pdfViewerModule = await import("pdfjs-dist/web/pdf_viewer.mjs");
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
        pdfDocumentRef.current = pdfDocument;
        annotationStorageRef.current = pdfDocument.annotationStorage;
        linkService.setDocument(pdfDocument);
        viewer.setDocument(pdfDocument);
        setIsReady(true);
        setStatus({ message: "Changes save automatically." });
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
      container.removeEventListener("input", markChanged);
      container.removeEventListener("change", markChangedImmediately);
      container.removeEventListener("focusout", saveOnFocusOut);
      window.removeEventListener("pagehide", saveOnPageHide);
      window.removeEventListener("beforeunload", warnBeforeUnload);
      eventBus?.off("pagesinit", setPageWidth);
      viewer?.cleanup();
      pdfDocumentRef.current = null;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (isDirtyRef.current && !isSavingRef.current) {
        void saveChanges();
      }
      retrySaveRef.current = () => {};
      void loadingTask?.destroy();
    };
  }, [characterId]);

  return (
    <section
      className={`character-pdf-editor${fullPage ? " character-pdf-editor-full-page" : ""}`}
    >
      <div className="character-pdf-editor-status">
        <p aria-live="polite" className={status.error ? "error" : "muted"}>
          {status.error ?? (isSaving ? "Saving…" : status.message)}
        </p>
        {status.error ? (
          <button type="button" onClick={() => retrySaveRef.current()}>
            Retry save
          </button>
        ) : null}
        <button
          disabled={!isReady || isPreparingPrint}
          type="button"
          onClick={() => void printCharacterSheet()}
        >
          {isPreparingPrint ? "Preparing print…" : "Print character sheet"}
        </button>
        <a download href="/pathfinder-character-sheet.pdf">
          Download blank PDF
        </a>
      </div>
      {printError ? (
        <p className="error" role="alert">
          {printError}
        </p>
      ) : null}
      {loadError ? (
        <p className="error" role="alert">
          Unable to load the Pathfinder sheet: {loadError}
        </p>
      ) : null}
      <div className="character-pdf-editor-frame">
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
