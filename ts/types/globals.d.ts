declare function html2canvas(
  element: Element,
  options: { onrendered: (canvas: HTMLCanvasElement) => void }
): void;

declare const Canvas2Image: {
  saveAsPNG(canvas: HTMLCanvasElement): void;
};
