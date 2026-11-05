"use client";

import { useRef, useState } from "react";
import CharacterPdfEditor from "./[characterId]/character-pdf-editor";
import type { CharacterPdfFormData } from "@/lib/character-pdf";

export default function CharacterPdfDialog({
  characterId,
  characterName,
  initialFormData,
}: {
  characterId: string;
  characterName: string;
  initialFormData: CharacterPdfFormData;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [hasOpened, setHasOpened] = useState(false);

  function openDialog() {
    setHasOpened(true);
    dialogRef.current?.showModal();
  }

  return (
    <>
      <p>
        <button
          className="button-link"
          type="button"
          onClick={openDialog}
        >
          Open editable PDF sheet
        </button>
      </p>
      <dialog
        aria-label={`${characterName} Pathfinder character sheet`}
        className="character-pdf-dialog"
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            dialogRef.current.close();
          }
        }}
      >
        <div className="character-pdf-dialog-header">
          <div>
            <p className="eyebrow">Pathfinder 1e character sheet</p>
            <h3>{characterName}</h3>
          </div>
          <button
            aria-label="Close character sheet"
            autoFocus
            className="character-pdf-dialog-close"
            type="button"
            onClick={() => dialogRef.current?.close()}
          >
            Close
          </button>
        </div>
        <p className="muted character-pdf-dialog-help">
          <a href={`/player/characters/${characterId}`} rel="noreferrer" target="_blank">
            Open full-page editor
          </a>
          <span> · Your edits save automatically.</span>
        </p>
        {hasOpened ? (
          <CharacterPdfEditor
            characterId={characterId}
            initialFormData={initialFormData}
          />
        ) : null}
      </dialog>
    </>
  );
}
