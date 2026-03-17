export class TextTool {
  constructor(storeActions) {
    this.handleWorldClick = storeActions.handleWorldClick
    this.moveTextsPreview = storeActions.moveTextsPreview
    this.moveTexts = storeActions.moveTexts
    this.selectText = storeActions.selectText
    this.dragState = null
  }

  handleMouseDown(_event, _worldPoint, _context) {
    // Check if clicking on existing text to start dragging
    const clickedText = _context.texts.find(text => {
      const distance = Math.sqrt(
        Math.pow(text.x - _worldPoint.x, 2) + Math.pow(text.y - _worldPoint.y, 2)
      );
      const selectionRadius = Math.max(30, text.fontSize || 20);
      return distance < selectionRadius;
    });

    if (clickedText) {
      // Select the text and start dragging
      this.selectText(clickedText.id);
      this.dragState = {
        type: 'drag',
        startPoint: _worldPoint,
        initialTextPosition: { x: clickedText.x, y: clickedText.y },
        textId: clickedText.id
      };
      return this.dragState;
    }
    
    // Place new text if not clicking on existing
    return null
  }

  handleMouseMove(_event, worldPoint, _context, _session) {
    // Handle dragging existing text
    if (_session?.type === 'drag' && _session.textId) {
      const deltaX = worldPoint.x - _session.startPoint.x;
      const deltaY = worldPoint.y - _session.startPoint.y;
      
      const newTextPosition = {
        id: _session.textId,
        x: _session.initialTextPosition.x + deltaX,
        y: _session.initialTextPosition.y + deltaY
      };

      this.moveTextsPreview([newTextPosition]);
      return {
        type: 'drag',
        ..._session
      };
    }

    // Preview text placement for new text
    return {
      type: 'preview',
      previewPoint: worldPoint,
    }
  }

  handleMouseUp(_event, worldPoint, _context, _session) {
    // Commit text drag
    if (_session?.type === 'drag') {
      const deltaX = worldPoint.x - _session.startPoint.x;
      const deltaY = worldPoint.y - _session.startPoint.y;
      
      const finalTextPosition = {
        id: _session.textId,
        x: _session.initialTextPosition.x + deltaX,
        y: _session.initialTextPosition.y + deltaY
      };

      this.moveTexts([finalTextPosition]);
      this.dragState = null;
      return null;
    }

    // Create new text if we were dragging but didn't click on existing text
    if (this.dragState?.type === 'drag') {
      this.handleWorldClick(worldPoint);
      this.dragState = null;
    }

    return null;
  }

  handleClick(_event, worldPoint, context) {
    // Check if clicking on existing text first
    const clickedText = context.texts.find(text => {
      const distance = Math.sqrt(
        Math.pow(text.x - worldPoint.x, 2) + Math.pow(text.y - worldPoint.y, 2)
      );
      // Use dynamic selection radius based on font size
      const selectionRadius = Math.max(30, text.fontSize || 20);
      return distance < selectionRadius;
    });

    if (clickedText) {
      // Select existing text for editing
      this.selectText(clickedText.id);
    } else {
      // Always create new text if clicking on empty space
      this.handleWorldClick(worldPoint);
    }
    return null
  }
}
