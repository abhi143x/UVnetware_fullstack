// Utility functions for seat numbering and row labeling

/**
 * Converts a numerical index to a row letter (A, B, C, ..., Z, AA, AB, ...)
 */
export function getRowLetter(index) {
  if (index < 0) return 'A'
  if (index < 26) {
    return String.fromCharCode(65 + index) // A-Z
  }
  // AA, AB, ..., AZ, BA, BB, ...
  const firstLetter = Math.floor((index - 26) / 26)
  const secondLetter = (index - 26) % 26
  return String.fromCharCode(65 + firstLetter) + String.fromCharCode(65 + secondLetter)
}

/**
 * Generates a seat label from row letter and number (e.g., "A1", "B2")
 */
export function generateSeatLabel(rowLetter, number) {
  return `${rowLetter}${number}`
}

/**
 * Detects rows from seats based on Y-coordinate grouping
 * Returns a map of row key (Y bucket) to sorted seats
 */
export function detectRowsFromSeats(seats, tolerance = 5) {
  const rowMap = new Map()
  
  seats.forEach(seat => {
    const yBucket = Math.round(seat.y / tolerance) * tolerance
    if (!rowMap.has(yBucket)) {
      rowMap.set(yBucket, [])
    }
    rowMap.get(yBucket).push(seat)
  })
  
  // Sort each row by X coordinate
  rowMap.forEach((rowSeats, yBucket) => {
    rowSeats.sort((a, b) => a.x - b.x)
  })
  
  return rowMap
}

/**
 * Assigns row letters and numbers to seats based on their spatial arrangement
 */
export function assignRowNumbers(seats, startRowIndex = 0) {
  if (seats.length === 0) return seats
  
  const rowMap = detectRowsFromSeats(seats)
  const sortedRows = Array.from(rowMap.entries()).sort((a, b) => a[0] - b[0]) // Sort by Y
  
  let currentRowIndex = startRowIndex
  const updatedSeats = seats.map(seat => {
    // Find which row this seat belongs to
    for (const [yBucket, rowSeats] of sortedRows) {
      const seatIndex = rowSeats.findIndex(s => s.id === seat.id)
      if (seatIndex !== -1) {
        const rowLetter = getRowLetter(currentRowIndex)
        const seatNumber = seatIndex + 1
        return {
          ...seat,
          row: rowLetter,
          number: seatNumber,
          label: generateSeatLabel(rowLetter, seatNumber),
        }
      }
    }
    return seat
  })
  
  return updatedSeats
}
