import GIF from "gif.js";

export function testGifLibrary(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Create a simple test GIF
      const gif = new GIF({
        workers: 1,
        quality: 30,
        width: 100,
        height: 100,
        workerScript: "/gif.worker.js",
      });

      gif.on("finished", () => {
        console.log("GIF library test: SUCCESS");
        resolve(true);
      });

      gif.on("progress", (progress) => {
        console.log("GIF test progress:", progress);
      });

      // Create a simple test canvas
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.fillStyle = "red";
        ctx.fillRect(0, 0, 100, 100);
        gif.addFrame(canvas, { delay: 100 });

        ctx.fillStyle = "blue";
        ctx.fillRect(0, 0, 100, 100);
        gif.addFrame(canvas, { delay: 100 });

        gif.render();
      } else {
        resolve(false);
      }
    } catch (error) {
      console.error("GIF library test: FAILED", error);
      resolve(false);
    }
  });
}
