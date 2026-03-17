import { useEffect, useMemo, useRef, useState } from "react";
import { TOOL_SELECT } from "./constants/tools";
import { ELEMENT_TYPES } from "./domain/elementTypes";
import {
  ARC_ANGLE_STEP,
  ARC_RADIUS_STEP,
  ARC_SEAT_COUNT_STEP,
  ARC_SPACING_STEP,
  hasArcLayoutMetadata,
  normalizeArcAngle,
  normalizeArcRadius,
  normalizeArcSeatCount,
  normalizeArcSpacing,
} from "./services/arcService";
import { useEditorStore } from "./store/editorStore";

const PANEL_WIDTH = 224;
const PANEL_HEIGHT = 230;
const PANEL_MARGIN = 16;
const PANEL_OFFSET_X = 56;
const HOLD_START_DELAY_MS = 250;
const HOLD_INITIAL_INTERVAL_MS = 120;
const HOLD_MEDIUM_INTERVAL_MS = 60;
const HOLD_FAST_INTERVAL_MS = 30;
const HOLD_MEDIUM_THRESHOLD = 4;
const HOLD_FAST_THRESHOLD = 10;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function buildEditorPosition(anchorX, anchorY, viewport) {
  return {
    left: clamp(
      anchorX + PANEL_OFFSET_X,
      PANEL_MARGIN,
      Math.max(PANEL_MARGIN, viewport.width - PANEL_WIDTH - PANEL_MARGIN),
    ),
    top: clamp(
      anchorY - PANEL_HEIGHT / 2,
      PANEL_MARGIN,
      Math.max(PANEL_MARGIN, viewport.height - PANEL_HEIGHT - PANEL_MARGIN),
    ),
  };
}

function resolveRepeatInterval(repeatCount) {
  if (repeatCount >= HOLD_FAST_THRESHOLD) {
    return HOLD_FAST_INTERVAL_MS;
  }
  if (repeatCount >= HOLD_MEDIUM_THRESHOLD) {
    return HOLD_MEDIUM_INTERVAL_MS;
  }
  return HOLD_INITIAL_INTERVAL_MS;
}

function Field({ label, children }) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-14 shrink-0 text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
        {label}
      </label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function StepButton({ label, disabled, onPressStart, onPressEnd }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="flex h-5 w-5 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[10px] text-white/70 transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white/5"
      style={{ touchAction: "none" }}
      onPointerDown={(event) => {
        if (disabled) return;
        event.preventDefault();
        event.stopPropagation();
        onPressStart();
      }}
      onPointerUp={onPressEnd}
      onPointerLeave={onPressEnd}
      onPointerCancel={onPressEnd}
      onBlur={onPressEnd}
    >
      {label}
    </button>
  );
}

