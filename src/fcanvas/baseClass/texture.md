# Texture 类使用文档

`Texture` 类用于处理图像纹理，并将其应用到 HTML5 Canvas 上的形状。以下是该类的详细使用说明。

## 构造函数

### `new Texture(imageSource, options = {}, basePath = document.currentScript.src)`

- **参数:**
  - `imageSource` (string): 图像的源，可以是 URL、数据 URI 或相对路径。
  - `options` (object, 可选): 配置选项，支持以下属性：
    - `repeat` (string): 纹理重复方式，默认为 `'no-repeat'`。可选值：`'repeat'`。
    - `scale` (string): 纹理缩放方式，默认为 `'cover'`。可选值：`'cover'`, `'contain'`,`'none'`。
    - `smooth` (boolean): 是否启用图像平滑，默认为 `true`。
  - `basePath` (string, 可选): 基础路径，默认为当前脚本的路径。

## 方法



### `async applyTo(context, shape)`

- **参数:**

  - `context` (CanvasRenderingContext2D): Canvas 的绘图上下文。
  - `shape` (object): 形状对象，必须实现 `getBoundingBox` 和 `clip` 方法。

- **描述:**
  - 将纹理应用到指定的形状上。

### `drawScaledImage(context, x, y, width, height)`

- **参数:**

  - `context` (CanvasRenderingContext2D): Canvas 的绘图上下文。
  - `x` (number): 目标位置的 x 坐标。
  - `y` (number): 目标位置的 y 坐标。
  - `width` (number): 目标宽度。
  - `height` (number): 目标高度。

- **描述:**
  - 根据配置选项缩放并绘制图像。

### `static preload(textures)`

- **参数:**

  - `textures` (Texture[]): 需要预加载的纹理数组。

- **返回值:**
  - (Promise): 返回一个 Promise，当所有纹理加载完成时解析。

## 示例

```javascript
import { Texture } from "./path/to/texture.js";
// 创建一个新的纹理对象
const texture = new Texture("path/to/image.png", {
  repeat: "no-repeat",
  scale: "cover",
  smooth: true,
});
// 获取 Canvas 上下文
const canvas = document.getElementById("myCanvas");
const context = canvas.getContext("2d");
// 定义一个形状对象
const rect =  new Rect()
// 将纹理应用到形状上
texture
  .applyTo(context, rect)
  .then(() => {
    console.log("纹理应用成功");
  })
  .catch((error) => {
    console.error("纹理应用失败", error);
  });
```

## 注意事项

- 确保图像源是有效的 URL 或数据 URI。
- 形状对象必须实现 `getBoundingBox` 和 `clip` 方法。
- 在调用 `applyTo` 方法之前，确保 Canvas 上下文和形状对象已正确初始化。
