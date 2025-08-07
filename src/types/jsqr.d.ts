declare module 'jsqr' {
  interface Point {
    x: number;
    y: number;
  }

  interface QRCode {
    binaryData: Uint8ClampedArray;
    data: string;
    chunks: any[];
    version: number;
    location: {
      topLeftCorner: Point;
      topRightCorner: Point;
      bottomLeftCorner: Point;
      bottomRightCorner: Point;
    };
  }

  function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): QRCode | null;

  export = jsQR;
}
