# Universal Ticket Booking Web App

WORK IN PROGRESS..

---

## Seat Layout Editor Documentation

The `src/components/editor/` directory contains a fully-featured, canvas-based Seat Layout Editor. It is designed to let administrators visually build complex seating arrangements (cinemas, theaters, stadiums) with specialized tools.

### Features

- **Infinite Canvas:** Middle-click, Right-click, or `Alt`+Left-click to pan around an infinite workspace. Scroll wheel to zoom in and out.
- **Seat Tool:** Click anywhere on the canvas to place individual seats.
- **Row Tool:** Click and drag to create a linear row of seats. Hold `Shift` to snap the row angle to 15-degree increments.
- **Arc Tool:** Click and drag outward to define a radius, then sweep in a circular motion to generate a perfect arc of seats.
- **Text Tool:** Add floating text or labels directly to the layout. Customize font size, color, and weight.
- **Select & Marquee Tool:** Click and drag to draw a box and select multiple seats/lines of text. Hold `Shift` to select multiple items additively. Selected items can be instantly dragged around the canvas.
- **Eraser Tool:** Click individual seats/text to delete them, or use the Select tool to highlight mass items and switch to the Eraser to delete them simultaneously.
- **Automatic Collision Detection:** All tools natively prevent placing new seats directly on top of existing ones.

### How to Use

To use the editor in your application, simply import the `Editor` component and place it in a full-screen or flex container.
```jsx
import Editor from './components/editor/Editor'

function App() {
  return (
    <div className="h-screen w-full">
      <Editor />
    </div>
  )
}
```

The Editor state is entirely managed internally via Zustand (`editorStore.jsx`). To save or load state from a backend, you can use the built-in serializer functions:
```jsx
// src/components/editor/serializer/layoutSerializer.jsx
import { saveLayout, loadLayout } from './serializer/layoutSerializer'

// Save
const json = saveLayout(seats, texts)

// Load
const parsed = loadLayout(json)
```

---

### Folder Structure

```text
editor/
 ├─ Editor.jsx
 ├─ EditorCanvas.jsx
 ├─ PropertiesPanel.jsx
 ├─ Toolbar.jsx
 ├─ canvas/
 │  ├─ CanvasStage.jsx
 │  ├─ SeatComponent.jsx
 │  └─ TextComponent.jsx
 ├─ constants/
 │  └─ tools.jsx
 ├─ hooks/
 │  ├─ useCanvasEvents.jsx
 │  ├─ useCanvasZoom.jsx
 │  ├─ useCursor.jsx
 │  ├─ useKeyboardShortcuts.jsx
 │  ├─ usePreviewElements.jsx
 │  ├─ useRenderedElements.jsx
 │  ├─ useSeatSelection.jsx
 │  ├─ useToolHandler.jsx
 │  └─ useViewport.jsx
 ├─ serializer/
 │  └─ layoutSerializer.jsx
 ├─ store/
 │  └─ editorStore.jsx
 ├─ tools/
 │  ├─ ToolManager.jsx
 │  ├─ arcTool.jsx
 │  ├─ eraserTool.jsx
 │  ├─ rowTool.jsx
 │  ├─ seatTool.jsx
 │  ├─ selectTool.jsx
 │  └─ textTool.jsx
 └─ utils/
    └─ mathUtils.jsx
```

### File Explanations

#### Root Level
* **`Editor.jsx`** - The main entry point container. It combines the `Toolbar`, `EditorCanvas`, and `PropertiesPanel` into a single UI view.
* **`EditorCanvas.jsx`** - The primary interactive area. It connects the React state (seats, active tool, properties) with the raw mouse/zoom events.
* **`Toolbar.jsx`** - The side navigation bar that allows users to switch between tools (Seat, Row, Arc, Eraser, etc.).
* **`PropertiesPanel.jsx`** - The right-side panel that appears when an object (like Text) is selected, allowing the user to change colors, fonts, and scales.

#### `/canvas`
This directory handles the raw visual geometry drawn on the screen using SVG components.
* **`CanvasStage.jsx`** - The wrapper that holds the SVG elements and applies the global `transform` (pan/zoom) so everything moves uniformly.
* **`SeatComponent.jsx`** - A `React.memo` optimized SVG component representing a single circular seat.
* **`TextComponent.jsx`** - A component for rendering user-defined text labels onto the screen.

#### `/constants`
* **`tools.jsx`** - Defines simple system-wide ID constants so tools can be imported safely without risking typos (e.g., `TOOL_ROW = 'row'`).

#### `/hooks`
These hooks abstract away complex logic from the visual components to keep them clean.
* **`useCanvasEvents.jsx`** - Wraps native browser mouse events (clicks, dragging, up/down) and safely routes them (e.g., suppressing browser context menus when right-clicking).
* **`useCanvasZoom.jsx`** - Tracks scroll wheel events and performs logarithmic math to seamlessly zoom in/out relative to the cursor position.
* **`useViewport.jsx`** - Manages the `camera` state (x, y panning and z scale).
* **`useToolHandler.jsx`** - Acts as the bridge between raw canvas events and the currently selected tool (passing events inside).
* **`useCursor.jsx`** - Dynamically changes the mouse arrow to different visual indicators (like a crosshair or drag hand) depending on context.
* **`useKeyboardShortcuts.jsx`** - Listens for physical key presses (like `Delete`, `Shift`, or `Ctrl`) to trigger system behaviors.
* **`usePreviewElements.jsx`** - Provides temporary visual lines (like the Select Marquee box or the Row line) that are rendered before you finish physically placing a shape.
* **`useRenderedElements.jsx`** - Optimizes rendering by filtering which seats are actively on screen to prevent lag.
* **`useSeatSelection.jsx`** - Computes which seats fall inside a dragging Marquee box.

#### `/serializer`
* **`layoutSerializer.jsx`** - Responsible for securely encoding the memory state into a raw JSON string for backend database storage, and unpacking it when loading the page.

#### `/store`
* **`editorStore.jsx`** - The centralized Zustand state container. It holds the source-of-truth for all seat coordinate arrays, selected items, active tools, and the math required to definitively prevent overlapping seats.

#### `/tools`
Each specific interactive tool is modularized completely out of the UI into pure logic classes.
* **`ToolManager.jsx`** - A router that holds an active instance of all tools below. It decides which tool gets the mouse event based on the user's active toolbar selection.
* **`arcTool.jsx`** - Performs trigonometric math to generate a semi-circle of points based on a drag radius.
* **`eraserTool.jsx`** - Destroys seats/text arrays based on exact click positions or active mass selections.
* **`rowTool.jsx`** - Computes a linear line of evenly spaced points between a start and end click point.
* **`seatTool.jsx`** - Places a single standalone seat at an exact XY coordinate.
* **`selectTool.jsx`** - Uses mouse coordinates to detect element hover hits, builds marquee selection rectangles, and tracks global displacement when dragging a massive cluster of seats.
* **`textTool.jsx`** - Intercepts clicks and routes them to text popups for the user to type localized labels.

#### `/utils`
* **`mathUtils.jsx`** - A library of pure, stateless mathematical functions dealing with bounding boxes over shapes, circle collision logic, trigonometric arc building, and angle-snapping.