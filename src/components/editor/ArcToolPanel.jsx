import { useState } from "react";
import { TOOL_SELECT } from "./constants/tools";
import { useEditorStore } from "./store/editorStore";
import {
  calculateArcRadius,
  DEFAULT_ARC_TOOL_SETTINGS,
} from "./services/arcService";

function SectionHeader({ children }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#587cb3]">
        {children}
      </span>
      <div className="h-px flex-1 bg-white/5" />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-medium tracking-wide text-[#6b7a94]">
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
        outline-none transition-all placeholder:text-white/20
        focus:border-[#587cb3]/60 focus:bg-[#0f1520] ${className}`}
    />
  );
}

function ArcToolPanel() {
  const generateArcGroup = useEditorStore((state) => state.generateArcGroup);
  const arcGeneratorCenter = useEditorStore((state) => state.arcGeneratorCenter);
  const setActiveTool = useEditorStore((state) => state.setActiveTool);
  const [arcForm, setArcForm] = useState(DEFAULT_ARC_TOOL_SETTINGS);

  const resolvedRadius = calculateArcRadius(
    arcForm.seatCount,
    arcForm.arcAngle,
    arcForm.seatSpacing,
    arcForm.radius,
  );

  const handleFieldChange = (field, value) => {
    setArcForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleGenerate = () => {
    generateArcGroup(arcForm, arcGeneratorCenter);
  };

  return (
    <aside
      className="flex h-full w-70 shrink-0 flex-col text-sm"
      style={{
        background: "linear-gradient(180deg, #0f1622 0%, #0b1119 100%)",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "inset 1px 0 0 rgba(255,255,255,0.04)",
        fontFamily: "'DM Mono', 'Fira Mono', monospace",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#587cb3]">
          Arc Tool
        </span>
        <span className="text-[10px] text-white/35">Generator</span>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-4">
        <div className="flex flex-col gap-3">
          <SectionHeader>Parameters</SectionHeader>

          <Field label="Seat Count">
            <Input
              type="number"
              min="1"
              step="1"
              value={arcForm.seatCount}
              onChange={(event) =>
                handleFieldChange("seatCount", event.target.value)
              }
            />
          </Field>

          <Field label="Arc Angle">
            <Input
              type="number"
              min="15"
              max="330"
              step="1"
              value={arcForm.arcAngle}
              onChange={(event) =>
                handleFieldChange("arcAngle", event.target.value)
              }
            />
          </Field>

          <Field label="Seat Spacing">
            <Input
              type="number"
              min="20"
              step="1"
              value={arcForm.seatSpacing}
              onChange={(event) =>
                handleFieldChange("seatSpacing", event.target.value)
              }
            />
          </Field>

          <Field label="Radius">
            <Input
              type="number"
              min="24"
              step="1"
              value={arcForm.radius}
              onChange={(event) =>
                handleFieldChange("radius", event.target.value)
              }
              placeholder="Auto"
            />
          </Field>

          <div
            className="rounded-md px-3 py-2 text-[11px] text-white/55"
            style={{
              background: "rgba(88,124,179,0.08)",
              border: "1px solid rgba(88,124,179,0.18)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <span>Resolved Radius</span>
              <span className="tabular-nums text-white/75">
                {Math.round(resolvedRadius)} px
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3 text-[10px] text-white/35">
              <span>Placement</span>
              <span className="tabular-nums">
                X {Math.round(arcGeneratorCenter.x)} / Y auto
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            className="w-full rounded-md py-2 text-[12px] font-semibold tracking-wide text-white transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #3d5f96, #587cb3)" }}
          >
            Generate Arc
          </button>
        </div>

        <div className="rounded-md border border-white/8 bg-[#0c1017] px-3 py-2 text-[11px] leading-relaxed text-white/45">
          Arcs use the visible canvas center for X placement, then stack below
          the current layout automatically without overlapping existing seats.
          Use Select to move them or edit angle and radius after selecting the
          full arc.
        </div>
      </div>

      <div
        className="px-4 py-3 shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <button
          type="button"
          onClick={() => setActiveTool(TOOL_SELECT)}
          className="w-full rounded-md border border-white/10 bg-[#111925] py-2 text-[12px] font-semibold tracking-wide text-[#c9d6ea] transition-all hover:border-white/20 hover:bg-[#161f2d]"
        >
          Back To Select
        </button>
      </div>
    </aside>
  );
}

export default ArcToolPanel;
