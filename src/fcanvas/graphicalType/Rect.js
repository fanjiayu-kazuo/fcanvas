import { Shape } from "../baseClass/shape";

const HANDLE_SIZE = 8;
const DEFAULT_FILL_STYLE = "rgba(255,255,255,0.5)";
const DEFAULT_STROKE_STYLE = "rgba(255,0,0,1)";
const SELECTION_STROKE_STYLE = "blue";
const SELECTION_LINE_WIDTH = 2;
const SELECTION_LINE_DASH = [5, 5];

export class Rect extends Shape {
  constructor(
    canvas,
    ctx,
    startX,
    startY,
    endX,
    endY,
    {
      fillColor = DEFAULT_FILL_STYLE,
      strokeColor = DEFAULT_STROKE_STYLE,
      lineWidth = 1,
      name = "",
      uuid = null,
      areaNameStyle = {},
    } = {}
  ) {
    super(ctx, { strokeColor, fillColor, lineWidth, name, canvas, uuid });
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.areaNameColor = areaNameStyle.textColor || "#FFF";
    this.areaNameSize = areaNameStyle.fontSize || 14;
    this.fontStyle = `${areaNameStyle.fontSize || 14}px sans-serif`;
  }
  setAreaNameColor(color) {
    this.areaNameColor = color;
    this.emit("redraw");
  }
  setAreaNameSize(size) {
    this.fontStyle = `${size}px sans-serif`;
    this.emit("redraw");
  }
  // 绘制矩形和区域名称
  draw() {
    this.drawRectangle();
    this.drawAreaName();
  }
  // 重新绘制矩形

  // 绘制矩形
  drawRectangle() {
    this.ctx.beginPath();
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.rect(
      this.startX,
      this.startY,
      this.endX - this.startX,
      this.endY - this.startY
    );
    this.ctx.fillStyle = this.fillColor;
    this.ctx.strokeStyle = this.strokeColor;
    this.ctx.fill();
    this.ctx.stroke();
  }

