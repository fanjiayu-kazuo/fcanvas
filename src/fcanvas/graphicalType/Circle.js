import { Shape } from "../baseClass/shape";

export class Circle extends Shape {
  static HANDLE_SIZE = 8;
  static BOUNDING_STROKE_WIDTH = 2;

  constructor(
    canvas,
    ctx,
    startX,
    startY,
    endX,
    endY,
    { strokeColor, fillColor, lineWidth, name, uuid, areaNameStyle = {} } = {}
  ) {
    if (ctx instanceof CanvasRenderingContext2D) {
      super(ctx, { strokeColor, fillColor, canvas, lineWidth, name, uuid });

      this.startX = startX;
      this.startY = startY;
      this.endX = endX;
      this.endY = endY;
      this.radius = this.getRadius();
      this.areaNameSize = areaNameStyle.fontSize || 14;
      this.areaNameColor = areaNameStyle.textColor || "#FFF";
      this.fontStyle = `${areaNameStyle.fontSize || 14}px sans-serif`;
    } else {
      throw new Error("Invalid context");
    }
  }
  setAreaNameColor(color) {
    this.areaNameColor = color;
    this.emit("redraw");
  }
  setAreaNameSize(size) {
    this.fontStyle = `${size}px sans-serif`;
    this.emit("redraw");
  }
  draw() {
    this.ctx.beginPath();
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.arc(this.startX, this.startY, this.getRadius(), 0, 2 * Math.PI);
    this.ctx.strokeStyle = this.strokeColor;
    this.ctx.fillStyle = this.fillColor;
    this.ctx.fill();
    this.ctx.stroke();
    this.drawAreaName();
  }

  drawAreaName() {
    if(!Shape.showName)return
    const center = this.getRectCenter();
    this.ctx.save();
    this.ctx.fillStyle = this.areaNameColor;
    this.ctx.font = this.fontStyle;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.wrapText(this.name, center.x, center.y);
    this.ctx.restore();
  }

