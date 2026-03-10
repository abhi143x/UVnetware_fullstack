import { useEditorStore } from "./store/editorStore";
import { TOOL_SELECT } from "./constants/tools";
import { useState } from "react";

function PropertiesPanel() {
  const selectedSeatIds = useEditorStore((state) => state.selectedSeatIds);
  const selectedTextIds = useEditorStore((state) => state.selectedTextIds);
  const seats = useEditorStore((state) => state.seats);
  const texts = useEditorStore((state) => state.texts);
  const categories = useEditorStore((state) => state.categories);
  const updateSeat = useEditorStore((state) => state.updateSeat);
  const updateSeats = useEditorStore((state) => state.updateSeats);
  const updateText = useEditorStore((state) => state.updateText);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const setActiveTool = useEditorStore((state) => state.setActiveTool);
  const addCategory = useEditorStore((state) => state.addCategory);
  const updateCategory = useEditorStore((state) => state.updateCategory);
  const removeCategory = useEditorStore((state) => state.removeCategory);

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

  const isMultipleSeats = selectedSeatIds.length > 1;
  const isMultipleTexts = selectedTextIds.length > 1;
  const hasSeatsSelected = selectedSeatIds.length > 0;

  const selectedSeats = hasSeatsSelected
    ? seats.filter((s) => selectedSeatIds.includes(s.id))
    : [];

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#5fa7ff");
  const [newCategoryPrice, setNewCategoryPrice] = useState("");

  // Function to handle the Apply button click
  const handleApply = () => {
    clearSelection();
    setActiveTool(TOOL_SELECT);
  };

  // Handle seat property updates
  const handleSeatUpdate = (field, value) => {
    if (isMultipleSeats) {
      updateSeats(selectedSeatIds, { [field]: value });
    } else if (selectedSeat) {
      updateSeat(selectedSeat.id, { [field]: value });
    }
  };

  // Get common values for multiple selection
  const getCommonSeatValue = (field) => {
    if (!isMultipleSeats || selectedSeatIds.length === 0) return null;
    if (selectedSeats.length === 0) return null;
    const firstValue = selectedSeats[0]?.[field];
    const allSame = selectedSeats.every((s) => s?.[field] === firstValue);
    return allSame ? firstValue : null;
  };

  if (!hasSeatsSelected && !selectedText) return null;

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

  const applyCategoryPriceToSelection = () => {
    const price = selectedCategoryForInfo?.price;
    if (price === null || price === undefined || Number.isNaN(price)) return;
    handleSeatUpdate("price", price);
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const parsedPrice =
      newCategoryPrice === "" ? null : parseFloat(newCategoryPrice);
    addCategory({
      name,
      color: newCategoryColor,
      price: Number.isNaN(parsedPrice) ? null : parsedPrice,
    });
    setNewCategoryName("");
    setNewCategoryColor("#5fa7ff");
    setNewCategoryPrice("");
  };

  return (
    <aside className="w-[300px] shrink-0 bg-[#11161c] flex flex-col text-sm text-[#c9d6ea] h-full overflow-y-auto">
      <div className="p-5 flex flex-col gap-8">
        {hasSeatsSelected && (
          <>
            {/* SEAT Section */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold tracking-wide text-white">
                {isMultipleSeats ? `Seat (${selectedSeatIds.length})` : "Seat"}
              </h3>

              {/* Single-seat-only fields */}
              {selectedSeat && !isMultipleSeats && (
                <>
                  {/* Seat ID */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] text-gray-400">ID</label>
                    <input
                      type="text"
                      value={selectedSeat.id}
                      disabled
                      className="rounded border border-white/10 bg-[#0e1319] px-3 py-1.5 text-white/60 outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* Label */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] text-gray-400">Label</label>
                    <input
                      type="text"
                      value={
                        isMultipleSeats
                          ? getCommonSeatValue("label") || ""
                          : selectedSeat.label || ""
                      }
                      onChange={(e) =>
                        handleSeatUpdate("label", e.target.value)
                      }
                      placeholder={
                        selectedSeat.row && selectedSeat.number
                          ? `${selectedSeat.row}${selectedSeat.number}`
                          : "Auto"
                      }
                      className="rounded border border-white/10 bg-[#0e1319] px-3 py-1.5 text-white outline-none focus:border-[#587cb3]"
                    />
                  </div>

                  {/* Row & Number */}
                  <div className="flex gap-2">
                    <div className="flex flex-col gap-2 flex-1">
                      <label className="text-[11px] text-gray-400">Row</label>
                      <input
                        type="text"
                        value={
                          isMultipleSeats
                            ? getCommonSeatValue("row") || ""
                            : selectedSeat.row || ""
                        }
                        onChange={(e) =>
                          handleSeatUpdate("row", e.target.value.toUpperCase())
                        }
                        placeholder="A"
                        className="rounded border border-white/10 bg-[#0e1319] px-3 py-1.5 text-white outline-none focus:border-[#587cb3]"
                      />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <label className="text-[11px] text-gray-400">
                        Number
                      </label>
                      <input
                        type="number"
                        value={
                          isMultipleSeats
                            ? getCommonSeatValue("number") || ""
                            : selectedSeat.number || ""
                        }
                        onChange={(e) =>
                          handleSeatUpdate(
                            "number",
                            e.target.value ? parseInt(e.target.value) : null,
                          )
                        }
                        placeholder="1"
                        className="rounded border border-white/10 bg-[#0e1319] px-3 py-1.5 text-white outline-none focus:border-[#587cb3]"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] text-gray-400">
                      Category
                    </label>
                    <select
                      value={
                        isMultipleSeats
                          ? getCommonSeatValue("category") || ""
                          : selectedSeat.category || ""
                      }
                      onChange={(e) =>
                        handleSeatUpdate("category", e.target.value || null)
                      }
                      className="rounded border border-white/10 bg-[#0e1319] px-3 py-1.5 text-white outline-none focus:border-[#587cb3]"
                    >
                      <option value="">None</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] text-gray-400">Status</label>
                    <select
                      value={
                        isMultipleSeats
                          ? getCommonSeatValue("status") || "available"
                          : selectedSeat.status || "available"
                      }
                      onChange={(e) =>
                        handleSeatUpdate("status", e.target.value)
                      }
                      className="rounded border border-white/10 bg-[#0e1319] px-3 py-1.5 text-white outline-none focus:border-[#587cb3]"
                    >
                      <option value="available">Available</option>
                      <option value="reserved">Reserved</option>
                      <option value="sold">Sold</option>
                      <option value="locked">Locked</option>
                    </select>
                  </div>

                  {/* Price */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] text-gray-400">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={
                        isMultipleSeats
                          ? getCommonSeatValue("price") || ""
                          : selectedSeat.price || ""
                      }
                      onChange={(e) =>
                        handleSeatUpdate(
                          "price",
                          e.target.value ? parseFloat(e.target.value) : null,
                        )
                      }
                      placeholder="0.00"
                      className="rounded border border-white/10 bg-[#0e1319] px-3 py-1.5 text-white outline-none focus:border-[#587cb3]"
                    />
                  </div>
                </>
              )}

              {/* Category (bulk-capable) */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] text-gray-400">Category</label>
                <select
                  value={categoryValueForSelect}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === MIXED) return;
                    handleSeatUpdate("category", v || null);
                  }}
                  className="rounded border border-white/10 bg-[#0e1319] px-3 py-1.5 text-white outline-none focus:border-[#587cb3]"
                >
                  {isMultipleSeats && <option value={MIXED}>— Mixed —</option>}
                  <option value="">None</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {selectedCategoryForInfo && (
                  <div className="flex items-center justify-between rounded border border-white/10 bg-[#0e1319] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-sm border border-white/10"
                        style={{ background: selectedCategoryForInfo.color }}
                      />
                      <span className="text-[11px] text-gray-300">
                        {selectedCategoryForInfo.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">
                        Price: {selectedCategoryForInfo.price ?? "—"}
                      </span>
                      <button
                        type="button"
                        onClick={applyCategoryPriceToSelection}
                        disabled={
                          selectedCategoryForInfo.price === null ||
                          selectedCategoryForInfo.price === undefined
                        }
                        className="rounded bg-white/5 px-2 py-1 text-[11px] text-white/90 hover:bg-white/10 disabled:opacity-40"
                        title="Set seat price = category price"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status (bulk-capable) */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] text-gray-400">Status</label>
                <select
                  value={statusValueForSelect}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === MIXED) return;
                    handleSeatUpdate("status", v);
                  }}
                  className="rounded border border-white/10 bg-[#0e1319] px-3 py-1.5 text-white outline-none focus:border-[#587cb3]"
                >
                  {isMultipleSeats && <option value={MIXED}>— Mixed —</option>}
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Sold</option>
                  <option value="locked">Locked</option>
                </select>
              </div>

              {/* Price (bulk-capable) */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] text-gray-400">Seat price</label>
                <input
                  type="number"
                  step="0.01"
                  value={
                    isMultipleSeats
                      ? commonPrice === null
                        ? ""
                        : commonPrice
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
                  className="rounded border border-white/10 bg-[#0e1319] px-3 py-1.5 text-white outline-none focus:border-[#587cb3]"
                />
              </div>
            </div>

            {/* Categories Manager */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold tracking-wide text-white">
                Categories
              </h3>

              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded border border-white/10 bg-[#0e1319] p-3"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cat.color || "#5fa7ff"}
                      onChange={(e) =>
                        updateCategory(cat.id, { color: e.target.value })
                      }
                      className="h-8 w-10 cursor-pointer border-0 bg-transparent p-0"
                      title="Color"
                    />
                    <input
                      type="text"
                      value={cat.name || ""}
                      onChange={(e) =>
                        updateCategory(cat.id, { name: e.target.value })
                      }
                      className="min-w-0 flex-1 rounded border border-white/10 bg-[#0e1319] px-3 py-1.5 text-white outline-none focus:border-[#587cb3]"
                      placeholder="Category name"
                    />
                    <button
                      type="button"
                      onClick={() => removeCategory(cat.id)}
                      className="rounded border border-red-500/30 px-2 py-1 text-[11px] text-red-300 hover:bg-red-500/10"
                      title="Delete category"
                    >
                      Del
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-[11px] text-gray-400 w-14">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={cat.price ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        const parsed = v === "" ? null : parseFloat(v);
                        updateCategory(cat.id, {
                          price: Number.isNaN(parsed) ? null : parsed,
                        });
                      }}
                      className="flex-1 rounded border border-white/10 bg-[#0e1319] px-3 py-1.5 text-white outline-none focus:border-[#587cb3]"
                      placeholder="—"
                    />
                  </div>
                </div>
              ))}

              <div className="rounded border border-white/10 bg-[#0e1319] p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="h-8 w-10 cursor-pointer border-0 bg-transparent p-0"
                    title="Color"
                  />
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="min-w-0 flex-1 rounded border border-white/10 bg-[#0e1319] px-3 py-1.5 text-white outline-none focus:border-[#587cb3]"
                    placeholder="New category name"
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <label className="text-[11px] text-gray-400 w-14">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newCategoryPrice}
                    onChange={(e) => setNewCategoryPrice(e.target.value)}
                    className="flex-1 rounded border border-white/10 bg-[#0e1319] px-3 py-1.5 text-white outline-none focus:border-[#587cb3]"
                    placeholder="—"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="rounded bg-white/5 px-3 py-1.5 text-[11px] text-white hover:bg-white/10"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-white/5" />
          </>
        )}

        {selectedText && (
          <>
            {/* TEXT Section */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold tracking-wide text-white">
                Text
              </h3>

              {/* Caption */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] text-gray-400">Caption</label>
                <input
                  type="text"
                  value={selectedText.content}
                  onChange={(e) =>
                    updateText(selectedText.id, { content: e.target.value })
                  }
                  className="rounded border border-white/10 bg-[#0e1319] px-3 py-1.5 text-white outline-none focus:border-[#587cb3]"
                />
              </div>

              {/* Font Size */}
              <div className="flex items-center justify-between mt-2">
                <label className="text-[11px] text-gray-400">Font size</label>
                <div className="flex items-center gap-1 rounded border border-white/10 bg-[#0e1319] px-1 py-0.5">
                  <button
                    onClick={() =>
                      updateText(selectedText.id, {
                        fontSize: Math.max(
                          8,
                          (selectedText.fontSize || 20) - 1,
                        ),
                      })
                    }
                    className="px-2 py-1 text-gray-400 hover:text-white cursor-pointer"
                  >
                    &lt;
                  </button>
                  <span className="w-12 text-center text-xs text-white">
                    {selectedText.fontSize || 20} pt
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
                    className="px-2 py-1 text-gray-400 hover:text-white cursor-pointer"
                  >
                    &gt;
                  </button>
                </div>
              </div>

              {/* Text color */}
              <div className="flex items-center justify-between mt-2">
                <label className="text-[11px] text-gray-400">Text color</label>
                <div className="flex items-center border border-white/10 rounded bg-[#0e1319] overflow-hidden pr-2">
                  <input
                    type="color"
                    value={selectedText.fill || "#c9d6ea"}
                    onChange={(e) =>
                      updateText(selectedText.id, { fill: e.target.value })
                    }
                    className="h-8 w-12 cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <span className="text-[10px] text-gray-400 w-4">▼</span>
                </div>
              </div>

              {/* Style */}
              <div className="flex items-center justify-between mt-2">
                <label className="text-[11px] text-gray-400">Style</label>
                <div className="flex overflow-hidden rounded border border-white/10 bg-[#0e1319]">
                  <button
                    onClick={() =>
                      updateText(selectedText.id, {
                        fontWeight:
                          selectedText.fontWeight === "bold"
                            ? "normal"
                            : "bold",
                      })
                    }
                    className={`px-4 py-1.5 font-bold text-sm ${selectedText.fontWeight === "bold" ? "bg-[#587cb3] text-white" : "text-gray-400 hover:bg-white/5"}`}
                  >
                    B
                  </button>
                  <div className="w-[1px] bg-white/10" />
                  <button
                    onClick={() =>
                      updateText(selectedText.id, {
                        fontStyle:
                          selectedText.fontStyle === "italic"
                            ? "normal"
                            : "italic",
                      })
                    }
                    className={`px-4 py-1.5 italic font-serif text-sm ${selectedText.fontStyle === "italic" ? "bg-[#587cb3] text-white" : "text-gray-400 hover:bg-white/5"}`}
                  >
                    I
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-white/5" />

            {/* TRANSFORM Section */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold tracking-wide text-white">
                Transform
              </h3>

              {/* Rotate */}
              <div className="flex items-center gap-4">
                <label className="text-[11px] text-gray-400 w-16">Rotate</label>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] text-gray-500 px-1">
                    <span>-180</span>
                    <span>0</span>
                    <span>180</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={selectedText.rotate ?? 0}
                    onChange={(e) =>
                      updateText(selectedText.id, {
                        rotate: parseFloat(e.target.value),
                      })
                    }
                    className="flex-1 accent-[#587cb3]"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Apply Button */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleApply}
            className="rounded bg-[#587cb3] px-6 py-2 text-sm font-medium text-white hover:bg-[#688cc3] transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </aside>
  );
}

export default PropertiesPanel;
