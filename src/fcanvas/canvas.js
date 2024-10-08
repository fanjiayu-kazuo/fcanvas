// 引入图形
import { FCanvasType } from "./baseType/DrawType.js";
import { Polygon, Line, Circle, Rect, Text } from "./graphicalType/index.js";
import { Shape } from "./baseClass/shape";
import { TextHandler } from "./handlers/TextHandler.js";
import { Texture } from "./baseClass/texture.js";
import EventEmitter from "events";

class FCanvas {
  constructor(option) {
    this.initCanvas(option);
    this.initProperties();
    this.initEventListeners();

    this.maxZIndex = 0;
    this.events = new EventEmitter();
    this.textureCache = new Map();
  }

  // 初始化方法
  initCanvas(option) {
    // debugger
    if (Object.prototype.toString.call(option) === "[object String]") {
      this.canvas = document.getElementById(option);
    } else if (Object.prototype.toString.call(option) === "[object Object]") {
      if (Object.prototype.toString.call(option.el) === "[object String]") {
        this.canvas = document.getElementById(option.el);
      } else {
        this.canvas = option.el;
      }
    } else if (
      Object.prototype.toString.call(option) === "[object HTMLCanvasElement]"
    ) {
      this.canvas = option;
    } else {
      throw new Error("请传入正确的参数");
    }
    this.ctx = this.canvas.getContext("2d");
    if (!this.canvas || !this.ctx) {
      throw new Error("初始化失败");
    }
    this.disabled = option.disabled || false;
    this.optimizeView = option.optimizeView || false;
    this.canvas.width = option.width || 300;
    this.canvas.height = option.height || 300;
    this.showTooltip = option.showTooltip || true;
  }

  initProperties() {
    this.startX = 0;
    this.startY = 0;
    this.endX = 0;
    this.endY = 0;
    this.allPoints = [];
    this.currentPoints = [];
    this.shapes = [];
    this.isdraw = false;
    this.isBegin = false;
    this.currentArea = null;
    this.strokeColor = null;
    this.fillColor = null;
    this.drawType = FCanvasType.Polygon;
    this.selectedShape = null;
  }

