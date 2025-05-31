import qrcode from 'qrcode-terminal';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

const APP_URL = 'https://briqwerk.vercel.app';

// Generate QR code in terminal
console.log('\nBriqWerk PWA QR-Code:');
qrcode.generate(APP_URL, { small: true });

// Generate QR code SVG file
async function generateQRFile() {
  try {
    const qrSvg = await QRCode.toString(APP_URL, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#000',
        light: '#fff'
      }
    });

    const qrPath = path.join(process.cwd(), 'public', 'qr-code.svg');
    fs.writeFileSync(qrPath, qrSvg);
    console.log(`\nQR-Code saved to: ${qrPath}\n`);
  } catch (error) {
    console.error('Failed to generate QR code file:', error);
  }
}

generateQRFile(); 