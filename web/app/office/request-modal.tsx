"use client";

import OfficeRequestForm from "./request-form-fields";

export default function RequestModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="office-modal-backdrop" onClick={onClose}>
      <div className="office-modal" onClick={(e) => e.stopPropagation()}>
        <h2>依頼する</h2>
        <OfficeRequestForm
          onSuccess={onClose}
          footer={
            <button type="button" className="secondary" onClick={onClose}>
              閉じる
            </button>
          }
        />
      </div>
    </div>
  );
}
