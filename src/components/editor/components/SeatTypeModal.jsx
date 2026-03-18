import React from "react";
import { SEAT_TYPES, SEAT_TYPE_CONFIG } from "../constants/seatTypes";
import { SeatTypeSelector } from "./SeatTypeSelector";

export function SeatTypeModal({ isOpen, onClose, onConfirm, title = "Select Seat Type" }) {
  const [selectedType, setSelectedType] = React.useState(SEAT_TYPES.CHAIR);

  const handleConfirm = () => {
    onConfirm(selectedType);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#0f1622] border border-white/10 rounded-xl shadow-2xl p-6 w-[320px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm">{title}</h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6">
          <SeatTypeSelector
            selectedType={selectedType}
            onSelectType={setSelectedType}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm bg-[#587cb3] hover:bg-[#4a6a9a] text-white rounded-md transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