  wrapText(text, x, y) {
    if (!text) return;
    const words = text.split(" ");
    const lineHeight = parseInt(this.ctx.font) * 1.2;
    let maxWidth = Math.abs(this.endX - this.startX) * 0.8;
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      let testLine = currentLine + " " + words[i];
      let metrics = this.ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    y -= ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line) => {
      this.ctx.fillText(line, x, y);
      y += lineHeight;
    });
  }

  getRectCenter() {
    return {
      x: this.startX,
      y: this.startY,
    };
  }
  static drawPreview(ctx, startX, startY, endX, endY) {
    ctx.beginPath();
    ctx.arc(
      startX,
      startY,
      Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)),
      0,
      2 * Math.PI
    );
    ctx.fill();
    ctx.stroke();
  }

  getRadius() {
    return Math.sqrt(
      Math.pow(this.endX - this.startX, 2) +
        Math.pow(this.endY - this.startY, 2)
    );
  }

  isPointInside(x, y) {
    const radius = this.getRadius();
    const isInsideCircle =
      Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2) <=
      Math.pow(radius, 2);
    const isInsideHandle = this.isInsideHandle(x, y);
    const isInsideBoundingStroke = this.isInsideBoundingStroke(x, y, radius);

    return isInsideCircle || isInsideHandle || isInsideBoundingStroke;
  }

  isInsideHandle(x, y) {
    const handleSize = Circle.HANDLE_SIZE;
    return (
      (x >= this.startX - handleSize / 2 &&
        x <= this.startX + handleSize / 2 &&
        y >= this.startY - handleSize / 2 &&
        y <= this.startY + handleSize / 2) ||
      (x >= this.endX - handleSize / 2 &&
        x <= this.endX + handleSize / 2 &&
        y >= this.endY - handleSize / 2 &&
        y <= this.endY + handleSize / 2)
    );
  }

  isInsideBoundingStroke(x, y, radius) {
    const boundingStrokeWidth = Circle.BOUNDING_STROKE_WIDTH;
    return (
      x >= this.startX - radius - boundingStrokeWidth &&
      x <= this.startX + radius + boundingStrokeWidth &&
      y >= this.startY - radius - boundingStrokeWidth &&
      y <= this.startY + radius + boundingStrokeWidth
    );
  }

  getBoundingBox() {
    const radius = this.getRadius();
    return {
      x: this.startX - radius,
      y: this.startY - radius,
      width: radius * 2,
      height: radius * 2,
    };
  }

  setBoundingStroke(strokeColor) {
    const bounding = this.getBoundingBox();
    this.ctx.beginPath();
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = strokeColor || "rgba(255,0,0,1)";
    this.ctx.strokeRect(
      bounding.x,
      bounding.y,
      bounding.width,
      bounding.height
    );
    this.ctx.closePath();
  }

  move(dx, dy) {
    this.startX += dx;
    this.startY += dy;
    this.endX += dx;
    this.endY += dy;
    this.emit("positionChanged", [
      { x: this.startX, y: this.startY },
      { x: this.endX, y: this.endY },
    ]);
    this.drawAreaName();
  }

  drawSelectionStyle() {
    const { x, y, width, height } = this.getBoundingBox();
    this.ctx.save();
    this.ctx.strokeStyle = "blue";
    this.ctx.lineWidth = 2;
    // this.ctx.setLineDash([5, 5]);
    // this.ctx.strokeRect(x, y, width, height);

    this.drawResizeHandles();
    this.drawRadiusLine();
    this.ctx.restore();
  }

  drawResizeHandles() {
    const handleSize = Circle.HANDLE_SIZE;
    const handles = [{ x: this.endX, y: this.endY }];

    handles.forEach((handle) => {
      this.ctx.fillStyle = "white";
      this.ctx.fillRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      );
      this.ctx.strokeRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      );
    });
  }
  clip(context) {
    context.beginPath();

    context.arc(this.startX, this.startY, this.radius, 0, Math.PI * 2);
    context.clip();
  }
  fill(context) {
    context.beginPath();

    context.arc(this.startX, this.startY, this.radius, 0, Math.PI * 2);
    context.fill();
  }
  drawRadiusLine() {
    this.ctx.beginPath();
    this.ctx.moveTo(this.startX, this.startY);
    this.ctx.lineTo(this.endX, this.endY);
    this.ctx.strokeStyle = "blue";
    this.ctx.setLineDash([3, 3]);
    this.ctx.stroke();
  }

  onMouseDown(x, y) {
    if (this.isPointInside(x, y)) {
      this.startDragging(x, y);
    }

    this.checkResizeHandles(x, y);
  }

  startDragging(x, y) {
    this.isDragging = true;
    this.dragStartX = x;
    this.dragStartY = y;
  }

  checkResizeHandles(x, y) {
    const handleSize = Circle.HANDLE_SIZE;
    const handles = [
      { x: this.startX, y: this.startY },
      { x: this.endX, y: this.endY },
    ];

    handles.forEach((handle, index) => {
      if (
        x >= handle.x - handleSize / 2 &&
        x <= handle.x + handleSize / 2 &&
        y >= handle.y - handleSize / 2 &&
        y <= handle.y + handleSize / 2
      ) {
        this.startResizing(x, y, index);
      }
    });
  }

  startResizing(x, y, index) {
    this.isResizing = true;
    this.resizeHandleIndex = index;
    this.dragStartX = x;
    this.dragStartY = y;
  }

  onMouseMove(x, y) {
    if (this.isDragging && !this.isResizing) {
      this.handleDragging(x, y);
    } else if (this.isResizing) {
      this.handleResizing(x, y);
    }
    this.updateCursorStyle(x, y);
  }

  handleDragging(x, y) {
    const dx = x - this.dragStartX;
    const dy = y - this.dragStartY;
    this.move(dx, dy);
    this.dragStartX = x;
    this.dragStartY = y;
    this.drawSelectionStyle();
  }

  handleResizing(x, y) {
    const dx = x - this.dragStartX;
    const dy = y - this.dragStartY;

    if (this.resizeHandleIndex === 0) {
      // this.startX += dx;
      // this.startY += dy;
    } else if (this.resizeHandleIndex === 1) {
      this.endX += dx;
      this.endY += dy;
    }
    this.emit("positionChanged", [
      { x: this.startX, y: this.startY },
      { x: this.endX, y: this.endY },
    ]);
    this.dragStartX = x;
    this.dragStartY = y;
    this.drawSelectionStyle();
    this.updateCursorStyle(x, y);
    this.drawAreaName();
  }

  updateCursorStyle(x, y) {
    if (Shape.isDrawing) {
      this.canvas.style.cursor = "crosshair";
    } else {
      const handleSize = Circle.HANDLE_SIZE;
      const handles = [
        { x: this.startX, y: this.startY },
        { x: this.endX, y: this.endY },
      ];

      let isOverHandle = false;
      handles.forEach((handle) => {
        if (
          x >= handle.x - handleSize / 2 &&
          x <= handle.x + handleSize / 2 &&
          y >= handle.y - handleSize / 2 &&
          y <= handle.y + handleSize / 2
        ) {
          isOverHandle = true;
        }
      });

      if (isOverHandle) {
        this.canvas.style.cursor = "pointer";
      } else if (this.isPointInside(x, y)) {
        this.canvas.style.cursor = "move";
      } else {
        this.canvas.style.cursor = "default";
      }
    }
  }

  onMouseUp() {
    this.isDragging = false;
    this.isResizing = false;
  }
}
