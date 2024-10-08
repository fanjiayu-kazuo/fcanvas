export class TextHandler {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.text = "";
    this.isTextInputMode = false;
    this.cursorVisible = true;
    this.cursorBlinkInterval = 500;
    this.onTextInputModeChange = null;
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCtx = this.offscreenCanvas.getContext("2d");
    this.x = 0;
    this.y = 0;
    this.fillColor = "black";
    this.strokeColor = "black";
    this.generateUniqueId = () => {
      return "id_" + Math.random().toString(36).substr(2, 9);
    };
    this.isFinishing = false;
    this.id = this.generateUniqueId();
  }

  setTextInputModeChangeCallback(callback) {
    this.onTextInputModeChange = callback;
  }

  promptTextInput(x, y, onFinish, onCancel, drawAllPoints, option) {
    this.text = "";
    this.isTextInputMode = true;

    this.fontSize = option.fontSize || 16;
    this.fontFamily = option.fontFamily || "Arial";
    this.textAlign = option.textAlign || "left";
    this.textBaseline = option.textBaseline || "middle";
    this.fillColor = option.textColor || "black";
    this.strokeColor = option.strokeColor || "black";
    this.drawAllPoints = drawAllPoints;
    this.x = x;
    this.y = y - this.fontSize / 2; // 现在y表示文字的中间部分
    if (this.onTextInputModeChange) {
      this.onTextInputModeChange(true);
    }

    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;

    this.drawText();

    const cursorInterval = setInterval(() => {
      this.cursorVisible = !this.cursorVisible;
      this.drawText();
    }, this.cursorBlinkInterval);

    const handleInput = (e) => {
      this.text = e.target.value;
      this.drawText();
    };

    const handleKeyDown = (e) => {
      if (e.key === "Enter" && !this.isFinishing) {
        console.log("Enter pressed");
        e.preventDefault();
        this.preventBlur = true; // 设置防止blur执行的标志
        setTimeout(() => { // 设置延时以允许keydown处理完成
          this.preventBlur = false;
        }, 100);
        this.finishInput(onFinish, cursorInterval, handleInput, handleKeyDown);
      } else if (e.key === "Escape" && !this.isFinishing) {
        e.preventDefault();
        this.preventBlur = true; // 设置防止blur执行的标志
        setTimeout(() => { // 设置延时以允许keydown处理完成
          this.preventBlur = false;
        }, 100);
        this.cancelInput(onCancel, cursorInterval, handleInput, handleKeyDown);
      }
    };

    const inputElement = this.createInputElement(x, y);
    document.body.appendChild(inputElement);
    setTimeout(() => inputElement.focus(), 0);

    inputElement.addEventListener("input", handleInput);
    inputElement.addEventListener("blur", () => {
      
      if (!this.preventBlur) {
        if (this.text) {
          this.finishInput(onFinish,cursorInterval,handleInput,handleKeyDown);
        } else {
          this.cancelInput(onCancel,cursorInterval,handleInput,handleKeyDown
          );
        }
        this.drawAllPoints();
      }
    });
    document.addEventListener("keydown", handleKeyDown);
  }

  createInputElement(x, y) {
    // debugger
    const inputElement = document.createElement("input");
    inputElement.id = this.id;
    inputElement.type = "text";
    Object.assign(inputElement.style, {
      position: "absolute",
      left: `${this.canvas.offsetLeft + x}px`,
      top: `${this.canvas.offsetTop + y}px`,
      background: "transparent",
      border: "none",
      outline: "none",
      color: "transparent",
      caretColor: "transparent",
      fontSize: `${this.fontSize}px`,
      fontFamily: this.fontFamily,
      width: "1px",
      height: "1px",
      padding: "0",
      margin: "0",
      opacity: "0",
    });
    return inputElement;
  }

  handleBlur(cursorInterval) {
    this.offscreenCtx.clearRect(
      0,
      0,
      this.offscreenCanvas.width,
      this.offscreenCanvas.height
    );
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    clearInterval(cursorInterval);
    this.drawAllPoints();
    // const inputElement = document.getElementById(this.id);
    // if (inputElement) {
    //   document.body.removeChild(inputElement);
    // }
  }

  drawText() {
    this.offscreenCtx.clearRect(
      0,
      0,
      this.offscreenCanvas.width,
      this.offscreenCanvas.height
    );

    this.offscreenCtx.font = `${this.fontSize}px ${this.fontFamily}`;
    this.offscreenCtx.fillStyle = this.fillColor;
    this.offscreenCtx.textAlign = this.textAlign;
    this.offscreenCtx.textBaseline = this.textBaseline;
    this.offscreenCtx.fillText(this.text, this.x, this.y);

    const textMetrics = this.offscreenCtx.measureText(this.text);
    const textWidth = textMetrics.width;

    if (this.isTextInputMode) {
      this.drawTextBox(textWidth);
      if (this.cursorVisible) {
        this.drawCursor(textWidth);
      }
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    this.drawAllPoints();
  }

  drawTextBox(textWidth) {
    this.offscreenCtx.beginPath();
    this.offscreenCtx.rect(
      this.x - 2,
      this.y - 2,
      textWidth + 14,
      this.fontSize + 4
    );
    this.offscreenCtx.strokeStyle = this.strokeColor;
    this.offscreenCtx.lineWidth = 1;
    this.offscreenCtx.stroke();
  }

  drawCursor(textWidth) {
    const cursorX = this.x + textWidth + 4;
    const cursorYStart = this.y + 2;
    const cursorYEnd = this.y + this.fontSize - 2;

    this.offscreenCtx.beginPath();
    this.offscreenCtx.moveTo(cursorX, cursorYStart);
    this.offscreenCtx.lineTo(cursorX, cursorYEnd);
    this.offscreenCtx.strokeStyle = this.strokeColor;
    this.offscreenCtx.stroke();
  }

  finishInput(onFinish, cursorInterval, handleInput, handleKeyDown) {
    this.isTextInputMode = false;
    if (this.onTextInputModeChange) {
      this.onTextInputModeChange(false);
    }
    this.cleanup(cursorInterval, handleInput, handleKeyDown);
    // debugger
    if (this.text) {
      onFinish(this.text);
    }
  }

  cancelInput(onCancel, cursorInterval, handleInput, handleKeyDown) {
    this.isTextInputMode = false;
    if (this.onTextInputModeChange) {
      this.onTextInputModeChange(false);
    }
    this.cleanup(cursorInterval, handleInput, handleKeyDown);
    onCancel();
  }

  cleanup(cursorInterval, handleInput, handleKeyDown) {
    this.isFinishing = false;
    document.removeEventListener("keydown", handleKeyDown);
    setTimeout(() => {
      const inputElement = document.getElementById(this.id);
      if (inputElement) {
        inputElement.removeEventListener("input", handleInput);
        document.body.removeChild(inputElement);
      }
    }, 0);

    clearInterval(cursorInterval);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawTextPreview(ctx, x, y) {
    if (this.text) {
      offscreenCtx.save();
      ctx.font = `${this.fontSize}px ${this.fontFamily}`;
      ctx.fillStyle = this.fillColor;
      ctx.strokeStyle = this.strokeColor;
      ctx.textAlign = this.textAlign;
      ctx.textBaseline = this.textBaseline;
      ctx.fillText(this.text, x, y);
      ctx.restore();
    }
  }
}
