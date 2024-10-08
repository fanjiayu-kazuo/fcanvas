import EventEmitter from "events";
export class Shape {
  static isDrawing = false;

  static setDrawingState(isDrawing) {
    Shape.isDrawing = isDrawing;
  }
  static showAreaName(flag) {
    Shape.showName = flag;
  }
  constructor(ctx, options = {}) {
    this.ctx = ctx;
    this.fillColor = options.fillColor || "rgba(0, 0, 0, 0.1)";
    this.strokeColor = options.strokeColor || "rgba(0, 0, 0, 1)";
    this.lineWidth = options.lineWidth || 1;
    this.name = options.name || "shape";
    this.onClick = null;
    this.onHover = null;
    this.canvas = options.canvas;
    this.uuid = options.uuid || Math.random().toString(36).substr(2, 9);
    this.events = new EventEmitter();
  }

  draw() {
    // 由子类实现
    throw new Error("draw method must be implemented by subclass");
  }
  emit(eventName, ...args) {
    this.events.emit(eventName, this, ...args);
  }
  once(eventName, listener) {
    this.events.once(eventName, listener);
  }
  off(eventName, listener) {
    this.events.off(eventName, listener);
  }
  on(eventName, listener) {
    this.events.on(eventName, listener);
  }
  isPointInside(x, y) {
    // 由子类实现
    throw new Error("isPointInside method must be implemented by subclass");
  }
 
  setOnClick(callback) {
    callback();
  }
  setName(name) {
    this.name = name;
    this.events.emit("nameChange", this);
  }
  setOnHover(callback) {
    this.onHover = callback;
  }

  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setFillColor(color) {
    this.fillColor = color;
    this.emit("redraw",this);
  }

  setStrokeColor(color) {
    this.strokeColor = color;
    this.emit("redraw",this);
  }

  setStrokeWidth(width) {
    
    this.lineWidth = width;
    this.emit("redraw",this);
  }
  clip(context) {
    throw new Error("clip() must be implemented by subclasses");
  }
  handleClick(x, y, callback) {
    if (this.isPointInside(x, y)) {
      callback(this);
    }
  }
  drawSelectionStyle() {
    const { x, y, width, height } = this.getBoundingBox();
    this.ctx.save();
    this.ctx.strokeStyle = "blue";
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(x, y, width, height);

    // Draw resize handles
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
  move(x, y) {
    throw new Error("draw method must be implemented by subclass");
  }
}
