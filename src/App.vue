<template>
  <div id="app">
    <!-- <img width="1014" height="609" src="./地图.png" style="position: relative; opacity: 0" /> -->
    <canvas ref="canvas"></canvas>
    <div>
      <button @click="makeArea">绘制多边形</button>
      <button @click="drawRect">绘制矩形</button>
      <button @click="drawRadio">绘制圆形</button>
      <button @click="drawLine">绘制线</button>
      <button @click="drawText">写文字</button>
      <br />
      <button @click="cancelMakeArea">取消绘制</button>
      <!-- <button @click="selectAreaHandler">选择区域</button> -->
      <button @click="openBounding">显示边框区域</button>
      <button @click="closeBounding">关闭边框区域</button>
      <button @click="changeNameShow">设置名字显示隐藏</button>
      <br />
      <button :disabled="!currentShape" @click="deleteArea">
        删除所选区域
      </button>
      <button  @click="getAllPoints">
        获取所有点
      </button>
      <div style="display: flex">
        <div>
          边框颜色：
          <color-picker v-model="strokeColor" @input="updatestrokeColor" />
        </div>
        <div style="margin-left: 10px">
          填充颜色：
          <color-picker v-model="fillColor" @input="updatefillColor" />
        </div>
        <div style="margin-left: 10px">
          名字颜色
          <color-picker v-model="nameColor" @input="updateNameColor" />
        </div>
        <div style="margin-left: 10px; margin-top: 10px">
          <div>
            描边宽度：
            <input type="number" v-model="lineWidth" @input="updateLineWidth" />
          </div>
          <div>
            设置区域名字
            <input
              type="text"
              v-model="currentShape.name"
              @input="updateAreaName"
            />
          </div>
          <div>
            设置区域名字大小
            <input
              type="number"
              v-model="currentShape.areaNameSize"
              @input="updateAreaNameSize"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { FCanvas, FCanvasType } from "./fcanvas/canvas.js";
import { Chrome } from "vue-color";
export default {
  name: "App",
  components: {
    "color-picker": Chrome,
  },
  data() {
    return {
      fctx: null,
      strokeColor: {
        rgba: { r: 255, g: 0, b: 0, a: 1 },
      },
      fillColor: {
        rgba: { r: 255, g: 0, b: 0, a: 1 },
      },
      nameColor: {
        rgba: { r: 255, g: 255, b: 0, a: 1 },
      },
      lineWidth: 1,
      currentShape: {},
      showName: true,
    };
  },
  mounted() {
    this.fctx = new FCanvas({
      el: this.$refs.canvas,
      disabled: false,
      optimizeView: true,
    });
    // this.fctx.showAreaName(true)

    this.fctx.setSize(1014, 609);
    // this.fctx.setDataList(JSON.parse(window.localStorage.getItem("allPoints")));
    // 监听点击事件
    this.fctx.on("shapeClick", (shape) => {
      this.currentShape = shape;
      console.log(shape);
      // this.nameColor
    });
    // 监听图形移动事件
    this.fctx.on("positionChanged", (a, b) => {
      // console.log(a,b);
    });
    // 监听图形名称改变事件
    this.fctx.on("nameChange", (shape) => {});
    //设备背景
    // this.fctx.setBackground(require('@/assets/texture.png'))
  },
  computed: {
    fillColorString() {
      return `rgba(${this.fillColor.rgba.r}, ${this.fillColor.rgba.g}, ${this.fillColor.rgba.b}, ${this.fillColor.rgba.a})`;
    },
    strokeColorString() {
      return `rgba(${this.strokeColor.rgba.r}, ${this.strokeColor.rgba.g}, ${this.strokeColor.rgba.b}, ${this.strokeColor.rgba.a})`;
    },
    nameColorString() {
      return `rgba(${this.nameColor.rgba.r}, ${this.nameColor.rgba.g}, ${this.nameColor.rgba.b}, ${this.nameColor.rgba.a})`;
    },
  },
  methods: {
    updatestrokeColor(value) {
      this.strokeColor = value;
      this.fctx.getSelectedShape()?.setStrokeColor(this.strokeColorString);
    },
    updatefillColor(value) {
      this.fillColor = value;
      this.fctx.getSelectedShape()?.setFillColor(this.fillColorString);
    },
    updateNameColor(value) {
      this.nameColor = value;
      this.fctx.getSelectedShape()?.setAreaNameColor(this.nameColorString);
    },
    updateAreaName(a) {
      this.fctx.getSelectedShape()?.setName(this.currentShape.name);
    },
    updateAreaNameSize(e) {
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
      // console.log(e.target.value);

      this.fctx.getSelectedShape()?.setAreaNameSize(e.target.value);
    },
    updateLineWidth(e) {
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
      this.fctx.getSelectedShape()?.setStrokeWidth(e.target.value);
    },
    changeNameShow() {
      this.fctx.showAreaName(this.showName);
      this.showName = !this.showName;
    },
    makeArea() {
      this.fctx.beginDraw(FCanvasType.Polygon, {
        fillColor: this.fillColorString,
        strokeColor: this.strokeColorString,
        lineWidth: this.lineWidth,
        namefontSize: 61,
        nameTextColor: "rgba(0,0,255,1)",
      });
    },
    drawRect() {
      this.fctx.beginDraw(FCanvasType.Rect, {
        fillColor: this.fillColorString,
        strokeColor: this.strokeColorString,
        lineWidth: this.lineWidth,
      });
    },
    drawRadio() {
      this.fctx.beginDraw(FCanvasType.Circle, {
        fillColor: this.fillColorString,
        strokeColor: this.strokeColorString,
        lineWidth: this.lineWidth,
      });
    },
    drawLine() {
      this.fctx.beginDraw(FCanvasType.Line, {
        fillColor: this.fillColorString,
        strokeColor: this.strokeColorString,
        lineWidth: this.lineWidth,
      });
    },
    drawText() {
      this.fctx.beginDraw(FCanvasType.Text, {
        fontSize: 16,
        textColor: "red",
      });
    },

    cancelMakeArea() {
      this.fctx.stopDraw();
    },
    selectAreaHandler() {},
    openBounding() {
      this.fctx.showBounding({
        strokeColor: "rgba(255, 0, 0, 1)",
      });
    },
    closeBounding() {
      this.fctx.hideBounding();
    },
    deleteArea() {
      this.fctx.deleteArea(this.currentShape);
    },
    getAllPoints() {
      console.log(this.fctx.getAllPoints());
      window.localStorage.setItem("allPoints", JSON.stringify(this.fctx.getAllPoints()))
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
