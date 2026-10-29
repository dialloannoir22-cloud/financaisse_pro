import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal standard PNG encoder using Node.js built-in zlib
function createPNG(width, height, drawPixel) {
  // 1. Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // 2. IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression: 0 (deflate)
  ihdrData[11] = 0; // Filter: 0
  ihdrData[12] = 0; // Interlace: 0
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // 3. Raw Scanlines (Filter byte 0 + RGBA pixels per row)
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawPixel(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  // Deflate IDAT data
  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);

  // 4. IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 calculation for PNG chunks
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  CRC_TABLE[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcTarget = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcTarget);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, crcTarget, crcBuf]);
}

// Drawing logic: FinanCaisse Pro Brand Icon (Emerald green gradient, rounded squircle, gold/white wallet & coin motif)
function drawFinanCaisseIcon(x, y, width, height, isMaskable = false) {
  const nx = x / width;
  const ny = y / height;
  const cx = width / 2;
  const cy = height / 2;
  const dx = (x - cx) / (width / 2);
  const dy = (y - cy) / (height / 2);

  // Background Gradient (Deep emerald to vibrant teal)
  const rBg = Math.round(5 + ny * 15);
  const gBg = Math.round(150 - ny * 35 + nx * 20);
  const bBg = Math.round(105 + ny * 20);

  if (isMaskable) {
    // Full bleed background for maskable
    return drawForeground(x, y, width, height, [rBg, gBg, bBg, 255]);
  }

  // Rounded Corner Squircle for standard and apple-touch-icon
  const cornerRadius = 0.22;
  const qx = Math.max(0, Math.abs(dx) - (1 - cornerRadius * 2));
  const qy = Math.max(0, Math.abs(dy) - (1 - cornerRadius * 2));
  const dist = Math.sqrt(qx * qx + qy * qy);

  if (dist > cornerRadius * 2) {
    return [0, 0, 0, 0]; // Transparent outside squircle
  }

  return drawForeground(x, y, width, height, [rBg, gBg, bBg, 255]);
}

function drawForeground(x, y, width, height, bgColor) {
  const cx = width / 2;
  const cy = height / 2;
  const scale = width / 180;

  // Wallet rectangle coordinates
  const wLeft = cx - 44 * scale;
  const wRight = cx + 44 * scale;
  const wTop = cy - 28 * scale;
  const wBottom = cy + 34 * scale;
  const wRadius = 10 * scale;

  // Check if inside wallet body
  if (x >= wLeft && x <= wRight && y >= wTop && y <= wBottom) {
    // Rounded corners for wallet
    const cornX = Math.max(0, Math.abs(x - cx) - (44 * scale - wRadius));
    const cornY = Math.max(0, Math.abs(y - (cy + 3 * scale)) - (31 * scale - wRadius));
    if (Math.hypot(cornX, cornY) <= wRadius) {
      // Wallet flap / top line
      if (y >= wTop && y <= wTop + 14 * scale) {
        return [255, 255, 255, 245]; // Crisp white flap
      }

      // Wallet clasp (Golden pill clasp on the right)
      const claspCx = cx + 24 * scale;
      const claspCy = cy + 3 * scale;
      const claspDist = Math.hypot((x - claspCx), (y - claspCy));
      if (claspDist <= 11 * scale) {
        if (claspDist <= 4 * scale) {
          return [255, 255, 255, 255]; // Clasp dot
        }
        return [245, 158, 11, 255]; // Gold amber clasp
      }

      // Main wallet body color (Deep navy / slate contrast)
      return [15, 23, 42, 240];
    }
  }

  // Floating Gold Coin above wallet (CFA / Dollar symbol circle)
  const coinCx = cx - 12 * scale;
  const coinCy = cy - 32 * scale;
  const coinR = 14 * scale;
  const cDist = Math.hypot(x - coinCx, y - coinCy);
  if (cDist <= coinR) {
    if (cDist >= coinR - 2.5 * scale) {
      return [251, 191, 36, 255]; // Golden rim
    }
    if (Math.abs(x - coinCx) <= 2 * scale && Math.abs(y - coinCy) <= 8 * scale) {
      return [255, 255, 255, 255]; // Center bar of coin
    }
    return [245, 158, 11, 255]; // Gold body
  }

  return bgColor;
}

// Generate all target files
const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. apple-touch-icon.png (180x180)
const appleIcon = createPNG(180, 180, (x, y, w, h) => drawFinanCaisseIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon-180x180.png'), appleIcon);

// 2. pwa-192x192.png
const pwa192 = createPNG(192, 192, (x, y, w, h) => drawFinanCaisseIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);

// 3. pwa-512x512.png
const pwa512 = createPNG(512, 512, (x, y, w, h) => drawFinanCaisseIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);

// 4. pwa-maskable-512x512.png
const pwaMaskable512 = createPNG(512, 512, (x, y, w, h) => drawFinanCaisseIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable512);

console.log('✅ PWA PNG icons successfully generated in public/ directory!');
