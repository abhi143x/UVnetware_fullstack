import { useRef, useCallback } from "react";

const RESIZE_HANDLE_RADIUS = 6; // When you're within 6px of the handle, start resizing

export function useResizeHandle(storeActions) {
  const resizeSessionRef = useRef(null);

  const startResizeSession = useCallback(
    (seatId, startX, startY, seatWidth, seatHeight) => {
      resizeSessionRef.current = {
        seatId,
        startX,
        startY,
        startWidth: seatWidth,
        startHeight: seatHeight,
      };
    },
    []
  );

  const handleResizeMove = useCallback(
    (worldPoint) => {
      if (!resizeSessionRef.current) return;

      const { startX, startY, startWidth, startHeight } = resizeSessionRef.current;

      // Calculate new dimensions based on drag distance
      const deltaX = worldPoint.x - startX;
      const deltaY = worldPoint.y - startY;

      const newWidth = Math.max(10, startWidth + deltaX * 2);
      const newHeight = Math.max(10, startHeight + deltaY * 2);

      storeActions.resizeSeatsPreview([
        {
          id: resizeSessionRef.current.seatId,
          width: newWidth,
          height: newHeight,
        },
      ]);
    },
    [storeActions]
  );

  const endResizeSession = useCallback(
    (worldPoint) => {
      if (!resizeSessionRef.current) {
        return null;
      }

      const { startX, startY, startWidth, startHeight } = resizeSessionRef.current;
      const deltaX = worldPoint.x - startX;
      const deltaY = worldPoint.y - startY;

      const newWidth = Math.max(10, startWidth + deltaX * 2);
      const newHeight = Math.max(10, startHeight + deltaY * 2);

      const seatId = resizeSessionRef.current.seatId;
      resizeSessionRef.current = null;

      storeActions.resizeSeats([
        {
          id: seatId,
          width: newWidth,
          height: newHeight,
        },
      ]);

      return null;
    },
    [storeActions]
  );

  return {
    startResizeSession,
    handleResizeMove,
    endResizeSession,
    isResizing: !!resizeSessionRef.current,
  };
}
