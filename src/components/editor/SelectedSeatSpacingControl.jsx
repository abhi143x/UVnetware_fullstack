import React from 'react'
import { useEditorStore } from './store/editorStore'

function SelectedSeatSpacingControl() {
  const selectedSeatIds = useEditorStore((state) => state.selectedSeatIds)
  const seats = useEditorStore((state) => state.seats)
  const updateSelectedSeatsSpacing = useEditorStore((state) => state.updateSelectedSeatsSpacing)
  
  const [tempSpacing, setTempSpacing] = React.useState(48)
  const [currentSpacing, setCurrentSpacing] = React.useState(48)
  const [isPreviewing, setIsPreviewing] = React.useState(false)
  const [originalSeatState, setOriginalSeatState] = React.useState(null)

  // Store original seat state when selection happens
  React.useEffect(() => {
    if (selectedSeatIds.length < 2) {
      setCurrentSpacing(48)
      setTempSpacing(48)
      setOriginalSeatState(null)
      setIsPreviewing(false)
      return
    }

    // Store original state of ALL seats when selection happens (not just selected ones)
    if (!originalSeatState) {
      const positions = {}
      seats.forEach(seat => {
        positions[seat.id] = seat.x // Store ALL seats for proper cancel
      })
      setOriginalSeatState(positions)
      console.log('Stored original state for ALL seats:', positions)
    }

    const selectedSeats = seats.filter(seat => selectedSeatIds.includes(seat.id))
    
    // Sort seats by x position
    selectedSeats.sort((a, b) => a.x - b.x)
    
    // Calculate average spacing between consecutive seats
    let totalSpacing = 0
    let spacingCount = 0
    
    for (let i = 0; i < selectedSeats.length - 1; i++) {
      const spacing = selectedSeats[i + 1].x - selectedSeats[i].x
      if (spacing > 0) {
        totalSpacing += spacing
        spacingCount++
      }
    }
    
    const avgSpacing = spacingCount > 0 ? Math.round(totalSpacing / spacingCount) : 48
    setCurrentSpacing(avgSpacing)
    setTempSpacing(avgSpacing)
  }, [selectedSeatIds, seats, originalSeatState])

  if (selectedSeatIds.length < 2) return null

  const handleSpacingChange = (newSpacing) => {
    console.log('Spacing changed to:', newSpacing)
    setTempSpacing(newSpacing)
    setIsPreviewing(true)
    
    // Apply preview changes with collision detection and forward movement
    const selectedSeats = seats.filter(seat => selectedSeatIds.includes(seat.id))
    selectedSeats.sort((a, b) => a.x - b.x)
    
    const leftmostX = selectedSeats[0].x
    const rightmostX = selectedSeats[selectedSeats.length - 1].x
    const currentRightmostPosition = rightmostX
    const newRightmostPosition = leftmostX + ((selectedSeats.length - 1) * newSpacing)
    
    // No boundary limits - allow full spacing expansion
    const adjustedSpacing = newSpacing
    
    console.log('Applying spacing:', adjustedSpacing, 'for', selectedSeats.length, 'seats')
    
    // Recalculate with adjusted spacing
    const finalRightmostPosition = leftmostX + ((selectedSeats.length - 1) * adjustedSpacing)
    
    // Calculate how much the rightmost seat moved
    const positionShift = finalRightmostPosition - currentRightmostPosition
    
    // Find all seats that come after the rightmost selected seat
    const seatsToMove = seats.filter(seat => 
      !selectedSeatIds.includes(seat.id) && seat.x > currentRightmostPosition
    )
    
    const updatedSeats = seats.map((seat) => {
      // Handle selected seats
      if (selectedSeatIds.includes(seat.id)) {
        const seatIndex = selectedSeats.findIndex((s) => s.id === seat.id)
        let targetX = leftmostX + (seatIndex * adjustedSpacing)
        
        // Check for overlaps with non-selected seats (only those before the selected area)
        const seatRadius = 15 // Approximate seat radius
        const nonSelectedSeats = seats.filter(s => 
          !selectedSeatIds.includes(s.id) && s.x <= currentRightmostPosition
        )
        
        for (const otherSeat of nonSelectedSeats) {
          const distance = Math.abs(targetX - otherSeat.x)
          const yDistance = Math.abs(seat.y - otherSeat.y)
          
          // If seats would overlap (both x and y are too close)
          if (distance < (seatRadius * 2) && yDistance < (seatRadius * 2)) {
            // Move the seat to the right of the overlapping seat
            if (targetX < otherSeat.x) {
              targetX = otherSeat.x + (seatRadius * 2) + 5 // Add 5px buffer
            } else {
              targetX = otherSeat.x - (seatRadius * 2) - 5 // Move to left
            }
          }
        }
        
        console.log(`Moving seat ${seat.id} from ${seat.x} to ${targetX}`)
        return { ...seat, x: targetX }
      }
      
      // Handle seats that come after the selected area - move them forward in preview
      if (seatsToMove.find(s => s.id === seat.id)) {
        const newX = seat.x + positionShift
        console.log(`Moving subsequent seat ${seat.id} from ${seat.x} to ${newX}`)
        return { ...seat, x: newX }
      }
      
      // Other seats remain unchanged
      return seat
    })
    
    console.log('Updated seats:', updatedSeats)
    // Direct update without history tracking for preview
    useEditorStore.setState({ seats: updatedSeats })
  }

  const handleApply = () => {
    console.log('Apply clicked, final spacing:', tempSpacing)
    updateSelectedSeatsSpacing(tempSpacing)
    setCurrentSpacing(tempSpacing)
    setIsPreviewing(false)
    setOriginalSeatState(null)
  }

  const handleIncrease = () => {
    const newSpacing = Math.min(200, tempSpacing + 5)
    handleSpacingChange(newSpacing)
  }

  const handleDecrease = () => {
    const newSpacing = Math.max(20, tempSpacing - 5)
    handleSpacingChange(newSpacing)
  }

  const handleCancel = () => {
    console.log('Cancel clicked, restoring ALL seats to original state:', originalSeatState)
    if (originalSeatState) {
      // Restore ALL seats to their original positions
      const restoredSeats = seats.map((seat) => {
        if (originalSeatState[seat.id] !== undefined) {
          return { ...seat, x: originalSeatState[seat.id] }
        }
        return seat
      })
      
      // Direct update without history tracking
      useEditorStore.setState({ seats: restoredSeats })
      setIsPreviewing(false)
      setTempSpacing(currentSpacing)
      console.log('Restored ALL seats to original positions')
    }
  }

  return (
    <div className="bg-[#11161c] border border-white/10 rounded-lg p-3 mb-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Seat Spacing</h3>
        <div className="text-xs text-[#7a8a9e]">Selected: {selectedSeatIds.length} seats</div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleDecrease}
            className="w-8 h-8 bg-[#0e1319] border border-white/10 rounded text-white hover:bg-[#161c26] transition-colors flex items-center justify-center"
            disabled={tempSpacing <= 20}
          >
            -
          </button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="20"
                max="200"
                step="5"
                value={tempSpacing}
                onChange={(e) => handleSpacingChange(parseInt(e.target.value))}
                className="flex-1 accent-[#587cb3]"
              />
              <div className="flex items-center gap-1 bg-[#0e1319] border border-white/10 rounded px-2 py-1 min-w-[70px]">
                <input
                  type="number"
                  min="20"
                  max="200"
                  value={tempSpacing}
                  onChange={(e) => handleSpacingChange(parseInt(e.target.value) || 48)}
                  className="w-full bg-transparent text-white text-center text-sm outline-none"
                />
                <span className="text-[#7a8a9e] text-xs">px</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleIncrease}
            className="w-8 h-8 bg-[#0e1319] border border-white/10 rounded text-white hover:bg-[#161c26] transition-colors flex items-center justify-center"
            disabled={tempSpacing >= 200}
          >
            +
          </button>
        </div>
        
        <div className="flex justify-between text-xs text-[#5a6a7e]">
          <span>Current: {currentSpacing}px</span>
          <span className={isPreviewing ? "text-[#587cb3] font-medium" : ""}>
            {isPreviewing ? "Preview: " : "New: "}{tempSpacing}px
          </span>
        </div>
        
        <div className="flex gap-2">
          {isPreviewing && (
            <button
              onClick={handleCancel}
              className="flex-1 px-3 py-2 bg-[#0e1319] border border-white/10 text-[#7a8a9e] rounded hover:bg-[#161c26] hover:text-white transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleApply}
            className="flex-1 px-3 py-2 bg-[#587cb3] text-white rounded hover:bg-[#6b8cc4] transition-colors text-sm font-medium"
          >
            {isPreviewing ? "Apply Changes" : "Apply Spacing"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SelectedSeatSpacingControl
