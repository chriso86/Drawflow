export class NodeConnectionBuilder {
  public calculatePointWithZoomCorrection(point1: number, point2: number, point3: number, zoom: number) {
    return point1 + (point2 - point3) * zoom;
  }

  public calculatePointWithZoomCorrectionAndWidthReroute(point1: number, point2: number, zoom: number, rerouteWidth: number) {
    return (point1 - point2) * zoom + rerouteWidth;
  }

  setStartX() {

  }
}
