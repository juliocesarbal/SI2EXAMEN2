const fs = require('fs');
const path = require('path');

// Sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// SVG template
const generateSVG = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad1)" rx="${size/6}"/>
  <g transform="translate(${size/2}, ${size/2})">
    <circle cx="0" cy="0" r="${size/3.2}" fill="white" opacity="0.2"/>
    <path d="M -${size/6.4},-${size/12.8} L -${size/6.4},${size/12.8} L 0,${size/6.4} L ${size/6.4},${size/12.8} L ${size/6.4},-${size/12.8} L 0,-${size/6.4} Z" fill="white"/>
    <text x="0" y="${size/19.2}" font-family="Arial, sans-serif" font-size="${size/4}" font-weight="bold" text-anchor="middle" fill="#3b82f6">SS</text>
  </g>
</svg>`;

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG files for each size
sizes.forEach(size => {
  const svgContent = generateSVG(size);
  const fileName = `icon-${size}x${size}.svg`;
  const filePath = path.join(iconsDir, fileName);

  fs.writeFileSync(filePath, svgContent);
  console.log(`✅ Generated ${fileName}`);
});

console.log('\n📦 All icon sizes generated successfully!');
console.log('ℹ️  These are SVG placeholders. For production, convert them to PNG using an online tool or sharp library.');
console.log('ℹ️  Recommended: https://www.pwabuilder.com/imageGenerator');
