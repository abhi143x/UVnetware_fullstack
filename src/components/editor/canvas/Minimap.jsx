import React, { useRef, useCallback, useState, useEffect } from 'react'

const MINIMAP_WIDTH = 180
const MINIMAP_HEIGHT = 120
const MINIMAP_PADDING = 16

/**
 * Professional minimap in the bottom-right corner of the canvas.
 * Shows blue dots for all seats and a viewport rectangle.
 * Click or drag to pan the main canvas.
 */
function MinimapInner({ seats, camera, viewport, setCamera }) {
    const minimapRef = useRef(null)
    const [isDragging, setIsDragging] = useState(false)

    // Calculate world bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const s of seats) {
        if (s.x < minX) minX = s.x
        if (s.x > maxX) maxX = s.x
        if (s.y < minY) minY = s.y
        if (s.y > maxY) maxY = s.y
    }

    const pad = 60
    minX -= pad; minY -= pad
    maxX += pad; maxY += pad

    const worldW = maxX - minX || 1
    const worldH = maxY - minY || 1
    const mapScale = Math.min(MINIMAP_WIDTH / worldW, MINIMAP_HEIGHT / worldH) * 0.85

    const offsetX = (MINIMAP_WIDTH - worldW * mapScale) / 2
    const offsetY = (MINIMAP_HEIGHT - worldH * mapScale) / 2

    // Stable refs for drag handler
    const stableRef = useRef({ offsetX, offsetY, mapScale, minX, minY })
    stableRef.current = { offsetX, offsetY, mapScale, minX, minY }

    const panToMinimapPoint = useCallback((clientX, clientY) => {
        const rect = minimapRef.current?.getBoundingClientRect()
        if (!rect) return
        const { offsetX: ox, offsetY: oy, mapScale: ms, minX: mx, minY: my } = stableRef.current
        const wx = (clientX - rect.left - ox) / ms + mx
        const wy = (clientY - rect.top - oy) / ms + my
        setCamera(prev => ({
            ...prev,
            position: {
                x: viewport.width / 2 - wx * prev.scale,
                y: viewport.height / 2 - wy * prev.scale,
            },
        }))
    }, [viewport.width, viewport.height, setCamera])

    const handleMouseDown = useCallback((e) => {
        e.stopPropagation()
        e.preventDefault()
        setIsDragging(true)
        panToMinimapPoint(e.clientX, e.clientY)
    }, [panToMinimapPoint])

    useEffect(() => {
        if (!isDragging) return
        const handleMove = (e) => panToMinimapPoint(e.clientX, e.clientY)
        const handleUp = () => setIsDragging(false)
        window.addEventListener('mousemove', handleMove)
        window.addEventListener('mouseup', handleUp)
        return () => {
            window.removeEventListener('mousemove', handleMove)
            window.removeEventListener('mouseup', handleUp)
        }
    }, [isDragging, panToMinimapPoint])

    // Viewport rectangle in minimap coords
    const topLeftWx = -camera.position.x / camera.scale
    const topLeftWy = -camera.position.y / camera.scale
    const botRightWx = (viewport.width - camera.position.x) / camera.scale
    const botRightWy = (viewport.height - camera.position.y) / camera.scale

    const vpX = (topLeftWx - minX) * mapScale + offsetX
    const vpY = (topLeftWy - minY) * mapScale + offsetY
    const vpW = (botRightWx - topLeftWx) * mapScale
    const vpH = (botRightWy - topLeftWy) * mapScale

    // Seat dots
    const dots = seats.map((seat) => {
        const sx = (seat.x - minX) * mapScale + offsetX
        const sy = (seat.y - minY) * mapScale + offsetY
        return (
            <circle key={seat.id} cx={sx} cy={sy} r={1.8} fill="#5fa7ff" opacity={0.8} />
        )
    })

    return (
        <div
            ref={minimapRef}
            style={{
                position: 'absolute',
                right: MINIMAP_PADDING,
                bottom: MINIMAP_PADDING,
                width: MINIMAP_WIDTH,
                height: MINIMAP_HEIGHT,
                background: 'rgba(11, 15, 21, 0.85)',
                border: '1px solid rgba(88,124,179,0.35)',
                borderRadius: 8,
                overflow: 'hidden',
                cursor: 'crosshair',
                zIndex: 20,
                backdropFilter: 'blur(6px)',
            }}
            onMouseDown={handleMouseDown}
        >
            <svg width={MINIMAP_WIDTH} height={MINIMAP_HEIGHT}>
                {dots}
                <rect
                    x={Math.max(0, vpX)}
                    y={Math.max(0, vpY)}
                    width={Math.min(MINIMAP_WIDTH, Math.max(8, vpW))}
                    height={Math.min(MINIMAP_HEIGHT, Math.max(6, vpH))}
                    fill="rgba(88,124,179,0.12)"
                    stroke="#587cb3"
                    strokeWidth={1.5}
                    rx={2}
                />
            </svg>
        </div>
    )
}

// Error-safe wrapper — if Minimap crashes, render nothing rather than breaking the canvas
export default function Minimap(props) {
    if (!props.seats || props.seats.length === 0) return null
    try {
        return <MinimapInner {...props} />
    } catch {
        return null
    }
}
