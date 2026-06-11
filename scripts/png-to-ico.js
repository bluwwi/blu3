// Script to convert a PNG to a 256x256 ICO file
const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2];
const outputPath = process.argv[3];

const pngData = fs.readFileSync(inputPath);

// ICO file format:
// ICONDIR header (6 bytes) + ICONDIRENTRY (16 bytes per image) + PNG data
const iconDir = Buffer.alloc(6);
iconDir.writeUInt16LE(0, 0);     // Reserved
iconDir.writeUInt16LE(1, 2);     // Type: 1 = ICO
iconDir.writeUInt16LE(1, 4);     // Number of images

const iconEntry = Buffer.alloc(16);
iconEntry.writeUInt8(0, 0);       // Width: 0 = 256
iconEntry.writeUInt8(0, 1);       // Height: 0 = 256
iconEntry.writeUInt8(0, 2);       // Color palette
iconEntry.writeUInt8(0, 3);       // Reserved
iconEntry.writeUInt16LE(1, 4);    // Color planes
iconEntry.writeUInt16LE(32, 6);   // Bits per pixel
iconEntry.writeUInt32LE(pngData.length, 8);  // Image data size
iconEntry.writeUInt32LE(22, 12);  // Offset to image data (6 + 16 = 22)

const ico = Buffer.concat([iconDir, iconEntry, pngData]);
fs.writeFileSync(outputPath, ico);

console.log(`Created ICO: ${outputPath} (${ico.length} bytes)`);