function StepperControl({
  value,
  onIncreaseStart,
  onDecreaseStart,
  onPressEnd,
  disabled = false,
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1 rounded-md border border-white/10 bg-[#09111a] px-2 py-1.5 text-[12px] text-white/90 tabular-nums">
        {value}
      </div>
      <div className="flex flex-col gap-1">
        <StepButton
          label="+"
          disabled={disabled}
          onPressStart={onIncreaseStart}
          onPressEnd={onPressEnd}
        />
        <StepButton
          label="-"
          disabled={disabled}
          onPressStart={onDecreaseStart}
          onPressEnd={onPressEnd}
        />
      </div>
    </div>
  );
}

function stopCanvasEvent(event) {
  event.stopPropagation();
}

function ArcFloatingEditor({ camera, viewport }) {
  const activeTool = useEditorStore((state) => state.activeTool);
  const seats = useEditorStore((state) => state.seats);
  const selectedSeatIds = useEditorStore((state) => state.selectedSeatIds);
  const pushHistoryCheckpoint = useEditorStore(
    (state) => state.pushHistoryCheckpoint,
  );
  const updateArcGroupPreview = useEditorStore(
    (state) => state.updateArcGroupPreview,
  );

  const editorRef = useRef(null);
  const syncedSelectionArcIdRef = useRef(null);
  const activeArcRef = useRef(null);
  const holdDelayTimerRef = useRef(null);
  const holdIntervalTimerRef = useRef(null);
  const holdRepeatCountRef = useRef(0);
  const holdIntervalMsRef = useRef(HOLD_INITIAL_INTERVAL_MS);
  const holdFieldRef = useRef(null);
  const holdDeltaRef = useRef(0);
  const holdHistoryCapturedRef = useRef(false);
  const releaseListenersRef = useRef(null);
  const [selectedArcId, setSelectedArcId] = useState(null);

  const selectedArcCandidate = useMemo(() => {
    if (activeTool !== TOOL_SELECT || selectedSeatIds.length === 0) {
      return null;
    }

    const selectedSeatIdSet = new Set(selectedSeatIds);
    const selectedSeats = seats.filter((seat) => selectedSeatIdSet.has(seat.id));
    if (!selectedSeats.length) return null;

    const firstSeat = selectedSeats[0];
    if (
      firstSeat.groupType !== ELEMENT_TYPES.ARC ||
      !firstSeat.groupId ||
      !selectedSeats.every(
        (seat) =>
          seat.groupType === ELEMENT_TYPES.ARC &&
          seat.groupId === firstSeat.groupId,
      )
    ) {
      return null;
    }

    const arcSeats = seats
      .filter(
        (seat) =>
          seat.groupType === ELEMENT_TYPES.ARC &&
          seat.groupId === firstSeat.groupId,
      )
      .sort(
        (leftSeat, rightSeat) =>
          (leftSeat.arcSeatIndex ?? leftSeat.number ?? 0) -
          (rightSeat.arcSeatIndex ?? rightSeat.number ?? 0),
      );

    if (
      !arcSeats.length ||
      !arcSeats.every((seat) => hasArcLayoutMetadata(seat))
    ) {
      return null;
    }

    const referenceSeat = arcSeats[0];
    return {
      groupId: referenceSeat.groupId,
      seatIdSet: new Set(arcSeats.map((seat) => seat.id)),
    };
  }, [activeTool, seats, selectedSeatIds]);

  const stopPressAndHold = () => {
    if (holdDelayTimerRef.current !== null) {
      window.clearTimeout(holdDelayTimerRef.current);
      holdDelayTimerRef.current = null;
    }
    if (holdIntervalTimerRef.current !== null) {
      window.clearInterval(holdIntervalTimerRef.current);
      holdIntervalTimerRef.current = null;
    }

    if (releaseListenersRef.current) {
      const { handlePointerUp, handlePointerCancel, handleWindowBlur } =
        releaseListenersRef.current;
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("blur", handleWindowBlur);
      releaseListenersRef.current = null;
    }

    holdRepeatCountRef.current = 0;
    holdIntervalMsRef.current = HOLD_INITIAL_INTERVAL_MS;
    holdFieldRef.current = null;
    holdDeltaRef.current = 0;
    holdHistoryCapturedRef.current = false;
  };

  useEffect(() => {
    return () => {
      stopPressAndHold();
    };
  }, []);

  useEffect(() => {
    const candidateArcId =
      activeTool === TOOL_SELECT ? selectedArcCandidate?.groupId ?? null : null;

    if (candidateArcId !== syncedSelectionArcIdRef.current) {
      syncedSelectionArcIdRef.current = candidateArcId;
      queueMicrotask(() => {
        setSelectedArcId(candidateArcId);
      });
      return;
    }

    if (!candidateArcId) {
      queueMicrotask(() => {
        setSelectedArcId(null);
      });
    }
  }, [activeTool, selectedArcCandidate]);

  useEffect(() => {
    if (activeTool !== TOOL_SELECT || !selectedArcCandidate) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      if (editorRef.current?.contains(target)) {
        setSelectedArcId(selectedArcCandidate.groupId);
        return;
      }

      const seatElement = target.closest("[data-seat-id]");
      const clickedSeatId = seatElement?.getAttribute("data-seat-id");
      if (clickedSeatId && selectedArcCandidate.seatIdSet.has(clickedSeatId)) {
        setSelectedArcId(selectedArcCandidate.groupId);
        return;
      }

      setSelectedArcId(null);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [activeTool, selectedArcCandidate]);

  const activeArc = useMemo(() => {
    if (!selectedArcId) return null;

    const arcSeats = seats
      .filter(
        (seat) =>
          seat.groupType === ELEMENT_TYPES.ARC && seat.groupId === selectedArcId,
      )
      .sort(
        (leftSeat, rightSeat) =>
          (leftSeat.arcSeatIndex ?? leftSeat.number ?? 0) -
          (rightSeat.arcSeatIndex ?? rightSeat.number ?? 0),
      );

    if (
      !arcSeats.length ||
      !arcSeats.every((seat) => hasArcLayoutMetadata(seat))
    ) {
      return null;
    }

    const referenceSeat = arcSeats[0];
    return {
      groupId: referenceSeat.groupId,
      seatCount: referenceSeat.arcSeatCount ?? arcSeats.length,
      arcAngle: referenceSeat.arcAngle,
      arcRadius: referenceSeat.arcRadius,
      arcSeatSpacing: referenceSeat.arcSeatSpacing,
      anchorX: camera.position.x + referenceSeat.arcCenterX * camera.scale,
      anchorY: camera.position.y + referenceSeat.arcCenterY * camera.scale,
    };
  }, [camera.position.x, camera.position.y, camera.scale, seats, selectedArcId]);
  useEffect(() => {
    activeArcRef.current = activeArc;
  }, [activeArc]);

  const isArcEditorVisible = Boolean(selectedArcId && activeArc);
  const editorPosition = useMemo(() => {
    if (!isArcEditorVisible || !activeArc) return null;
    return buildEditorPosition(activeArc.anchorX, activeArc.anchorY, viewport);
  }, [activeArc, isArcEditorVisible, viewport]);

  useEffect(() => {
    if (!isArcEditorVisible) {
      stopPressAndHold();
    }
  }, [isArcEditorVisible]);

  const resolveCurrentFieldValue = (arc, field) => {
    if (!arc) return null;

    if (field === "arcSeatCount") return arc.seatCount;
    if (field === "arcAngle") return Math.round(arc.arcAngle);
    if (field === "arcSeatSpacing") return Math.round(arc.arcSeatSpacing);
    if (field === "arcRadius") return Math.round(arc.arcRadius);
    return null;
  };

  const applyArcStep = (field, delta) => {
    const currentArc = activeArcRef.current;
    if (!currentArc) return false;

    const currentValue = resolveCurrentFieldValue(currentArc, field);
    if (!Number.isFinite(currentValue)) return false;

    let nextValue = null;

    if (field === "arcSeatCount") {
      nextValue = normalizeArcSeatCount(currentValue + delta);
    } else if (field === "arcAngle") {
      nextValue = normalizeArcAngle(currentValue + delta);
    } else if (field === "arcSeatSpacing") {
      nextValue = normalizeArcSpacing(currentValue + delta);
    } else if (field === "arcRadius") {
      nextValue = normalizeArcRadius(currentValue + delta);
    } else {
      return false;
    }

    if (nextValue === currentValue) {
      return false;
    }

    if (!holdHistoryCapturedRef.current) {
      pushHistoryCheckpoint?.();
      holdHistoryCapturedRef.current = true;
    }

    updateArcGroupPreview(currentArc.groupId, { [field]: nextValue });
    return true;
  };

  const startRepeatInterval = (intervalMs) => {
    holdIntervalMsRef.current = intervalMs;
    holdIntervalTimerRef.current = window.setInterval(() => {
      const field = holdFieldRef.current;
      const delta = holdDeltaRef.current;
      if (!field || delta === 0) {
        stopPressAndHold();
        return;
      }

      const changed = applyArcStep(field, delta);
      if (!changed) {
        stopPressAndHold();
        return;
      }

      holdRepeatCountRef.current += 1;
      const nextInterval = resolveRepeatInterval(holdRepeatCountRef.current);

      if (nextInterval !== holdIntervalMsRef.current) {
        if (holdIntervalTimerRef.current !== null) {
          window.clearInterval(holdIntervalTimerRef.current);
          holdIntervalTimerRef.current = null;
        }
        startRepeatInterval(nextInterval);
      }
    }, intervalMs);
  };

  const beginPressAndHold = (field, delta) => {
    stopPressAndHold();

    const changed = applyArcStep(field, delta);
    if (!changed) {
      return;
    }

    holdFieldRef.current = field;
    holdDeltaRef.current = delta;
    holdRepeatCountRef.current = 0;
    holdIntervalMsRef.current = HOLD_INITIAL_INTERVAL_MS;

    const handlePointerUp = () => {
      stopPressAndHold();
    };
    const handlePointerCancel = () => {
      stopPressAndHold();
    };
    const handleWindowBlur = () => {
      stopPressAndHold();
    };

    releaseListenersRef.current = {
      handlePointerUp,
      handlePointerCancel,
      handleWindowBlur,
    };

    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    window.addEventListener("blur", handleWindowBlur);

    holdDelayTimerRef.current = window.setTimeout(() => {
      startRepeatInterval(HOLD_INITIAL_INTERVAL_MS);
    }, HOLD_START_DELAY_MS);
  };

  if (!isArcEditorVisible || !activeArc || !editorPosition) {
    return null;
  }

  return (
    <div
      ref={editorRef}
      data-arc-editor="true"
      className="absolute z-30 w-[224px] rounded-xl border border-white/10 bg-[#0a121b]/94 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.38)] backdrop-blur-md"
      style={{
        left: editorPosition.left,
        top: editorPosition.top,
      }}
      onPointerDown={stopCanvasEvent}
      onMouseDown={stopCanvasEvent}
      onMouseUp={stopCanvasEvent}
      onClick={stopCanvasEvent}
      onDoubleClick={stopCanvasEvent}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6dd8c7]">
            Arc
          </div>
          <div className="mt-0.5 text-[11px] text-white/40">
            Inline controls
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/55">
          Hold to accelerate
        </div>
      </div>

      <div className="space-y-2.5">
        <Field label="Seats">
          <StepperControl
            value={`${activeArc.seatCount}`}
            onIncreaseStart={() =>
              beginPressAndHold("arcSeatCount", ARC_SEAT_COUNT_STEP)
            }
            onDecreaseStart={() =>
              beginPressAndHold("arcSeatCount", -ARC_SEAT_COUNT_STEP)
            }
            onPressEnd={stopPressAndHold}
          />
        </Field>

        <Field label="Angle">
          <StepperControl
            value={`${Math.round(activeArc.arcAngle)} deg`}
            onIncreaseStart={() =>
              beginPressAndHold("arcAngle", ARC_ANGLE_STEP)
            }
            onDecreaseStart={() =>
              beginPressAndHold("arcAngle", -ARC_ANGLE_STEP)
            }
            onPressEnd={stopPressAndHold}
          />
        </Field>

        <Field label="Space">
          <StepperControl
            value={`${Math.round(activeArc.arcSeatSpacing)} px`}
            onIncreaseStart={() =>
              beginPressAndHold("arcSeatSpacing", ARC_SPACING_STEP)
            }
            onDecreaseStart={() =>
              beginPressAndHold("arcSeatSpacing", -ARC_SPACING_STEP)
            }
            onPressEnd={stopPressAndHold}
          />
        </Field>

        <Field label="Radius">
          <StepperControl
            value={`${Math.round(activeArc.arcRadius)} px`}
            onIncreaseStart={() =>
              beginPressAndHold("arcRadius", ARC_RADIUS_STEP)
            }
            onDecreaseStart={() =>
              beginPressAndHold("arcRadius", -ARC_RADIUS_STEP)
            }
            onPressEnd={stopPressAndHold}
          />
        </Field>
      </div>
    </div>
  );
}

export default ArcFloatingEditor;