  initEventListeners() {
    const events = ["mousedown", "mousemove", "dblclick", "mouseup"];
    events.forEach((event) => {
      this.canvas.addEventListener(event, this[event].bind(this));
    });
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  setFillColor(color) {
    this.strokeColor = color;
  }
  setDisabled(flag) {
    this.disabled = flag;
  }
  setFillColor(color) {
    this.fillColor = color;
  }

  setWidth(width) {
    this.canvas.width = width;
  }

  setHeight(height) {
    this.canvas.height = height;
  }

  setSize(width, height) {
    if (width) this.canvas.width = width;
    if (height) this.canvas.height = height;
  }

  getSize() {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }
  getAllPoints() {
    return this.allPoints;
  }
  getAllShapes() {
    return this.shapes;
  }
  getSelectedShape() {
    return this.selectedShape;
  }
  getImage() {
    return this.canvas.toDataURL();
  }
  getDisabled() {
    return this.disabled;
  }
  setBackground(background) {
    if (typeof background === "string") {
      if (background.startsWith("#") || background.startsWith("rgb")) {
        // 设置背景颜色
        this.canvas.style.backgroundColor = background;
        this.backgroundColor = background;
      } else {
        // 设置背景图片
        const img = new Image();
        img.onload = () => {
          this.backgroundImage = img;
          this.drawBackground();
          this.drawAllPoints(); // 重新绘制所有图形
        };
        img.src = background;
      }
    } else if (background === null) {
      // 清除背景设置
      this.backgroundColor = null;
      this.backgroundImage = null;
      this.canvas.style.backgroundColor = "";
      this.drawAllPoints(); // 重新绘制所有图形
    } else {
      console.error(
        "背景参数必须是颜色值或图片URL的字符串，或者null以清除背景"
      );
    }
  }
  showAreaName(flag = false) {
    Shape.showAreaName(flag);
    this.clearCanvas();
    this.drawAllPoints();
  }
  // 绘图控制方法
  beginDraw(type, option = {}) {
    // debugger
    if (new FCanvasType().isDrawType(type)) {
      Shape.setDrawingState(true);
      this.drawType = type;
      this.isdraw = true;
      this.isBegin = true;
      this.selectArea = false;
      this.strokeColor = option.strokeColor || "#000";
      this.fillColor = option.fillColor || "#000";
      this.lineWidth = option.lineWidth || 1;
      this.ctx.lineWidth = option.lineWidth || 1;
      this.canvas.style.cursor = "crosshair";

      // 更新文字相关的属性
      this.fontSize = option.fontSize || 16;
      this.textColor = option.textColor || "#000";
      this.fontFamily = option.fontFamily || "Arial";
      this.textAlign = option.textAlign || "left";
      this.textBaseline = option.textBaseline || "top";
      this.namefontSize = option.namefontSize || 16;
      this.nameTextColor = option.nameTextColor || "#000";
    } else {
      throw new Error("请传入正确的参数");
    }
  }

  stopDraw() {
    Shape.setDrawingState(false);
    this.isdraw = false;
    this.isBegin = false;
    this.selectArea = false;
    this.canvas.style.cursor = "default";
  }

  cancelDraw() {
    this.isBegin = false;
    this.text = "";
    this.currentPoints = [];
    this.clearCanvas();
    this.drawAllPoints();
  }

  // 数据操作方法
  setDataList(dataList) {
    if (!Array.isArray(dataList)) {
      throw new Error("请传入正确的参数");
    }
    this.allPoints = dataList;
    try {
      this.allPoints.forEach((areas) => {
        switch (areas.drawType) {
          case FCanvasType.Polygon:
            this.drawPolygon(areas);
            break;
          case FCanvasType.Rect:
            this.drawRectangle(areas);
            break;
          case FCanvasType.Circle:
            this.drawCircle(areas);
            break;
          case FCanvasType.Line:
            this.drawLine(areas);
            break;
          case FCanvasType.Text:
            this.drawText(areas);
            break;
          default:
            throw new Error("绘制失败");
        }
      });
      this.drawAllPoints();
    } catch (error) {
      console.error(
        '传入的参数有误格式类型为：[{uuid:"xxx",name":"xxx","list":[{"x":0,"y":0},{"x":0,"y":0}]}]'
      );
    }
  }

  // 绘图方法
  drawBackground() {
    if (this.backgroundColor) {
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (this.backgroundImage) {
      this.ctx.drawImage(
        this.backgroundImage,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
    }
    // 如果没有设置背景，则不做任何操作，保持画布原始状态
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
  }

  drawAllPoints() {
    try {
      this.sortShapes();
      Promise.all(this.shapes.map((item) => this.applyTexture(item))).then(
        () => {
          this.shapes.forEach((item) => {
            if (this.optimizeView) {
              this.ctx.save();
              this.ctx.globalAlpha = 0.7;
              this.ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
              this.ctx.shadowBlur = 5;
              this.ctx.shadowOffsetX = 2;
              this.ctx.shadowOffsetY = 2;
              this.ctx.restore();
            }
            item.draw();
            if (this.optimizeView) {
              this.ctx.restore();
            }
            this.setupEventListeners(item);
          });
          if (this.selectedShape) {
            this.selectedShape.drawSelectionStyle();
          }
        }
      );
    } catch (error) {
      console.error(error);
    }
  }

  drawPolygon(areas) {
    const polygon = new Polygon(this.canvas, this.ctx, areas.list, {
      fillColor: areas.fillColor,
      strokeColor: areas.strokeColor,
      lineWidth: areas.lineWidth,
      uuid: areas.uuid,
      name: areas.name,
      lineWidth: areas.lineWidth,
      areaNameStyle: {
        fontSize: areas.areaNameStyle.namefontSize,
        textColor: areas.areaNameStyle.nameTextColor,
      },
    });
    polygon.zIndex = ++this.maxZIndex;
    this.shapes.push(polygon);
  }

  drawRectangle(areas) {
    const rect = new Rect(
      this.canvas,
      this.ctx,
      areas.list[0].x,
      areas.list[0].y,
      areas.list[1].x,
      areas.list[1].y,
      {
        fillColor: areas.fillColor,
        strokeColor: areas.strokeColor,
        lineWidth: areas.lineWidth,
        uuid: areas.uuid,
        name: areas.name,
        lineWidth: areas.lineWidth,
        areaNameStyle: {
          fontSize: areas.areaNameStyle.namefontSize,
          textColor: areas.areaNameStyle.nameTextColor,
        },
      }
    );
    rect.zIndex = ++this.maxZIndex;
    this.shapes.push(rect);
  }

  drawCircle(areas) {
    const circle = new Circle(
      this.canvas,
      this.ctx,
      areas.list[0].x,
      areas.list[0].y,
      areas.list[1].x,
      areas.list[1].y,
      {
        fillColor: areas.fillColor,
        strokeColor: areas.strokeColor,
        lineWidth: areas.lineWidth,
        uuid: areas.uuid,
        lineWidth: areas.lineWidth,
        areaNameStyle: {
          fontSize: areas.areaNameStyle.namefontSize,
          textColor: areas.areaNameStyle.nameTextColor,
        },
      }
    );
    circle.zIndex = ++this.maxZIndex;
    this.shapes.push(circle);
  }

  drawLine(areas) {
    const line = new Line(
      this.canvas,
      this.ctx,
      areas.list[0].x,
      areas.list[0].y,
      areas.list[1].x,
      areas.list[1].y,
      areas.strokeColor,
      areas.lineWidth,
      areas.name,
      areas.uuid
    );
    line.zIndex = ++this.maxZIndex;
    this.shapes.push(line);
  }

  drawText(areas) {
    const text = new Text(
      this.canvas,
      this.ctx,
      areas.list[0].x,
      areas.list[0].y,
      {
        text: areas.text || this.text,
        fontSize: areas.fontSize || this.fontSize,
        textColor: areas.textColor || this.textColor,
        strokeColor: areas.strokeColor || this.strokeColor,
        uuid: areas.uuid,
        fontFamily: areas.fontFamily || this.fontFamily,
        textAlign: areas.textAlign || this.textAlign,
        textBaseline: areas.textBaseline || this.textBaseline,
        rotation: areas.rotation || 0,
      }
    );
    text.zIndex = ++this.maxZIndex;
    this.shapes.push(text);
  }
  drawCurrentLine() {
    if (!this.currentPoints[0]) return;
    this.ctx.moveTo(this.currentPoints[0].x, this.currentPoints[0].y);
    this.ctx.beginPath();
    this.currentPoints.forEach((point) => {
      this.ctx.lineTo(point.x, point.y);
    });
  }


  drawTextPreview() {
    this.textHandler.drawTextPreview(
      this.ctx,
      this.currentPoints[0].x,
      this.currentPoints[0].y,
      this.text,
      this.fontSize,
      this.fillColor,
      this.strokeColor
    );
  }

  // 事件处理方法
  on(eventType, callback) {
    this.events.on(eventType, callback);
  }

  mousedown(e) {
    const { offsetX, offsetY } = e;

    if (this.isdraw) {
      if (this.disabled) return;
      this.isBegin = true;
      this.startX = offsetX;
      this.startY = offsetY;
      this.ctx.beginPath();
      this.ctx.moveTo(this.startX, this.startY);

      this.currentPoints.push({ x: this.startX, y: this.startY });
      if (this.drawType === FCanvasType.Text) {
        this.promptTextInput(offsetX, offsetY);
      } else if (
        this.currentPoints.length === 2 &&
        this.drawType !== FCanvasType.Polygon
      ) {
        this.dblclick();
      }

      return;
    }

    this.selectedShape = null;
    this.clearCanvas();
    const sortedShapes = [...this.shapes].sort((a, b) => b.zIndex - a.zIndex);
    for (const shape of sortedShapes) {
      if (shape.isPointInside(offsetX, offsetY)) {
        if (!this.disabled) {
          this.selectedShape = shape;
          shape.drawSelectionStyle();
          shape.onMouseDown(offsetX, offsetY);
        }
        this.events.emit("shapeClick", shape);
        this.bringSelectedShapeToFront();
        break;
      }
    }
    if (!this.selectedShape) {
      this.drawAllPoints();
    }
  }

  mousemove(e) {
    if (this.disableClear) {
      // 如果在文本输入模式，不执行任何操作
      return;
    }
    if (this.isdraw && this.isBegin && this.currentPoints.length > 0) {
      this.endX = e.offsetX;
      this.endY = e.offsetY;
      this.ctx.strokeStyle = this.strokeColor;
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.fillStyle = this.fillColor;

      this.clearCanvas();

      const drawPreviewFunctions = {
        [FCanvasType.Polygon]: Polygon.drawPreview,
        [FCanvasType.Rect]: Rect.drawPreview,
        [FCanvasType.Circle]: Circle.drawPreview,
        [FCanvasType.Line]: Line.drawPreview,
        [FCanvasType.Text]: this.drawTextPreview.bind(this),
      };

      const drawPreviewFunction = drawPreviewFunctions[this.drawType];
      if (drawPreviewFunction) {
        drawPreviewFunction.call(
          this,
          this.ctx,
          this.startX,
          this.startY,
          this.endX,
          this.endY,
          this.currentPoints
        );
      } else {
        console.error("Invalid draw type");
      }

      this.drawAllPoints();
      if(this.showTooltip){
        this.drawTooltip(e.offsetX, e.offsetY);
      }
    } else if (this.selectedShape) {
      const { left, top } = this.canvas.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      this.clearCanvas();
      this.drawAllPoints();
      this.selectedShape.onMouseMove(x, y);
      this.selectedShape.drawSelectionStyle();
    }
    if (this.disabled) {
      // console.log(this.shapes);
      this.canvas.style.cursor = "default";
      this.shapes.forEach((shape) => {
        if (shape.isPointInside(e.offsetX, e.offsetY)) {
          this.canvas.style.cursor = "pointer";
        }
      });
    }
  }

  mouseup() {
    if (this.disabled) return;
    if (!this.isdraw && this.selectedShape) {
      this.selectedShape.onMouseUp();
    }
  }

  dblclick() {
    if (this.disabled) return;
    this.isBegin = false;
    const name = "1";
    if (this.drawType === FCanvasType.Polygon) {
      this.currentPoints.pop();
    }
    if (!this.isValidShape(this.currentPoints, this.drawType)) {
      console.warn("Invalid shape. Drawing cancelled.");
      this.clearCanvas();
      this.drawAllPoints();
      this.currentPoints = [];
      return;
    }
    const areas = {
      uuid: this.generateUUID(),
      strokeColor: this.strokeColor,
      fillColor: this.fillColor,
      lineWidth: this.lineWidth,
      drawType: this.drawType,
      name,
      list: this.currentPoints,
      texture: this.texture,
      zIndex: ++this.maxZIndex,
      areaNameStyle: {
        namefontSize: this.namefontSize,
        nameTextColor: this.nameTextColor,
      },
    };
    if (this.drawType === FCanvasType.Text) {
      areas.text = this.text || "";
      areas.fontSize = this.fontSize;
      areas.textColor = this.textColor;
      areas.fontFamily = this.fontFamily;
      areas.textAlign = this.textAlign;
      areas.textBaseline = this.textBaseline;
      delete areas.name;
    }
    this.allPoints.push(areas);
    const drawFunctions = {
      [FCanvasType.Polygon]: this.drawPolygon,
      [FCanvasType.Rect]: this.drawRectangle,
      [FCanvasType.Circle]: this.drawCircle,
      [FCanvasType.Line]: this.drawLine,
      [FCanvasType.Text]: this.drawText,
    };

    const drawFunction = drawFunctions[this.drawType];
    if (drawFunction) {
      drawFunction.call(this, areas);
    } else {
      throw new Error("Invalid draw type");
    }

    // localStorage.setItem("allPoints", JSON.stringify(this.allPoints));

    this.currentPoints = [];
    this.ctx.closePath();
    this.clearCanvas();
    this.drawAllPoints();
  }
  drawTooltip(x, y) {
    const message = this.drawType === FCanvasType.Polygon ? '双击结束绘制' : '单击结束绘制';
    
    // 设置文本样式
    this.ctx.font = '12px Arial';
    this.ctx.fillStyle = 'black';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
  
    // 计算文本宽度
    const textWidth = this.ctx.measureText(message).width;
    
    // 设置背景和边框
    const padding = 5;
    const boxWidth = textWidth + padding * 2;
    const boxHeight = 20;
    
    // 绘制背景
    this.ctx.fillStyle = 'rgba(250, 250, 250, 0.7)';
    this.ctx.fillRect(x + 10, y - 25, boxWidth, boxHeight);
    
    // 绘制边框
    this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.7)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x + 10, y - 25, boxWidth, boxHeight);
    
    // 绘制文本
    this.ctx.fillStyle = 'black';
    this.ctx.fillText(message, x + 10 + padding, y - 22);
  }
  
  handleKeyDown(e) {
    if (e.key === "Escape") {
      this.stopDraw();
      this.clearCanvas();
      this.drawAllPoints();
      this.currentPoints = [];
    }
  }

  // 图形操作方法
  selectArea() {
    this.isdraw = false;
    this.isBegin = false;
    this.selectArea = true;
    this.canvas.style.cursor = "default";
  }

  deleteArea(currentArea) {
    this.allPoints = this.allPoints.filter(
      (item) => item.uuid !== currentArea.uuid
    );
    this.shapes = this.shapes.filter((item) => item.uuid !== currentArea.uuid);
    this.selectedShape = null;
    // localStorage.setItem("allPoints", JSON.stringify(this.allPoints));
    this.clearCanvas();
    this.drawAllPoints();
  }

  bringSelectedShapeToFront() {
    if (this.selectedShape) {
      this.bringShapeToFront(this.selectedShape);
      this.clearCanvas();
      this.drawAllPoints();
    }
  }

  sendSelectedShapeToBack() {
    if (this.selectedShape) {
      this.sendShapeToBack(this.selectedShape);
      this.clearCanvas();
      this.drawAllPoints();
    }
  }

  bringShapeToFront(shape) {
    this.maxZIndex++;
    shape.zIndex = this.maxZIndex;
    this.sortShapes();
  }

  sendShapeToBack(shape) {
    this.shapes.forEach((s) => s.zIndex++);
    shape.zIndex = 0;
    this.maxZIndex++;
    this.sortShapes();
  }

  setShapeZIndex(shape, zIndex) {
    shape.zIndex = zIndex;
    this.maxZIndex = Math.max(this.maxZIndex, zIndex);
    this.sortShapes();
  }

  sortShapes() {
    this.shapes.sort((a, b) => a.zIndex - b.zIndex);
  }

  // 边界框相关方法
  openBounding() {
    this.allPoints.forEach((areas) => {
      this.setBoundingStroke(areas.list);
    });
  }

  closeBounding() {
    this.clearCanvas();
    this.drawAllPoints();
  }

  hideBounding() {
    this.clearCanvas();
    this.drawAllPoints();
  }

  showBounding(option) {
    this.shapes.forEach((shape) => {
      if (shape.setBoundingStroke) {
        shape.setBoundingStroke(option.strokeColor);
      }
    });
  }

  // 辅助方法
  promptTextInput(x, y) {
    this.textHandler = new TextHandler(this.canvas, this.ctx);
    this.textHandler.setTextInputModeChangeCallback((isInputMode) => {
      // 在这里处理文本输入模式的变化
      // 例如，禁用或启用画布清除功能
      this.disableClear = isInputMode;
    });
    this.textHandler.promptTextInput(
      x,
      y,

      (text) => {
        this.createText(x, y, text);
      },
      () => this.cancelDraw(),
      this.drawAllPoints.bind(this),
      {
        fontSize: this.fontSize,
        fontFamily: this.fontFamily,
        textAlign: this.textAlign,
        textBaseline: this.textBaseline,
        textColor: this.textColor,
        strokeColor: this.strokeColor,
      }
    );
  }
  createText(x, y, text) {
    const areas = {
      uuid: this.generateUUID(),
      strokeColor: this.strokeColor,
      fillColor: this.fillColor,
      lineWidth: this.lineWidth,
      drawType: FCanvasType.Text,
      list: [{ x, y }],
      text: text,
      fontSize: this.fontSize,
      textColor: this.textColor,
      fontFamily: this.fontFamily,
      textAlign: this.textAlign,
      textBaseline: this.textBaseline,
      zIndex: ++this.maxZIndex,
    };

    this.allPoints.push(areas);
    this.drawText(areas);

    // localStorage.setItem("allPoints", JSON.stringify(this.allPoints));

    this.currentPoints = [];
    this.ctx.closePath();
    this.clearCanvas();
    this.drawAllPoints();

    // 重置绘图状态
    this.isBegin = false;
    this.text = "";
  }
  isValidShape(currentPoints, type) {
    switch (type) {
      case FCanvasType.Polygon:
        return currentPoints.length >= 3;
      case FCanvasType.Rect:
      case FCanvasType.Circle:
      case FCanvasType.Line:
        return currentPoints.length === 2;
      case FCanvasType.Text:
        return currentPoints.length === 1;
      default:
        throw new Error("Invalid shape type");
    }
  }

  generateUUID() {
    let d = new Date().getTime();
    let d2 = (performance && performance.now && performance.now() * 1000) || 0;
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      let r = Math.random() * 16;
      if (d > 0) {
        r = (d + r) % 16 | 0;
        d = Math.floor(d / 16);
      } else {
        r = (d2 + r) % 16 | 0;
        d2 = Math.floor(d2 / 16);
      }
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
  // 纹理相关方法
  applyTexture(item) {
    return new Promise((resolve) => {
      // item.picUrl = './texture.png';

      if (item.picUrl) {
        if (!this.textureCache.has(item.picUrl)) {
          const texture = new Texture(require(item.picUrl + ""), {
            smooth: true,
            scale: "none",
          });
          this.textureCache.set(item.picUrl, texture);
        }
        const texture = this.textureCache.get(item.picUrl);
        texture.applyTo(this.ctx, item).then(() => {
          if (
            item.type === FCanvasType.Circle ||
            item.type === FCanvasType.Rect ||
            item.type === FCanvasType.Polygon
          ) {
            item.drawAreaName();
          }

          resolve();
        });
      } else {
        if (
          item.type === FCanvasType.Circle ||
          item.type === FCanvasType.Rect ||
          item.type === FCanvasType.Polygon
        ) {
          item.drawAreaName();
        }
        resolve();
      }
    });
  }

  setupEventListeners(item) {
    if (!item.hasEventListeners) {
      item.on("positionChanged", (shape) => {
        this.events.emit("positionChanged", shape, "positionChanged");
      });
      item.on("nameChange", (shape) => {
        this.events.emit("nameChange", shape, "nameChange");
        this.redrawShape(shape);
      });
      item.on("redraw", (shape) => {
        this.redrawShape(shape);
      });
      item.on("rotationChanged", (shape) => {
        this.allPoints.forEach((targetItem) => {
          if (targetItem.uuid === shape.uuid) {
            targetItem.rotation = shape.rotation;
            // window.localStorage.setItem(
            //   "allPoints",
            //   JSON.stringify(this.allPoints)
            // );
          }
        });
        this.events.emit("rotationChanged", shape, "rotationChanged");
      });
      item.hasEventListeners = true;
    }
  }
  // 添加 redrawShape 方法
  redrawShape(shape) {
    this.clearCanvas();
    this.drawAllPoints();
    // if (this.selectedShape === shape) {
    //   shape.drawSelectionStyle();
    // }
  }
}
export {
  FCanvasType,
  FCanvas,
};

// 同时设置为全局变量
if (typeof window !== 'undefined') {
  window.FCanvas = FCanvas;
  window.FCanvasType = FCanvasType;
}