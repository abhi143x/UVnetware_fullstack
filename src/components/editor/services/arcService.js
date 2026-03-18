import { generateSeatLabel } from "../utils/seatNumbering";
import {
    createSeatGroupMetadata,
    DEFAULT_SEAT_RADIUS,
} from "./seatService";
import { ELEMENT_TYPES } from "../domain/elementTypes";
import { RADIANS_PER_DEGREE } from "../utils/mathUtils";

export const DEFAULT_ARC_TOOL_SETTINGS = Object.freeze({
    seatCount: 8,
    arcAngle: 120,
    seatSpacing: 36,
    radius: "",
});

export const DEFAULT_ARC_ROTATION = -Math.PI / 2;
export const ARC_SEAT_COUNT_STEP = 1;
export const ARC_ANGLE_STEP = 1;
export const ARC_RADIUS_STEP = 1;
export const ARC_SPACING_STEP = 1;

const DEFAULT_ARC_RADIUS = 120;
const MIN_ARC_SEAT_COUNT = 1;
const MAX_ARC_SEAT_COUNT = 80;
const MIN_ARC_ANGLE = 1;
const MAX_ARC_ANGLE = 360;
const MIN_ARC_SPACING = 0;
const MAX_ARC_SPACING = 240;
const MIN_ARC_RADIUS = 10;
const MAX_ARC_RADIUS = 1200;

function normalizePositiveNumber(value, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return parsed;
}

export function normalizeArcSeatCount(value) {
    return Math.min(
        MAX_ARC_SEAT_COUNT,
        Math.max(
            MIN_ARC_SEAT_COUNT,
            Math.round(
                normalizePositiveNumber(value, DEFAULT_ARC_TOOL_SETTINGS.seatCount),
            ),
        ),
    );
}

export function normalizeArcAngle(value) {
    const parsed = normalizePositiveNumber(value, DEFAULT_ARC_TOOL_SETTINGS.arcAngle);
    return Math.max(MIN_ARC_ANGLE, Math.min(MAX_ARC_ANGLE, parsed));
}

export function normalizeArcSpacing(value) {
    return Math.min(
        MAX_ARC_SPACING,
        Math.max(
            MIN_ARC_SPACING,
            normalizePositiveNumber(value, DEFAULT_ARC_TOOL_SETTINGS.seatSpacing),
        ),
    );
}

export function normalizeArcRadius(value) {
    const parsed = normalizePositiveNumber(value, DEFAULT_ARC_RADIUS);
    return Math.max(MIN_ARC_RADIUS, Math.min(MAX_ARC_RADIUS, parsed));
}

export function calculateArcStepRadians(seatCount, arcAngle) {
    const normalizedSeatCount = normalizeArcSeatCount(seatCount);
    if (normalizedSeatCount <= 1) return 0;

    const normalizedAngle = normalizeArcAngle(arcAngle);
    return (normalizedAngle * RADIANS_PER_DEGREE) / (normalizedSeatCount - 1);
}

export function calculateArcSeatSpacing(seatCount, arcAngle, radius) {
    const normalizedSeatCount = normalizeArcSeatCount(seatCount);
    if (normalizedSeatCount <= 1) return 0;

    const stepRadians = calculateArcStepRadians(seatCount, arcAngle);
    const normalizedRadius = normalizeArcRadius(radius);

    return 2 * normalizedRadius * Math.sin(Math.max(stepRadians / 2, Number.EPSILON));
}

export function calculateArcAngleFromSpacing(seatCount, radius, seatSpacing) {
    const normalizedSeatCount = normalizeArcSeatCount(seatCount);
    if (normalizedSeatCount <= 1) {
        return normalizeArcAngle(DEFAULT_ARC_TOOL_SETTINGS.arcAngle);
    }

    const normalizedRadius = normalizeArcRadius(radius);
    const normalizedSpacing = normalizeArcSpacing(seatSpacing);
    const maximumSupportedSpacing = Math.max(
        DEFAULT_SEAT_RADIUS * 2,
        normalizedRadius * 2 - 1,
    );
    const clampedSpacing = Math.min(normalizedSpacing, maximumSupportedSpacing);
    const stepRadians =
        2 * Math.asin(Math.min(1, clampedSpacing / (2 * normalizedRadius)));

    return normalizeArcAngle(
        (stepRadians * (normalizedSeatCount - 1)) / RADIANS_PER_DEGREE,
    );
}

export function resolveArcLayoutConfig(config = {}) {
    const seatCount = normalizeArcSeatCount(config.seatCount);
    const arcAngle = normalizeArcAngle(config.arcAngle);
    const radius = normalizeArcRadius(config.radius);

    return {
        seatCount,
        arcAngle,
        seatSpacing: calculateArcSeatSpacing(seatCount, arcAngle, radius),
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
    const startAngle =
        resolved.seatCount <= 1
            ? resolved.rotation
            : resolved.rotation - sweepRadians / 2;
    const stepAngle = calculateArcStepRadians(
        resolved.seatCount,
        resolved.arcAngle,
    );

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
    seatType,
    ...config
}) {
    const resolved = resolveArcLayoutConfig(config);
    const groupOptions = createSeatGroupMetadata(ELEMENT_TYPES.ARC, arcId);
    
    // Use fixed 80px spacing for consistency with row spacing
    const fixedSpacing = 150; // Much more spacing for very visible gap

    return buildArcLayoutPoints({
        centerPoint,
        ...resolved,
    }).map((point, index) => ({
        x: point.x,
        y: point.y,
        seatType: seatType || 'chair',
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
            arcSeatSpacing: fixedSpacing, // Use fixed 80px spacing
        },
    }));
}
