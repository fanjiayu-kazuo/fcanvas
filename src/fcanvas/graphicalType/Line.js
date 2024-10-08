import { Shape } from "../baseClass/shape";

export class Line extends Shape {
  constructor(canvas, ctx, x1, y1, x2, y2, strokeColor, lineWidth, name,uuid) {
    super(ctx, { strokeColor, lineWidth, name, canvas,uuid });
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.handleSize = 8;
  }

  draw() {
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.strokeColor;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.moveTo(this.x1, this.y1);
    this.ctx.lineTo(this.x2, this.y2);
    this.ctx.stroke();
  }

  static drawPreview(ctx, startX, startY, endX, endY) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  isPointInside(x, y) {
    const isInHandle = (hx, hy) =>
      x >= hx - this.handleSize / 2 &&
      x <= hx + this.handleSize / 2 &&
      y >= hy - this.handleSize / 2 &&
      y <= hy + this.handleSize / 2;

    if (isInHandle(this.x1, this.y1) || isInHandle(this.x2, this.y2)) {
      return true;
    }

    const lineLength = this.calculateLineLength();
    const distance = this.calculateDistanceToLine(x, y, lineLength);
    const dotProduct = this.calculateDotProduct(x, y, lineLength);
    const threshold = Math.max(this.strokeWidth || 1, 10) / 2 + 5;

    return distance <= threshold && dotProduct >= -0.1 && dotProduct <= 1.1;
  }

  calculateLineLength() {
    return Math.sqrt((this.x2 - this.x1) ** 2 + (this.y2 - this.y1) ** 2);
  }

  calculateDistanceToLine(x, y, lineLength) {
    return Math.abs(
      (this.y2 - this.y1) * x -
      (this.x2 - this.x1) * y +
      this.x2 * this.y1 -
      this.y2 * this.x1
    ) / lineLength;
  }

  calculateDotProduct(x, y, lineLength) {
    return ((x - this.x1) * (this.x2 - this.x1) +
      (y - this.y1) * (this.y2 - this.y1)) / lineLength ** 2;
  }

  getBoundingBox() {
    return {
      x: Math.min(this.x1, this.x2),
      y: Math.min(this.y1, this.y2),
      width: Math.abs(this.x2 - this.x1),
      height: Math.abs(this.y2 - this.y1),
    };
  }

  setBoundingStroke(strokeColor) {
    const bounding = this.getBoundingBox();
    this.ctx.beginPath();
    this.ctx.strokeStyle = strokeColor || "rgba(255,0,0,1)";
    this.ctx.strokeRect(bounding.x, bounding.y, bounding.width, bounding.height);
    this.ctx.closePath();
  }

  drawSelectionStyle() {
    const { x, y, width, height } = this.getBoundingBox();
    this.ctx.save();
    this.ctx.strokeStyle = "blue";
    this.ctx.lineWidth = 2;

    this.drawResizeHandles();
    this.ctx.restore();
  }

  drawResizeHandles() {
    const handles = [
      { x: this.x1, y: this.y1 },
      { x: this.x2, y: this.y2 },
    ];

    handles.forEach((handle) => {
      this.ctx.fillStyle = "white";
      this.ctx.fillRect(
        handle.x - this.handleSize / 2,
        handle.y - this.handleSize / 2,
        this.handleSize,
        this.handleSize
      );
      this.ctx.strokeRect(
        handle.x - this.handleSize / 2,
        handle.y - this.handleSize / 2,
        this.handleSize,
        this.handleSize
      );
    });
  }

  drawLine() {
    this.ctx.beginPath();
    this.ctx.moveTo(this.x1, this.y1);
    this.ctx.lineTo(this.x2, this.y2);
    this.ctx.strokeStyle = "blue";
    this.ctx.setLineDash([]);
    this.ctx.lineWidth = this.strokeWidth;
    this.ctx.stroke();
  }

  move(dx, dy) {
    this.x1 += dx;
    this.y1 += dy;
    this.x2 += dx;
    this.y2 += dy;
    this.emit("positionChanged", [{x: this.x1, y: this.y1}, {x: this.x2, y: this.y2}]);
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
    const handles = [
      { x: this.x1, y: this.y1 },
      { x: this.x2, y: this.y2 },
    ];

    handles.forEach((handle, index) => {
      if (this.isInHandle(x, y, handle)) {
        this.startResizing(x, y, index);
      }
    });
  }

  isInHandle(x, y, handle) {
    return (
      x >= handle.x - this.handleSize / 2 &&
      x <= handle.x + this.handleSize / 2 &&
      y >= handle.y - this.handleSize / 2 &&
      y <= handle.y + this.handleSize / 2
    );
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
      this.x1 += dx;
      this.y1 += dy;
    } else if (this.resizeHandleIndex === 1) {
      this.x2 += dx;
      this.y2 += dy;
    }
    this.emit("positionChanged", [{x: this.x1, y: this.y1}, {x: this.x2, y: this.y2}]);
    this.dragStartX = x;
    this.dragStartY = y;
    this.drawSelectionStyle();
  }

  updateCursorStyle(x, y) {
    const handles = [
      { x: this.x1, y: this.y1 },
      { x: this.x2, y: this.y2 },
    ];

    let isOverHandle = false;
    handles.forEach((handle) => {
      if (this.isInHandle(x, y, handle)) {
        isOverHandle = true;
        this.canvas.style.cursor = "pointer";
      }
    });

    if (!isOverHandle) {
      if (this.isPointInside(x, y)) {
        this.canvas.style.cursor = "move";
      } else {
        this.canvas.style.cursor = "default";
      }
    }
  }
  clip(context) {
    context.beginPath();
    context.moveTo(this.x1, this.y1);
    context.lineTo(this.x2, this.y2);
    context.clip();
  }
  onMouseUp() {
    this.isDragging = false;
    this.isResizing = false;
  }
}