  // 绘制区域名称
  drawAreaName() {
    if(!Shape.showName)return
    const center = this.getRectCenter();
    this.ctx.fillStyle = this.areaNameColor;
    this.ctx.font = this.fontStyle;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.wrapText(this.name, center.x, center.y);
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

  // 获取矩形中心
  getRectCenter() {
    return {
      x: (this.startX + this.endX) / 2,
      y: (this.startY + this.endY) / 2,
    };
  }

  static drawPreview(ctx, startX, startY, endX, endY) {
    ctx.strokeRect(startX, startY, endX - startX, endY - startY);
    ctx.fillStyle = ctx.fillStyle || DEFAULT_FILL_STYLE;
    ctx.fillRect(startX, startY, endX - startX, endY - startY);
    ctx.stroke();
  }

  isPointInside(x, y) {
    const handles = this.getHandles();
    return (
      (x >= this.startX &&
        x <= this.endX &&
        y >= this.startY &&
        y <= this.endY) ||
      handles.some((handle) => this.isPointInHandle(x, y, handle))
    );
  }

  getBoundingBox() {
    return {
      x: Math.min(this.startX, this.endX),
      y: Math.min(this.startY, this.endY),
      width: Math.abs(this.endX - this.startX),
      height: Math.abs(this.endY - this.startY),
    };
  }

  setBoundingStroke(strokeColor) {
    const bounding = this.getBoundingBox();
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.lineWidth = 1;
    console.log(strokeColor);
    this.ctx.strokeStyle = strokeColor || DEFAULT_STROKE_STYLE;
    this.ctx.strokeRect(
      bounding.x,
      bounding.y,
      bounding.width,
      bounding.height
    );
    this.ctx.restore();
  }

  drawSelectionStyle() {
    const { x, y, width, height } = this.getBoundingBox();
    this.ctx.save();
    this.ctx.strokeStyle = SELECTION_STROKE_STYLE;
    this.ctx.lineWidth = SELECTION_LINE_WIDTH;
    // this.ctx.setLineDash(SELECTION_LINE_DASH);
    // this.ctx.strokeRect(x, y, width, height);
    this.drawHandles();
    this.ctx.restore();
  }
  clip(context) {
    context.beginPath();
    context.rect(
      this.startX,
      this.startY,
      this.endX - this.startX,
      this.endY - this.startY
    );
    context.clip();
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
  }

  onMouseDown(x, y) {
    if (this.isPointInside(x, y)) {
      this.isDragging = true;
      this.dragStartX = x;
      this.dragStartY = y;
    }
    this.checkResizeHandles(x, y);
  }

  onMouseMove(x, y) {
    if (this.isDragging && !this.isResizing) {
      this.handleDragging(x, y);
    } else if (this.isResizing) {
      this.handleResizing(x, y);
    }
    this.updateCursorStyle(x, y);
  }

  onMouseUp() {
    this.isDragging = false;
    this.isResizing = false;
  }

  // Helper methods
  getHandles() {
    return [
      { x: this.startX, y: this.startY },
      { x: this.endX, y: this.startY },
      { x: this.startX, y: this.endY },
      { x: this.endX, y: this.endY },
    ];
  }

  isPointInHandle(x, y, handle) {
    return (
      x >= handle.x - HANDLE_SIZE / 2 &&
      x <= handle.x + HANDLE_SIZE / 2 &&
      y >= handle.y - HANDLE_SIZE / 2 &&
      y <= handle.y + HANDLE_SIZE / 2
    );
  }

  drawHandles() {
    const handles = this.getHandles();
    handles.forEach((handle) => {
      this.ctx.fillStyle = "white";
      this.ctx.fillRect(
        handle.x - HANDLE_SIZE / 2,
        handle.y - HANDLE_SIZE / 2,
        HANDLE_SIZE,
        HANDLE_SIZE
      );
      this.ctx.strokeRect(
        handle.x - HANDLE_SIZE / 2,
        handle.y - HANDLE_SIZE / 2,
        HANDLE_SIZE,
        HANDLE_SIZE
      );
    });
  }

  checkResizeHandles(x, y) {
    const handles = this.getHandles();
    handles.forEach((handle, index) => {
      if (this.isPointInHandle(x, y, handle)) {
        this.isResizing = true;
        this.resizeHandleIndex = index;
        this.dragStartX = x;
        this.dragStartY = y;
      }
    });
  }

  handleDragging(x, y) {
    const dx = x - this.dragStartX;
    const dy = y - this.dragStartY;
    this.move(dx, dy);
    this.dragStartX = x;
    this.dragStartY = y;
    this.drawAreaName();
    this.drawSelectionStyle();
  }

  handleResizing(x, y) {
    const dx = x - this.dragStartX;
    const dy = y - this.dragStartY;
    switch (this.resizeHandleIndex) {
      case 0:
        this.startX += dx;
        this.startY += dy;
        break;
      case 1:
        this.endX += dx;
        this.startY += dy;
        break;
      case 2:
        this.startX += dx;
        this.endY += dy;
        break;
      case 3:
        this.endX += dx;
        this.endY += dy;
        break;
    }
    this.dragStartX = x;
    this.dragStartY = y;
    this.emit("positionChanged", [
      { x: this.startX, y: this.startY },
      { x: this.endX, y: this.endY },
    ]);
    this.drawAreaName();
    this.drawSelectionStyle();
  }

  updateCursorStyle(x, y) {
    if (Shape.isDrawing) {
      this.canvas.style.cursor = "crosshair";
    } else {
      const handles = this.getHandles();
      let isOverHandle = false;
      handles.forEach((handle, index) => {
        if (this.isPointInHandle(x, y, handle)) {
          isOverHandle = true;
          this.canvas.style.cursor = this.getCursorStyle(index);
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

  getCursorStyle(index) {
    switch (index) {
      case 0:
        return "nw-resize";
      case 1:
        return "ne-resize";
      case 2:
        return "sw-resize";
      case 3:
        return "se-resize";
      default:
        return "default";
    }
  }
}
