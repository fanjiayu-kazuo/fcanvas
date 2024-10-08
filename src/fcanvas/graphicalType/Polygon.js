import { Shape } from "../baseClass/shape";

export class Polygon extends Shape {
  constructor(
    canvas,
    ctx,
    pointList,
    { fillColor, strokeColor, lineWidth, name, uuid, areaNameStyle = {} } = {}
  ) {
    super(ctx, { fillColor, strokeColor, canvas, lineWidth, name, uuid });

    this.pointList = pointList;
    this.isDragging = false;
    this.isResizing = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.resizeHandleIndex = -1;
    this.areaNameColor = areaNameStyle.textColor || "#FFF";
    this.areaNameSize = areaNameStyle.fontSize || 14;
    this.fontStyle = `${areaNameStyle.fontSize || 14}px sans-serif`; // Default font style
    this.validateContext(ctx);
  }

  validateContext(ctx) {
    if (!(ctx instanceof CanvasRenderingContext2D)) {
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

  drawPolygonPath(ctx, offsetX = 0, offsetY = 0) {
    ctx.beginPath();
    this.pointList.forEach((point, index) => {
      const px = point.x - offsetX;
      const py = point.y - offsetY;
      if (index === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    });
    ctx.closePath();
  }

  drawPolygon(ctx = this.ctx, offsetX = 0, offsetY = 0) {
    ctx.save();
    this.drawPolygonPath(ctx, offsetX, offsetY);
    ctx.fillStyle = this.fillColor;
    ctx.fill();
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.lineWidth;
    ctx.stroke();
    ctx.restore();
  }

  draw() {
    if (this.pointList.length < 3) return;
    this.setupDrawingContext();
    this.drawPolygon();
    this.drawAreaName(); // Ensure area name is drawn every time
  }

  setupDrawingContext() {
    this.ctx.beginPath();
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.fillStyle = this.fillColor;
    this.ctx.strokeStyle = this.strokeColor;
  }

  drawAreaName(ctx = this.ctx, offsetX = 0, offsetY = 0) {
    if(!Shape.showName)return
    const center = this.getPolygonAreaCenter();
    ctx.fillStyle = this.areaNameColor; // Use correct text color
    ctx.font = this.fontStyle;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    this.wrapText(ctx, this.name, center.x - offsetX, center.y - offsetY); // Use actual shape name
  }

  wrapText(ctx, text, x, y) {
    if (!text) return; // If no text, return immediately
    const words = text.split(" ");
    const lineHeight = parseInt(ctx.font) * 1.2;
    let maxWidth = 0;
    words.forEach((word) => {
      const width = ctx.measureText(word).width;
      maxWidth = Math.max(maxWidth, width);
    });
    y -= ((words.length - 1) * lineHeight) / 2;
    words.forEach((word) => {
      ctx.fillText(word, x, y);
      y += lineHeight;
    });
  }

  getPolygonAreaCenter() {
    const center = this.calculatePolygonCenter(this.pointList);
    return center;
  }

  calculatePolygonCenter(points) {
    let area = 0;
    let cx = 0;
    let cy = 0;

    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const factor = points[i].x * points[j].y - points[j].x * points[i].y;
      area += factor;
      cx += (points[i].x + points[j].x) * factor;
      cy += (points[i].y + points[j].y) * factor;
    }

    area /= 2;
    cx /= 6 * area;
    cy /= 6 * area;

    return { x: cx, y: cy };
  }

  arePointsEqual(points1, points2) {
    if (!points1 || !points2 || points1.length !== points2.length) return false;
    return points1.every(
      (point, index) =>
        point.x === points2[index].x && point.y === points2[index].y
    );
  }
  Area(p0, p1, p2) {
    return (
      (p0.x * p1.y +
        p1.x * p2.y +
        p2.x * p0.y -
        p1.x * p0.y -
        p2.x * p1.y -
        p0.x * p2.y) /
      2
    );
  }
  static drawPreview(ctx, startX, startY, endX, endY, currentPoints) {
    ctx.beginPath();
    ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
    currentPoints.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.lineTo(endX, endY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  clip(context) {
    context.beginPath();
    this.pointList.forEach((point) => {
      context.lineTo(point.x, point.y);
    });
    context.closePath();
    context.clip();
  }
  isPointInside(x, y) {
    const points = this.pointList;
    const n = points.length;
    let inside = false;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const xi = points[i].x;
      const yi = points[i].y;
      const xj = points[j].x;
      const yj = points[j].y;

      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }

    if (inside) return true;

    return this.isPointInHandle(x, y);
  }

  isPointInHandle(x, y) {
    const handleSize = 10;
    return this.pointList.some(
      (point) =>
        x >= point.x - handleSize / 2 &&
        x <= point.x + handleSize / 2 &&
        y >= point.y - handleSize / 2 &&
        y <= point.y + handleSize / 2
    );
  }

  getBoundingBox() {
    if (this.pointList.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let [minX, minY] = [this.pointList[0].x, this.pointList[0].y];
    let [maxX, maxY] = [minX, minY];

    this.pointList.forEach((point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  setBoundingStroke(strokeColor = "rgba(255,0,0,1)") {
    const { x, y, width, height } = this.getBoundingBox();
    this.ctx.beginPath();
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = strokeColor;
    this.ctx.strokeRect(x, y, width, height);
    this.ctx.closePath();
  }

  drawSelectionStyle(ctx = this.ctx, offsetX = 0, offsetY = 0) {
    const { x, y, width, height } = this.getBoundingBox();
    ctx.save();
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    // this.ctx.strokeRect(x, y, width, height);

    // this.drawHandles(x, y, width, height);
    this.drawPolygonOutline(ctx, offsetX, offsetY);
    ctx.restore();
  }

  drawHandles(x, y, width, height) {
    const handleSize = 8;
    const handles = [
      { x: x, y: y },
      { x: x + width, y: y },
      { x: x, y: y + height },
      { x: x + width, y: y + height },
    ];

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

  drawPolygonOutline(ctx = this.ctx, offsetX = 0, offsetY = 0) {
    const handleSize = 8;
    ctx.beginPath();
    // ctx.moveTo(this.pointList[0].x - offsetX, this.pointList[0].y - offsetY);
    // for (let i = 1; i < this.pointList.length; i++) {
    //   ctx.lineTo(this.pointList[i].x - offsetX, this.pointList[i].y - offsetY);
    // }
    ctx.closePath();
    ctx.strokeStyle = "blue";
    ctx.setLineDash([]);
    ctx.stroke();

    this.pointList.forEach((point) => {
      ctx.fillStyle = "white";
      ctx.fillRect(
        point.x - offsetX - handleSize / 2,
        point.y - offsetY - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.strokeRect(
        point.x - offsetX - handleSize / 2,
        point.y - offsetY - handleSize / 2,
        handleSize,
        handleSize
      );
    });
  }

  move(dx, dy) {
    this.pointList.forEach((point) => {
      point.x += dx;
      point.y += dy;
    });
    this.emit("positionChanged", this.pointList);
    this.drawAreaName(); // Draw the entire shape again
  }

  scale(factor) {
    const centerX =
      (Math.min(...this.pointList.map((p) => p.x)) +
        Math.max(...this.pointList.map((p) => p.x))) /
      2;
    const centerY =
      (Math.min(...this.pointList.map((p) => p.y)) +
        Math.max(...this.pointList.map((p) => p.y))) /
      2;

    this.pointList.forEach((point) => {
      point.x = centerX + (point.x - centerX) * factor;
      point.y = centerY + (point.y - centerY) * factor;
    });
  }

  onMouseDown(x, y) {
    if (this.isPointInside(x, y)) {
      this.isDragging = true;
      this.dragStartX = x;
      this.dragStartY = y;
    }

    const handleSize = 10;
    this.pointList.forEach((point, index) => {
      if (
        x >= point.x - handleSize &&
        x <= point.x + handleSize &&
        y >= point.y - handleSize &&
        y <= point.y + handleSize
      ) {
        this.isResizing = true;
        this.resizeHandleIndex = index;
        this.dragStartX = x;
        this.dragStartY = y;
      }
    });
  }

  onMouseMove(x, y) {
    if (this.isDragging && !this.isResizing) {
      const dx = x - this.dragStartX;
      const dy = y - this.dragStartY;
      this.move(dx, dy);
      this.dragStartX = x;
      this.dragStartY = y;
    } else if (this.isResizing) {
      const dx = x - this.dragStartX;
      const dy = y - this.dragStartY;
      this.pointList[this.resizeHandleIndex].x += dx;
      this.pointList[this.resizeHandleIndex].y += dy;
      this.dragStartX = x;
      this.dragStartY = y;
      this.emit("positionChanged", this.pointList);
      this.drawAreaName(); // Draw the entire shape again
      this.drawSelectionStyle();
    }

    this.updateCursorStyle(x, y);
  }

  updateCursorStyle(x, y) {
    if (Shape.isDrawing) {
      this.canvas.style.cursor = "crosshair";
    } else {
      const handleSize = 8;
      const isOverHandle = this.pointList.some(
        (point) =>
          x >= point.x - handleSize / 2 &&
          x <= point.x + handleSize / 2 &&
          y >= point.y - handleSize / 2 &&
          y <= point.y + handleSize / 2
      );

      // this.canvas.style.cursor = isOverHandle ? "pointer" : "default";
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

  setFontStyle(fontStyle) {
    this.fontStyle = fontStyle;
  }
}
