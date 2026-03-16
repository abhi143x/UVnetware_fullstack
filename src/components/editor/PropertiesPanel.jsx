import { useEditorStore } from "./store/editorStore";
import { TOOL_SELECT } from "./constants/tools";
import { useRef, useState } from "react";
import { SHAPE_TYPES, normalizeShapeSize } from "./services/shapeService";

// ── tiny primitives ──────────────────────────────────────────────────────────

function SectionHeader({ children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#587cb3]">
        {children}
      </span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

function Field({ label, children, row = false }) {
  return (
    <div
      className={`flex ${row ? "items-center justify-between" : "flex-col gap-1.5"}`}
    >
      <label className="text-[10px] text-[#6b7a94] font-medium tracking-wide shrink-0 w-16">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-white/8 bg-[#0c1017] px-2.5 py-1.5 text-[12px] text-white/90
        placeholder:text-white/20 outline-none transition-all
        focus:border-[#587cb3]/60 focus:bg-[#0f1520]
        disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
    />
  );
}

function Select({ children, className = "", ...props }) {
  return (
    <select
      {...props}
      className={`w-full rounded-md border border-white/8 bg-[#0c1017] px-2.5 py-1.5 text-[12px] text-white/90
        outline-none transition-all focus:border-[#587cb3]/60 focus:bg-[#0f1520]
        appearance-none cursor-pointer ${className}`}
    >
      {children}
    </select>
  );
}

function StatusBadge({ value }) {
  const map = {
    available: { dot: "#4ade80", label: "Available" },
    reserved: { dot: "#facc15", label: "Reserved" },
    sold: { dot: "#f87171", label: "Sold" },
    locked: { dot: "#94a3b8", label: "Locked" },
  };
  const s = map[value] || map.available;
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: s.dot }}
      />
      <span className="text-[11px] text-white/60">{s.label}</span>
    </div>
  );
}

function rgbaToHex(rgba, fallback = "#5fa7ff") {
  const match =
    typeof rgba === "string"
      ? rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
      : null;

  if (!match) return fallback;

  const [r, g, b] = match
    .slice(1, 4)
    .map((value) => Math.max(0, Math.min(255, parseInt(value, 10))));

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// ── main component ───────────────────────────────────────────────────────────

function PropertiesPanel() {
  const selectedSeatIds = useEditorStore((s) => s.selectedSeatIds);
  const selectedTextIds = useEditorStore((s) => s.selectedTextIds);
  const selectedShapeIds = useEditorStore((s) => s.selectedShapeIds);
  const seats = useEditorStore((s) => s.seats);
  const texts = useEditorStore((s) => s.texts);
  const shapes = useEditorStore((s) => s.shapes);
  const categories = useEditorStore((s) => s.categories);
  const updateSeat = useEditorStore((s) => s.updateSeat);
  const updateSeats = useEditorStore((s) => s.updateSeats);
  const updateText = useEditorStore((s) => s.updateText);
  const updateTextPreview = useEditorStore((s) => s.updateTextPreview);
  const updateShape = useEditorStore((s) => s.updateShape);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const addCategory = useEditorStore((s) => s.addCategory);
  const updateCategory = useEditorStore((s) => s.updateCategory);
  const removeCategory = useEditorStore((s) => s.removeCategory);
  const pushHistoryCheckpoint = useEditorStore((s) => s.pushHistoryCheckpoint);

  const selectedSeatId =
    selectedSeatIds.length === 1 ? selectedSeatIds[0] : null;
  const selectedSeat = selectedSeatId
    ? seats.find((s) => s.id === selectedSeatId)
    : null;
  const selectedTextId =
    selectedTextIds.length === 1 ? selectedTextIds[0] : null;
  const selectedText = selectedTextId
    ? texts.find((t) => t.id === selectedTextId)
    : null;
  const selectedShapeId =
    selectedShapeIds.length === 1 ? selectedShapeIds[0] : null;
  const selectedShape = selectedShapeId
    ? shapes.find((shape) => shape.id === selectedShapeId)
    : null;

  const isMultipleSeats = selectedSeatIds.length > 1;
  const hasSeatsSelected = selectedSeatIds.length > 0;
  const selectedSeats = hasSeatsSelected
    ? seats.filter((s) => selectedSeatIds.includes(s.id))
    : [];

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#5fa7ff");
  const [newCategoryPrice, setNewCategoryPrice] = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const rotateGestureActiveRef = useRef(false);
  const rotateCheckpointCapturedRef = useRef(false);

  const handleApply = () => {
    clearSelection();
    setActiveTool(TOOL_SELECT);
  };

  const handleSeatUpdate = (field, value) => {
    if (isMultipleSeats) updateSeats(selectedSeatIds, { [field]: value });
    else if (selectedSeat) updateSeat(selectedSeat.id, { [field]: value });
  };

  const getCommonSeatValue = (field) => {
    if (!isMultipleSeats || selectedSeats.length === 0) return null;
    const first = selectedSeats[0]?.[field];
    return selectedSeats.every((s) => s?.[field] === first) ? first : null;
  };

  if (!hasSeatsSelected && !selectedText && !selectedShape) return null;

  const handleShapeDimensionChange = (field, rawValue) => {
    if (!selectedShape) return;
    const parsed = parseFloat(rawValue);
    if (!Number.isFinite(parsed)) return;

    if (selectedShape.type === SHAPE_TYPES.POLYGON) {
      return;
    }

    const nextWidth = field === "width" ? parsed : selectedShape.width || 80;
    const nextHeight = field === "height" ? parsed : selectedShape.height || 80;
    const normalized = normalizeShapeSize(
      selectedShape.type,
      nextWidth,
      nextHeight,
    );
    updateShape(selectedShape.id, normalized);
  };

  const MIXED = "__mixed__";
  const commonCategory = isMultipleSeats
    ? getCommonSeatValue("category")
    : (selectedSeat?.category ?? null);
  const commonStatus = isMultipleSeats
    ? getCommonSeatValue("status")
    : (selectedSeat?.status ?? "available");
  const commonPrice = isMultipleSeats
    ? getCommonSeatValue("price")
    : (selectedSeat?.price ?? null);

  const categoryValueForSelect = isMultipleSeats
    ? commonCategory === null
      ? MIXED
      : commonCategory || ""
    : commonCategory || "";

  const statusValueForSelect = isMultipleSeats
    ? commonStatus === null
      ? MIXED
      : commonStatus || "available"
    : commonStatus || "available";

  const selectedCategoryForInfo =
    categories.find((c) => c.id === commonCategory) || null;

  const applyCategoryPrice = () => {
    const p = selectedCategoryForInfo?.price;
    if (p === null || p === undefined || Number.isNaN(p)) return;
    handleSeatUpdate("price", p);
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const parsed =
      newCategoryPrice === "" ? null : parseFloat(newCategoryPrice);
    addCategory({
      name,
      color: newCategoryColor,
      price: Number.isNaN(parsed) ? null : parsed,
    });
    setNewCategoryName("");
    setNewCategoryColor("#5fa7ff");
    setNewCategoryPrice("");
  };

  const beginRotateGesture = () => {
    rotateGestureActiveRef.current = true;
  };

  const endRotateGesture = () => {
    rotateGestureActiveRef.current = false;
    rotateCheckpointCapturedRef.current = false;
  };

  const handleRotateSliderChange = (value) => {
    if (!selectedText) return;

    if (
      rotateGestureActiveRef.current &&
      !rotateCheckpointCapturedRef.current
    ) {
      pushHistoryCheckpoint?.();
      rotateCheckpointCapturedRef.current = true;
    }

    const nextRotate = parseFloat(value);
    if (!Number.isFinite(nextRotate)) return;

    if (rotateGestureActiveRef.current) {
      updateTextPreview(selectedText.id, { rotate: nextRotate });
      return;
    }

    updateText(selectedText.id, { rotate: nextRotate });
  };

  return (
    <aside
      className="w-70 shrink-0 flex flex-col text-sm h-full overflow-y-auto"
      style={{
        background: "linear-gradient(180deg, #0f1622 0%, #0b1119 100%)",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "inset 1px 0 0 rgba(255,255,255,0.04)",
        fontFamily: "'DM Mono', 'Fira Mono', monospace",
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#587cb3]">
          {hasSeatsSelected
            ? isMultipleSeats
              ? `${selectedSeatIds.length} Seats`
              : "Seat"
            : selectedShape
              ? "Shape"
              : "Text"}
        </span>
        {selectedSeat && (
          <StatusBadge value={selectedSeat.status || "available"} />
        )}
      </div>

      <div className="flex flex-col gap-5 p-4 flex-1">
        {/* ── SHAPE SECTION ── */}
        {selectedShape && (
          <>
            <div className="flex flex-col gap-3">
              <SectionHeader>Shape</SectionHeader>

              <Field label="Type">
                <div className="rounded-md border border-white/8 bg-[#0c1017] px-2.5 py-1.5 text-[12px] text-white/85">
                  {selectedShape.type === SHAPE_TYPES.POLYGON
                    ? "Polygonal Area"
                    : selectedShape.type === SHAPE_TYPES.CIRCLE
                      ? "Elipse"
                      : "Rectangle"}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Width">
                  <Input
                    type="number"
                    min="20"
                    value={Math.round(selectedShape.width || 80)}
                    onChange={(e) =>
                      handleShapeDimensionChange("width", e.target.value)
                    }
                    disabled={selectedShape.type === SHAPE_TYPES.POLYGON}
                  />
                </Field>
                <Field label="Height">
                  <Input
                    type="number"
                    min="20"
                    value={Math.round(selectedShape.height || 80)}
                    onChange={(e) =>
                      handleShapeDimensionChange("height", e.target.value)
                    }
                    disabled={selectedShape.type === SHAPE_TYPES.POLYGON}
                  />
                </Field>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <SectionHeader>Style</SectionHeader>

              <Field label="Fill" row>
                <div
                  className="relative flex items-center gap-2 rounded-md px-2.5 py-1.5"
                  style={{
                    background: "#0c1017",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    className="h-4 w-4 rounded-sm shrink-0"
                    style={{
                      background: selectedShape.fill,
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                  />
                  <span className="text-[11px] text-white/60 tabular-nums">
                    {selectedShape.fill}
                  </span>
                  <input
                    type="color"
                    value={rgbaToHex(selectedShape.fill)}
                    onChange={(e) => {
                      const hex = e.target.value;
                      updateShape(selectedShape.id, {
                        fill: `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(
                          hex.slice(3, 5),
                          16,
                        )}, ${parseInt(hex.slice(5, 7), 16)}, 0.22)`,
                      });
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </Field>

              <Field label="Border" row>
                <div
                  className="relative flex items-center gap-2 rounded-md px-2.5 py-1.5"
                  style={{
                    background: "#0c1017",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    className="h-4 w-4 rounded-sm shrink-0"
                    style={{
                      background: selectedShape.stroke,
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                  />
                  <span className="text-[11px] text-white/60 tabular-nums">
                    {selectedShape.stroke}
                  </span>
                  <input
                    type="color"
                    value={selectedShape.stroke || "#2f5f8f"}
                    onChange={(e) =>
                      updateShape(selectedShape.id, { stroke: e.target.value })
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </Field>

              <Field label="Stroke">
                <Input
                  type="number"
                  min="0"
                  max="12"
                  value={selectedShape.strokeWidth || 2}
                  onChange={(e) => {
                    const strokeWidth = Math.max(
                      0,
                      Math.min(12, parseFloat(e.target.value) || 0),
                    );
                    updateShape(selectedShape.id, { strokeWidth });
                  }}
                />
              </Field>
            </div>
          </>
        )}

        {/* ── SEAT SECTION ── */}
        {hasSeatsSelected && (
          <>
            {/* Single-seat identity fields */}
            {selectedSeat && !isMultipleSeats && (
              <div className="flex flex-col gap-3">
                <SectionHeader>Identity</SectionHeader>

                <Field label="ID">
                  <Input value={selectedSeat.id} disabled />
                </Field>

                <Field label="Label">
                  <Input
                    value={selectedSeat.label || ""}
                    onChange={(e) => handleSeatUpdate("label", e.target.value)}
                    placeholder={
                      selectedSeat.row && selectedSeat.number
                        ? `${selectedSeat.row}${selectedSeat.number}`
                        : "Auto"
                    }
                  />
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="Row">
                    <Input
                      value={selectedSeat.row || ""}
                      onChange={(e) =>
                        handleSeatUpdate("row", e.target.value.toUpperCase())
                      }
                      placeholder="A"
                    />
                  </Field>
                  <Field label="No.">
                    <Input
                      type="number"
                      value={selectedSeat.number || ""}
                      onChange={(e) =>
                        handleSeatUpdate(
                          "number",
                          e.target.value ? parseInt(e.target.value) : null,
                        )
                      }
                      placeholder="1"
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* Properties (bulk-capable) */}
            <div className="flex flex-col gap-3">
              <SectionHeader>Properties</SectionHeader>

              {/* Category */}
              <Field label="Category">
                <div className="relative">
                  <Select
                    value={categoryValueForSelect}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v !== MIXED) handleSeatUpdate("category", v || null);
                    }}
                  >
                    {isMultipleSeats && (
                      <option value={MIXED}>— Mixed —</option>
                    )}
                    <option value="">None</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </Select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/30">
                    ▾
                  </span>
                </div>
              </Field>

              {/* Category info chip */}
              {selectedCategoryForInfo && (
                <div
                  className="flex items-center justify-between rounded-md px-3 py-2"
                  style={{
                    background: "rgba(88,124,179,0.08)",
                    border: "1px solid rgba(88,124,179,0.2)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{
                        background: selectedCategoryForInfo.color,
                        boxShadow: `0 0 6px ${selectedCategoryForInfo.color}60`,
                      }}
                    />
                    <span className="text-[11px] text-white/70">
                      {selectedCategoryForInfo.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40">
                      {selectedCategoryForInfo.price != null
                        ? `$${selectedCategoryForInfo.price}`
                        : "—"}
                    </span>
                    <button
                      type="button"
                      onClick={applyCategoryPrice}
                      disabled={selectedCategoryForInfo.price == null}
                      className="rounded px-2 py-0.5 text-[10px] text-[#587cb3] transition-all
                        hover:bg-[#587cb3]/15 disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ border: "1px solid rgba(88,124,179,0.3)" }}
                    >
                      Use
                    </button>
                  </div>
                </div>
              )}

              {/* Status */}
              <Field label="Status">
                <div className="relative">
                  <Select
                    value={statusValueForSelect}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v !== MIXED) handleSeatUpdate("status", v);
                    }}
                  >
                    {isMultipleSeats && (
                      <option value={MIXED}>— Mixed —</option>
                    )}
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                    <option value="locked">Locked</option>
                  </Select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/30">
                    ▾
                  </span>
                </div>
              </Field>

              {/* Price */}
              <Field label="Price">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-white/30">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    value={
                      isMultipleSeats
                        ? (commonPrice ?? "")
                        : (selectedSeat?.price ?? "")
                    }
                    onChange={(e) =>
                      handleSeatUpdate(
                        "price",
                        e.target.value ? parseFloat(e.target.value) : null,
                      )
                    }
                    placeholder={
                      isMultipleSeats && commonPrice === null ? "Mixed" : "0.00"
                    }
                    className="pl-6"
                  />
                </div>
              </Field>
            </div>

            {/* Categories Manager */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setCatOpen((v) => !v)}
                className="flex items-center justify-between w-full group"
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#587cb3]">
                    Categories
                  </span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <span
                  className={`ml-2 text-[10px] text-white/30 transition-transform ${catOpen ? "rotate-180" : ""}`}
                >
                  ▾
                </span>
              </button>

              {catOpen && (
                <div className="flex flex-col gap-2 mt-1">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="rounded-md p-2.5 flex flex-col gap-2"
                      style={{
                        background: "#0c1017",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="relative h-7 w-7 rounded shrink-0 overflow-hidden"
                          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                        >
                          <input
                            type="color"
                            value={cat.color || "#5fa7ff"}
                            onChange={(e) =>
                              updateCategory(cat.id, { color: e.target.value })
                            }
                            className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                            title="Color"
                          />
                          <span
                            className="block w-full h-full"
                            style={{ background: cat.color || "#5fa7ff" }}
                          />
                        </div>
                        <Input
                          value={cat.name || ""}
                          onChange={(e) =>
                            updateCategory(cat.id, { name: e.target.value })
                          }
                          placeholder="Category name"
                          className="flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => removeCategory(cat.id)}
                          className="shrink-0 text-[10px] text-red-400/60 hover:text-red-400 transition-colors px-1"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#6b7a94] w-10 shrink-0">
                          Price
                        </span>
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-white/30">
                            $
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            value={cat.price ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              const p = v === "" ? null : parseFloat(v);
                              updateCategory(cat.id, {
                                price: Number.isNaN(p) ? null : p,
                              });
                            }}
                            placeholder="—"
                            className="pl-6"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add new category */}
                  <div
                    className="rounded-md p-2.5 flex flex-col gap-2"
                    style={{
                      background: "#0c1017",
                      border: "1px dashed rgba(88,124,179,0.25)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="relative h-7 w-7 rounded shrink-0 overflow-hidden"
                        style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                      >
                        <input
                          type="color"
                          value={newCategoryColor}
                          onChange={(e) => setNewCategoryColor(e.target.value)}
                          className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                        />
                        <span
                          className="block w-full h-full"
                          style={{ background: newCategoryColor }}
                        />
                      </div>
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New category…"
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#6b7a94] w-10 shrink-0">
                        Price
                      </span>
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-white/30">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          value={newCategoryPrice}
                          onChange={(e) => setNewCategoryPrice(e.target.value)}
                          placeholder="—"
                          className="pl-6"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="shrink-0 rounded px-3 py-1.5 text-[11px] font-medium text-[#587cb3] transition-all
                          hover:bg-[#587cb3]/15"
                        style={{ border: "1px solid rgba(88,124,179,0.35)" }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── TEXT SECTION ── */}
        {selectedText && (
          <>
            <div className="flex flex-col gap-3">
              <SectionHeader>Content</SectionHeader>

              <Field label="Caption">
                <Input
                  value={selectedText.content}
                  onChange={(e) =>
                    updateText(selectedText.id, { content: e.target.value })
                  }
                />
              </Field>
            </div>

            <div className="flex flex-col gap-3">
              <SectionHeader>Typography</SectionHeader>

              {/* Font size stepper */}
              <Field label="Size" row>
                <div
                  className="flex items-center rounded-md overflow-hidden"
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "#0c1017",
                  }}
                >
                  <button
                    onClick={() =>
                      updateText(selectedText.id, {
                        fontSize: Math.max(
                          8,
                          (selectedText.fontSize || 20) - 1,
                        ),
                      })
                    }
                    className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors text-sm"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-[12px] text-white/80 tabular-nums">
                    {selectedText.fontSize || 20}
                  </span>
                  <button
                    onClick={() =>
                      updateText(selectedText.id, {
                        fontSize: Math.min(
                          120,
                          (selectedText.fontSize || 20) + 1,
                        ),
                      })
                    }
                    className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors text-sm"
                  >
                    +
                  </button>
                </div>
              </Field>

              {/* Color */}
              <Field label="Color" row>
                <div
                  className="relative flex items-center gap-2 rounded-md px-2.5 py-1.5"
                  style={{
                    background: "#0c1017",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    className="h-4 w-4 rounded-sm shrink-0"
                    style={{
                      background: selectedText.fill || "#c9d6ea",
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                  />
                  <span className="text-[11px] text-white/60 tabular-nums">
                    {selectedText.fill || "#c9d6ea"}
                  </span>
                  <input
                    type="color"
                    value={selectedText.fill || "#c9d6ea"}
                    onChange={(e) =>
                      updateText(selectedText.id, { fill: e.target.value })
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </Field>

              {/* Style toggles */}
              <Field label="Style" row>
                <div
                  className="flex rounded-md overflow-hidden"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <button
                    onClick={() =>
                      updateText(selectedText.id, {
                        fontWeight:
                          selectedText.fontWeight === "bold"
                            ? "normal"
                            : "bold",
                      })
                    }
                    className={`w-9 h-7 font-bold text-sm transition-all
                      ${
                        selectedText.fontWeight === "bold"
                          ? "bg-[#587cb3] text-white"
                          : "bg-[#0c1017] text-white/35 hover:text-white/60"
                      }`}
                  >
                    B
                  </button>
                  <div className="w-px bg-white/8" />
                  <button
                    onClick={() =>
                      updateText(selectedText.id, {
                        fontStyle:
                          selectedText.fontStyle === "italic"
                            ? "normal"
                            : "italic",
                      })
                    }
                    className={`w-9 h-7 italic text-sm transition-all
                      ${
                        selectedText.fontStyle === "italic"
                          ? "bg-[#587cb3] text-white"
                          : "bg-[#0c1017] text-white/35 hover:text-white/60"
                      }`}
                  >
                    I
                  </button>
                </div>
              </Field>
            </div>

            <div className="flex flex-col gap-3">
              <SectionHeader>Transform</SectionHeader>

              <Field label="Rotate">
                <div className="flex flex-col gap-1 flex-1">
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={selectedText.rotate ?? 0}
                    onPointerDown={beginRotateGesture}
                    onPointerUp={endRotateGesture}
                    onPointerCancel={endRotateGesture}
                    onFocus={beginRotateGesture}
                    onBlur={endRotateGesture}
                    onChange={(e) => handleRotateSliderChange(e.target.value)}
                    className="w-full accent-[#587cb3]"
                    style={{ marginLeft: "0.5rem" }}
                  />
                  <div
                    className="flex justify-between text-[9px] text-white/20 px-0.5"
                    style={{ marginLeft: "0.5rem" }}
                  >
                    <span>-180°</span>
                    <span className="text-white/40 tabular-nums">
                      {selectedText.rotate ?? 0}°
                    </span>
                    <span>180°</span>
                  </div>
                </div>
              </Field>
            </div>
          </>
        )}
      </div>

      {/* Apply footer */}
      <div
        className="px-4 py-3 shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <button
          onClick={handleApply}
          className="w-full rounded-md py-2 text-[12px] font-semibold tracking-wide text-white transition-all
            hover:brightness-110 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #3d5f96, #587cb3)" }}
        >
          Apply
        </button>
      </div>
    </aside>
  );
}

export default PropertiesPanel;
