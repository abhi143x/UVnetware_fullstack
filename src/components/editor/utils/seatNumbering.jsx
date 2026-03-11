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

const SINGLE_SEAT_MAX_PER_ROW = 50

function getRowIndexFromLetter(rowLetter) {
  if (typeof rowLetter !== 'string' || rowLetter.length === 0) return -1

  let index = 0
  const normalized = rowLetter.toUpperCase()

  for (let i = 0; i < normalized.length; i += 1) {
    const code = normalized.charCodeAt(i)
    if (code < 65 || code > 90) return -1
    index = index * 26 + (code - 64)
  }

  return index - 1
}

function getNextRowLetter(currentRow) {
  const currentRowIndex = getRowIndexFromLetter(currentRow)
  return getRowLetter(currentRowIndex + 1)
}

/**
 * Returns the next row/number/label payload for single-seat creation.
 * Rules:
 * 1) Empty layout -> A1
 * 2) Same row until seat 50
 * 3) After 50 -> next row, number resets to 1
 */
export function getNextSingleSeatLabel(seats) {
  if (!Array.isArray(seats) || seats.length === 0) {
    return { row: 'A', number: 1, label: 'A1' }
  }

  for (let i = seats.length - 1; i >= 0; i -= 1) {
    const seat = seats[i]
    const seatNumber = Number(seat?.number)
    const row = typeof seat?.row === 'string' ? seat.row.trim().toUpperCase() : ''

    if (!row || !Number.isInteger(seatNumber) || seatNumber < 1) {
      continue
    }

    if (seatNumber < SINGLE_SEAT_MAX_PER_ROW) {
      const nextNumber = seatNumber + 1
      return {
        row,
        number: nextNumber,
        label: generateSeatLabel(row, nextNumber),
      }
    }

    const nextRow = getNextRowLetter(row)
    return {
      row: nextRow,
      number: 1,
      label: generateSeatLabel(nextRow, 1),
    }
  }

  return { row: 'A', number: 1, label: 'A1' }
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
  rowMap.forEach((rowSeats, _yBucket) => {
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
    for (const [_yBucket, rowSeats] of sortedRows) {
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
