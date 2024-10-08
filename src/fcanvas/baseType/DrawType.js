export class FCanvasType {
    static Pencil = "pencil";
    static Line = "line";
    static Rect = "rect";
    static Circle = "circle";
    static Eraser = "eraser";
    static Polygon = "polygon";
    static PolygonLine = "polygonLine";
    static Text = "text";
    static Sector = "sector"
    isDrawType(str) {
      const validDrawTypes = [
        FCanvasType.Pencil,
        FCanvasType.Line,
        FCanvasType.Rect,
        FCanvasType.Circle,
        FCanvasType.Eraser,
        FCanvasType.Polygon,
        FCanvasType.PolygonLine, 
        FCanvasType.Text,
        FCanvasType.Sector
      ];
      return validDrawTypes.includes(str);
    }
  }