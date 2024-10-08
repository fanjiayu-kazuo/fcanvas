### 说明文档

#### 引入

引入 dist 目录下的 fcanvas.umd.min 文件
将会挂在到 window.FCanvas 上面即可直接使用

在 esmodule.js 中引入

```javascript
import { FCanvas, FCanvasType } from "./dist/fcanvas.umd.min.js";
```

#### 初始化

```javascript
new FCanvas(options);
```

options:可以为字符串或者对象或是 dom 元素

**字符串:**

```javascript
new FCanvas("canvasId");
canvasId: canvas的id;
```

**对象:**

```javascript
new FCanvas({
  el: this.$refs.canvas,
});
```

可以配置的属性有:

| 属性         | 说明                              |
| ------------ | --------------------------------- |
| el           | dom 元素 （必填）                 |
| disabled     | 是否禁用（默认 false）            |
| optimizeView | 是否优化区域名称显示（默认 true） |
| width        | 宽度（默认 300）                  |
| height       | 高度（默认 300）                  |
| showTooltip  | 是否显示 tooltip（默认 true）     |

**dom 元素：**

```javascript
new FCanvas(document.getElementById("canvasId"));
```

#### 成员方法

#### 获取和设置属性的方法

| 画布方法                      | 说明                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------ |
| setWidth(width)               | 设置画布宽度                                                                   |
| setHeight(height)             | 设置画布高度                                                                   |
| setSize(width, height)        | 同时设置画布宽度和高度                                                         |
| setDataList(dataList)         | 设置数据列表，dataList 是一个数组，可以通过 getAllPoints 获取                  |
| setDisabled(flag)             | 设置是否禁用画布                                                               |
| setShowTooltip(flag)          | 设置是否显示 tooltip                                                           |
| setBackground(color)          | 设置背景可以是图片或者是 rgba\|rgb，图片则需要通过 require 引入                |
| getSize()                     | 获取画布的宽度和高度                                                           |
| getAllPoints()                | 获取所有绘制图形的点                                                           |
| getAllShapes()                | 获取所有图形                                                                   |
| getSelectedShape()            | 获取选中的图形                                                                 |
| getImage()                    | 输出图片                                                                       |
| getDisabled()                 | 获取是否禁用                                                                   |
| beginDraw(FCanvasType,option) | 开始绘制,type:绘制类型,option:绘制参数,[详解见 beginDraw 详解](#begindraw详解) |
| deleteArea(shape)             | 删除图形                                                                       |

注意：这些方法都是实例方法，需要在 FCanvas 实例上调用。例如：

```javascript
const canvas = new FCanvas("canvasId");
canvas.setStrokeColor("red");
```

| 图形方法 （仅针对图形） | 说明                        |
| ----------------------- | --------------------------- |
| setName(name)           | 设置图形名称                |
| setStrokeColor(color)   | 设置描边颜色（rgb 或 rgba） |
| setFillColor(color)     | 设置填充颜色（rgb 或 rgba） |
| setAreaNameColor(color) | 设置区域名称颜色            |
| setAreaNameSize(size)   | 设置区域名称大小            |
| setStrokeWidth          | 设置描边宽度                |

注意：这些都是针对图形的方法，需要在获取到图形后调用。例如：

```javascript
const shape = canvas.getSelectedShape();
shape.setStrokeColor("red");
```

#### <a id="begindraw详解">beginDraw 详解</a>

option 是绘制参数，有以下几种：

| 参数          | 说明                   |
| ------------- | ---------------------- |
| fillColor     | 填充颜色               |
| strokeColor   | 描边颜色               |
| lineWidth     | 描边宽度               |
| namefontSize  | 名称字体大小(针对图形) |
| namefontColor | 名称字体颜色(针对图形) |
| fontSize      | 字体大小(针对文本)     |
| textColor     | 字体颜色(针对文本)     |
| fontFamily    | 字体类型(针对文本)     |
| textAlign     | 文本对齐方式(针对文本) |

```javascript
this.fctx.beginDraw(FCanvasType.Polygon, {
  fillColor: "rgba(0,0,0,0)",
  strokeColor: "rgba(255,0,255,1)",
  lineWidth: 1,
  namefontSize: 61,
  nameTextColor: "rgba(0,0,255,1)",
});
```

FCanvasType 是绘制类型，有以下几种：

| 类型    | 说明   |
| ------- | ------ |
| RECT    | 矩形   |
| CIRCLE  | 圆形   |
| POLYGON | 多边形 |
| LINE    | 直线   |
| TEXT    | 文本   |
