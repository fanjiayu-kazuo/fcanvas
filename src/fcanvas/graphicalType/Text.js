import { Shape } from "../baseClass/shape";
export class Text extends Shape {
  constructor(
    canvas,
    ctx,
    x,
    y,
    {
      text,
      fontSize,
      textColor,
      strokeColor,
      uuid,
      fontFamily,
      textAlign,
      textBaseline,
      rotation,
    } = {}
  ) {
    super(ctx, { canvas, uuid, strokeColor });

    this.text = text;
    this.fontSize = fontSize;

    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.fontFamily = fontFamily || "Arial";
    this.textAlign = textAlign || "left";
    this.textBaseline = textBaseline || "alphabetic";
    this.textColor = textColor || "black";
    this.strokeColor = strokeColor || "black";
    this.x = x;
    this.y = y - this.fontSize / 2;
    this.rotation = rotation; // Added rotation property
    this.isRotating = false;
    this.rotationHandle = { x: 0, y: 0 };
  }
  draw() {
    this.ctx.save(); // 保存当前画布状态
    this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    this.ctx.fillStyle = this.textColor;
    this.ctx.strokeStyle = this.strokeColor;
    this.ctx.textAlign = this.textAlign;
    this.ctx.textBaseline = this.textBaseline;
    const textMetrics = this.ctx.measureText(this.text);
    const textWidth = textMetrics.width;
    const textHeight = this.fontSize;
    // 移动到文本中心点
    const centerX = this.x + textWidth / 2;
    const centerY = this.y + textHeight / 2;

    // 应用旋转
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate((this.rotation * Math.PI) / 180);
    this.ctx.translate(-centerX, -centerY);
    this.ctx.fillText(this.text, this.x, this.y);
    this.ctx.restore(); // 恢复画布状态
  }
  onMouseDown(x, y) {
    if (this.isRotationHandle(x, y)) {
      this.isRotating = true;
    } else if (this.inTextArea(x, y)) {
      this.isDragging = true;
      this.dragStartX = x - this.x;
      this.dragStartY = y - this.y;
    }
  }
  onMouseMove(x, y) {
    if (this.isDragging) {
      this.x = x - this.dragStartX;
      this.y = y - this.dragStartY;
      this.emit("positionChanged", [
        { x: this.x, y: this.y + this.fontSize / 2 },
      ]);
    } else if (this.isRotating) {
      const centerX = this.x + this.getBoundingBox().width / 2;
      const centerY = this.y + this.getBoundingBox().height / 2;
      const startAngle = Math.atan2(
        this.rotationHandle.y - centerY,
        this.rotationHandle.x - centerX
      );
      const currentAngle = Math.atan2(y - centerY, x - centerX);
      let rotation = (currentAngle - startAngle) * (180 / Math.PI);

      // 将旋转角度限制在 0 到 360 度之间
      rotation = (rotation + 360) % 360;

      this.rotation = rotation;
      this.emit("rotationChanged", this.rotation);
    }
    this.updateCursorStyle(x, y);
  }
  updateCursorStyle(x, y) {
    if (Shape.isDrawing) {
      this.canvas.style.cursor = "crosshair";
    } else if (this.isRotationHandle(x, y)) {
      this.canvas.style.cursor = "ew-resize";
    } else if (this.isPointInside(x, y)) {
      this.canvas.style.cursor = "move";
    } else {
      this.canvas.style.cursor = "default";
    }
  }
  onMouseUp() {
    this.isDragging = false;
    this.isRotating = false;
  }
  inTextArea(x, y) {
    const { centerX, centerY } = this.getCenter();
    this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    const textMetrics = this.ctx.measureText(this.text);
    const textWidth = textMetrics.width;
    const textHeight = this.fontSize;

    // 定义文本框的四个角点
    const corners = [
      { x: -textWidth / 2, y: -textHeight / 2 },
      { x: textWidth / 2, y: -textHeight / 2 },
      { x: textWidth / 2, y: textHeight / 2 },
      { x: -textWidth / 2, y: textHeight / 2 },
    ];

    // 旋转这些角点并移动到正确的位置
    const rotatedCorners = corners.map((corner) => {
      const rotated = this.rotatePoint(corner.x, corner.y, 0, 0, this.rotation);
      return {
        x: rotated.x + centerX,
        y: rotated.y + centerY,
      };
    });

    // 检查点是否在旋转后的文本框内
    return this.pointInPolygon(x, y, rotatedCorners);
  }

  pointInPolygon(x, y, corners) {
    let inside = false;
    for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) {
      const xi = corners[i].x,
        yi = corners[i].y;
      const xj = corners[j].x,
        yj = corners[j].y;

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  isPointInside(x, y) {
    const inTextArea = this.inTextArea(x, y);
    const inRotationHandle = this.isRotationHandle(x, y);
    return inTextArea || inRotationHandle;
  }

  getBoundingBox() {
    this.ctx.font = `${this.fontSize}px Arial`;
    const textMetrics = this.ctx.measureText(this.text);
    const textWidth = textMetrics.width;
    const textHeight = this.fontSize; // 文本高度的近似值

    return {
      x: this.x,
      y: this.y - 2,
      width: textWidth + 4,
      height: textHeight + 4,
    };
  }
  setTextPosition(x, y) {
    this.x = x;
    this.y = y;
  }
  setBoundingStroke(strokeColor) {
    const bounding = this.getBoundingBox();
    this.ctx.beginPath();

    this.ctx.strokeStyle = strokeColor || "rgba(255,0,0,1)";
    this.ctx.strokeRect(
      bounding.x,
      bounding.y,
      bounding.width,
      bounding.height
    );
    this.ctx.closePath();
  }

  drawSelectionStyle() {
    const { x, y, width, height } = this.getBoundingBox();
    const { centerX, centerY } = this.getCenter();
    this.ctx.save();
    this.ctx.strokeStyle = "blue";
    this.ctx.lineWidth = 1;
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate((this.rotation * Math.PI) / 180);
    this.ctx.translate(-centerX, -centerY);
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(x, y, width, height);
    const rotationHandleDistance = 10;
    this.rotationHandle = {
      x: x + width / 2,
      y: y - rotationHandleDistance,
    };
    this.ctx.fillStyle = "blue";
    this.ctx.beginPath();
    this.ctx.fillRect(this.rotationHandle.x, this.rotationHandle.y, 5, 5);
    this.ctx.fill();

    // 绘制调整大小的手柄
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

    this.ctx.restore();
  }
  isRotationHandle(x, y) {
    const { centerX, centerY } = this.getCenter();
    const rotatedHandle = this.rotatePoint(
      this.rotationHandle.x,
      this.rotationHandle.y,
      centerX,
      centerY,
      this.rotation
    );
    const dx = x - rotatedHandle.x;
    const dy = y - rotatedHandle.y;
    return Math.sqrt(dx * dx + dy * dy) <= 5;
  }
  getCenter() {
    const { width, height } = this.getBoundingBox();
    return {
      centerX: this.x + width / 2,
      centerY: this.y + height / 2,
    };
  }
  rotatePoint(x, y, cx, cy, angle) {
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const nx = cos * (x - cx) - sin * (y - cy) + cx;
    const ny = sin * (x - cx) + cos * (y - cy) + cy;
    return { x: nx, y: ny };
  }
}
