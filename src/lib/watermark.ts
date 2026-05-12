import sharp from "sharp";

interface WatermarkOptions {
  text?: string;
  position?: "bottom-right" | "bottom-left" | "center" | "tile";
  opacity?: number; // 0..1
  fontSize?: number;
}

/**
 * Apply text watermark to an image buffer.
 * Returns a new buffer with watermark applied.
 */
export async function applyTextWatermark(
  imageBuffer: Buffer,
  options: WatermarkOptions = {}
): Promise<Buffer> {
  const text = options.text ?? "© EventFace";
  const opacity = options.opacity ?? 0.45;
  const position = options.position ?? "bottom-right";

  const meta = await sharp(imageBuffer).metadata();
  const width = meta.width ?? 1280;
  const height = meta.height ?? 720;
  const fontSize = options.fontSize ?? Math.max(24, Math.round(width / 30));

  let svg: string;

  if (position === "tile") {
    // Tiled watermark across whole image
    const tile = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <defs>
          <pattern id="wm" patternUnits="userSpaceOnUse" width="400" height="200" patternTransform="rotate(-30)">
            <text x="20" y="100" font-family="Tajawal, Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" fill-opacity="${opacity}" stroke="black" stroke-opacity="${opacity * 0.5}" stroke-width="1">${escapeXml(text)}</text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wm)"/>
      </svg>
    `;
    svg = tile;
  } else {
    const padding = Math.round(fontSize / 2);
    let x = padding, y = height - padding, anchor = "start";
    if (position === "bottom-right") { x = width - padding; anchor = "end"; }
    else if (position === "center") { x = width / 2; y = height / 2; anchor = "middle"; }

    svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <text x="${x}" y="${y}" font-family="Tajawal, Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" fill-opacity="${opacity}" stroke="black" stroke-opacity="${opacity * 0.6}" stroke-width="2" text-anchor="${anchor}">${escapeXml(text)}</text>
      </svg>
    `;
  }

  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(svg), gravity: "center" }])
    .toBuffer();
}

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  }[c]!));
}
