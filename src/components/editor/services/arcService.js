import { generateSeatLabel } from "../utils/seatNumbering";
import { createSeatGroupMetadata } from "./seatService";
import { ELEMENT_TYPES } from "../domain/elementTypes";
import { RADIANS_PER_DEGREE } from "../utils/mathUtils";

export const DEFAULT_ARC_TOOL_SETTINGS = Object.freeze({
    seatCount: 8,
    arcAngle: 120,
    seatSpacing: 36,
    radius: "",
});

export const DEFAULT_ARC_ROTATION = -Math.PI / 2;
const MIN_ARC_SEAT_COUNT = 1;
const MIN_ARC_ANGLE = 15;
const MAX_ARC_ANGLE = 330;
const MIN_ARC_SPACING = 20;
const MIN_ARC_RADIUS = 24;

function normalizePositiveNumber(value, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return parsed;
}

export function normalizeArcSeatCount(value) {
    return Math.max(
        MIN_ARC_SEAT_COUNT,
        Math.round(normalizePositiveNumber(value, DEFAULT_ARC_TOOL_SETTINGS.seatCount)),
    );
}

export function normalizeArcAngle(value) {
    const parsed = normalizePositiveNumber(value, DEFAULT_ARC_TOOL_SETTINGS.arcAngle);
    return Math.max(MIN_ARC_ANGLE, Math.min(MAX_ARC_ANGLE, parsed));
}

export function normalizeArcSpacing(value) {
    return Math.max(
        MIN_ARC_SPACING,
        normalizePositiveNumber(value, DEFAULT_ARC_TOOL_SETTINGS.seatSpacing),
    );
}

export function calculateArcRadius(seatCount, arcAngle, seatSpacing, providedRadius) {
    const explicitRadius = Number(providedRadius);
    if (Number.isFinite(explicitRadius) && explicitRadius > 0) {
        return Math.max(MIN_ARC_RADIUS, explicitRadius);
    }

    const normalizedSeatCount = normalizeArcSeatCount(seatCount);
    const normalizedAngle = normalizeArcAngle(arcAngle);
    const normalizedSpacing = normalizeArcSpacing(seatSpacing);

    if (normalizedSeatCount <= 1) {
        return Math.max(MIN_ARC_RADIUS, normalizedSpacing);
    }

    const sweepRadians = normalizedAngle * RADIANS_PER_DEGREE;
    const arcLength = (normalizedSeatCount - 1) * normalizedSpacing;
    return Math.max(
        MIN_ARC_RADIUS,
        arcLength / Math.max(sweepRadians, Number.EPSILON),
    );
}

export function resolveArcLayoutConfig(config = {}) {
    const seatCount = normalizeArcSeatCount(config.seatCount);
    const arcAngle = normalizeArcAngle(config.arcAngle);
    const seatSpacing = normalizeArcSpacing(config.seatSpacing);
    const radius = calculateArcRadius(
        seatCount,
        arcAngle,
        seatSpacing,
        config.radius,
    );

    return {
        seatCount,
        arcAngle,
        seatSpacing,
        radius,
        rotation:
            Number.isFinite(config.rotation) ? config.rotation : DEFAULT_ARC_ROTATION,
    };
}

export function hasArcLayoutMetadata(seat) {
    return Boolean(
        seat?.groupType === ELEMENT_TYPES.ARC &&
            seat?.groupId &&
            Number.isFinite(seat?.arcCenterX) &&
            Number.isFinite(seat?.arcCenterY) &&
            Number.isFinite(seat?.arcRadius) &&
            Number.isFinite(seat?.arcAngle),
    );
}

export function buildArcLayoutPoints({ centerPoint, ...config }) {
    if (!centerPoint) return [];

    const resolved = resolveArcLayoutConfig(config);
    const sweepRadians = resolved.arcAngle * RADIANS_PER_DEGREE;
    const startAngle = resolved.rotation - sweepRadians / 2;
    const stepAngle =
        resolved.seatCount <= 1 ? 0 : sweepRadians / (resolved.seatCount - 1);

    return Array.from({ length: resolved.seatCount }, (_, index) => {
        const angle = startAngle + stepAngle * index;
        return {
            x: centerPoint.x + resolved.radius * Math.cos(angle),
            y: centerPoint.y + resolved.radius * Math.sin(angle),
            angle,
            seatIndex: index,
        };
    });
}

export function buildArcSeatPlacements({
    centerPoint,
    rowLetter,
    arcId,
    ...config
}) {
    const resolved = resolveArcLayoutConfig(config);
    const groupOptions = createSeatGroupMetadata(ELEMENT_TYPES.ARC, arcId);

    return buildArcLayoutPoints({
        centerPoint,
        ...resolved,
    }).map((point, index) => ({
        x: point.x,
        y: point.y,
        options: {
            row: rowLetter,
            number: index + 1,
            label: generateSeatLabel(rowLetter, index + 1),
            ...groupOptions,
            arcCenterX: centerPoint.x,
            arcCenterY: centerPoint.y,
            arcRadius: resolved.radius,
            arcAngle: resolved.arcAngle,
            arcRotation: resolved.rotation,
            arcSeatCount: resolved.seatCount,
            arcSeatIndex: index,
            arcSeatSpacing: resolved.seatSpacing,
        },
    }));
}

export function generateArcSeats(arcPoints, rowLetter, arcId) {
    const groupOptions = createSeatGroupMetadata(ELEMENT_TYPES.ARC, arcId);

    return arcPoints.map((point, index) => ({
        ...point,
        options: {
            row: rowLetter,
            number: index + 1,
            label: generateSeatLabel(rowLetter, index + 1),
            ...groupOptions,
        },
    }));
}
