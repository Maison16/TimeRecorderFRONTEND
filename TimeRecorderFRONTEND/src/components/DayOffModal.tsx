import React from "react";
import Modal from "react-modal";

interface Props {
  isOpen: boolean;
  reason: string;
  setReason: (val: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const DayOffModal: React.FC<Props> = ({ isOpen, reason, setReason, onSubmit, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Day Off Reason"
      ariaHideApp={false}
      style={{
        overlay: { backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1000 },
        content: {
          top: "50%", left: "50%", right: "auto", bottom: "auto",
          marginRight: "-50%", transform: "translate(-50%, -50%)",
          padding: "2rem", borderRadius: "8px", border: "1px solid #ccc",
          boxShadow: "0 5px 15px rgba(0,0,0,0.3)", maxWidth: "fit-content",
          width: "90%", display: "flex", flexDirection: "column",
          alignItems: "center", gap: "1rem",
        },
      }}
    >
      <h2 style={{ whiteSpace: "nowrap", textAlign: "center" }}>
        Reason for day off (optional):
      </h2>

      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Enter reason"
        style={{ width: "100%", maxWidth: "300px", textAlign: "center" }}
      />

      <div style={{ display: "flex", gap: "1rem" }}>
        <button onClick={onSubmit}>Submit</button>
        <button onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
};

export default DayOffModal;