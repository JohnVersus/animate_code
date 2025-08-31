declare module "gif.js" {
  interface GIFOptions {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    workerScript?: string;
    background?: string;
    transparent?: string;
    dither?: boolean;
    debug?: boolean;
  }

  class GIF {
    constructor(options?: GIFOptions);
    addFrame(
      canvas: HTMLCanvasElement | ImageData,
      options?: { delay?: number }
    ): void;
    render(): void;
    on(event: "finished", callback: (blob: Blob) => void): void;
    on(event: "progress", callback: (progress: number) => void): void;
    abort(): void;
  }

  export = GIF;
}
