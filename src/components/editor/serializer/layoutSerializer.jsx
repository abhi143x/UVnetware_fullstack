// Save layout to JSON
export function saveLayout(seats, texts, shapes = []) {
  const layout = {
    version: "1.0",
    seats,
    texts,
    shapes,
    timestamp: new Date().toISOString(),
  };

  return JSON.stringify(layout, null, 2);
}

// Load layout from JSON
export function loadLayout(jsonString) {
  try {
    const layout = JSON.parse(jsonString);
    return {
      seats: layout.seats || [],
      texts: layout.texts || [],
      shapes: layout.shapes || [],
    };
  } catch (error) {
    console.error("Failed to load layout:", error);
    return { seats: [], texts: [], shapes: [] };
  }
}
