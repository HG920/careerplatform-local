// Regenerate every raster/desktop icon from the checked-in SVG sources.
// Requires librsvg's rsvg-convert.
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "public/icon-source.svg");
const traySource = path.join(root, "build/tray-icon-source.svg");
const render = (svg, size, target) => {
  execFileSync("rsvg-convert", ["-w", String(size), "-h", String(size), svg, "-o", target]);
};

render(source, 192, path.join(root, "public/icon-192.png"));
render(source, 512, path.join(root, "public/icon-512.png"));
render(source, 180, path.join(root, "public/apple-touch-icon.png"));
render(source, 180, path.join(root, "src/app/icon.png"));

const trayDir = path.join(root, "electron/assets");
fs.mkdirSync(trayDir, { recursive: true });
render(traySource, 44, path.join(trayDir, "trayTemplate.png"));
render(source, 64, path.join(trayDir, "trayColor.png"));

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "careerplatform-icon-"));
try {
  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  const frames = icoSizes.map((size) => {
    const target = path.join(temp, `ico-${size}.png`);
    render(source, size, target);
    return { size, data: fs.readFileSync(target) };
  });
  const header = Buffer.alloc(6 + frames.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  let offset = header.length;
  frames.forEach(({ size, data }, i) => {
    const entry = 6 + i * 16;
    header[entry] = size === 256 ? 0 : size;
    header[entry + 1] = size === 256 ? 0 : size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  fs.writeFileSync(path.join(root, "build/icon.ico"), Buffer.concat([header, ...frames.map((f) => f.data)]));

  if (process.platform === "darwin") {
    const icnsFrames = [[16, "icp4"], [32, "icp5"], [64, "icp6"], [128, "ic07"], [256, "ic08"], [512, "ic09"], [1024, "ic10"]].map(([size, type]) => {
      const target = path.join(temp, `icns-${size}.png`);
      render(source, size, target);
      const data = fs.readFileSync(target);
      const chunkHeader = Buffer.alloc(8);
      chunkHeader.write(type, 0, "ascii");
      chunkHeader.writeUInt32BE(data.length + 8, 4);
      return Buffer.concat([chunkHeader, data]);
    });
    const icnsHeader = Buffer.alloc(8);
    icnsHeader.write("icns", 0, "ascii");
    icnsHeader.writeUInt32BE(8 + icnsFrames.reduce((total, frame) => total + frame.length, 0), 4);
    fs.writeFileSync(path.join(root, "build/icon.icns"), Buffer.concat([icnsHeader, ...icnsFrames]));
  }
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
