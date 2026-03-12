export function generateSeatId(seats, layoutId) {
    if (!seats || seats.length === 0) {
        return `${layoutId}_seat_1`;
    }

    const maxSeatNumber = seats.reduce((max, seat) => {
        if (!seat || typeof seat.id !== "string") return max;

        const parts = seat.id.split("_seat_");
        const num = parseInt(parts[1], 10);

        if (Number.isNaN(num)) return max;
        return num > max ? num : max;
    }, 0);

    return `${layoutId}_seat_${maxSeatNumber + 1}`;
}
