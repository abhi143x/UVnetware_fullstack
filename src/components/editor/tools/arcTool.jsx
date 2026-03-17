import {
  buildArcLayoutPoints,
  DEFAULT_ARC_TOOL_SETTINGS,
} from "../services/arcService";
import { PREVIEW_SEAT_RADIUS, RADIANS_PER_DEGREE } from "../utils/mathUtils";

const MIN_ARC_DRAG_DISTANCE = PREVIEW_SEAT_RADIUS;
const MIN_ARC_COMMIT_DISTANCE = PREVIEW_SEAT_RADIUS * 0.6;
const MAX_ARC_PREVIEW_SEAT_COUNT = 80;
const ARC_PREVIEW_MOVE_EPSILON = 1;

function buildArcPreview(centerPoint, worldPoint) {
  const deltaX = worldPoint.x - centerPoint.x;
  const deltaY = worldPoint.y - centerPoint.y;
  const pointerDistance = Math.hypot(deltaX, deltaY);
  const radius = Math.max(MIN_ARC_DRAG_DISTANCE, pointerDistance);
  const rotation = Math.atan2(deltaY, deltaX);
  const arcAngle = DEFAULT_ARC_TOOL_SETTINGS.arcAngle;
  const seatSpacing = DEFAULT_ARC_TOOL_SETTINGS.seatSpacing;
  const estimatedSeatCount = Math.max(
    2,
    Math.min(
      MAX_ARC_PREVIEW_SEAT_COUNT,
      Math.round((arcAngle * RADIANS_PER_DEGREE * radius) / seatSpacing) + 1,
    ),
  );
  const arcConfig = {
    seatCount: estimatedSeatCount,
    arcAngle,
    seatSpacing,
    radius,
    rotation,
  };

  return {
    arcConfig,
    previewPoints: buildArcLayoutPoints({
      centerPoint,
      ...arcConfig,
    }),
  };
}

export class ArcTool {
  constructor(storeActions) {
    this.commitArc = storeActions.commitArc;
  }

  handleMouseDown(_event, worldPoint) {
    return {
      type: "arc_start",
      centerPoint: worldPoint,
      endPoint: worldPoint,
      previewPoints: [],
      arcConfig: null,
    };
  }

  handleMouseMove(_event, worldPoint, _context, session) {
    if (!session) return session ?? null;
    if (session.type !== "arc_start" && session.type !== "arc_preview") {
      return session;
    }

    const deltaX = worldPoint.x - session.endPoint.x;
    const deltaY = worldPoint.y - session.endPoint.y;
    if (Math.hypot(deltaX, deltaY) < ARC_PREVIEW_MOVE_EPSILON) {
      return session;
    }

    const preview = buildArcPreview(session.centerPoint, worldPoint);

    return {
      type: "arc_preview",
      centerPoint: session.centerPoint,
      endPoint: worldPoint,
      previewPoints: preview.previewPoints,
      arcConfig: preview.arcConfig,
    };
  }

  handleMouseUp(_event, _worldPoint, _context, session) {
    if (
      session?.type === "arc_preview" &&
      session.arcConfig &&
      Math.hypot(
        session.endPoint.x - session.centerPoint.x,
        session.endPoint.y - session.centerPoint.y,
      ) >= MIN_ARC_COMMIT_DISTANCE
    ) {
      this.commitArc?.(session.arcConfig, session.centerPoint);
    }
    return null;
  }

  handleClick() {
    // Arc tool uses drag interactions only.
  }
}
