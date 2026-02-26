"use client";

import { useMemo } from "react";

interface QRCodeProps {
  data: string;
  size?: number;
  className?: string;
}

/**
 * Simple deterministic QR-like pattern generator for demo purposes.
 * Generates a visual pattern based on the input data hash.
 * For production, use a real QR library like 'qrcode' npm package.
 */
export function QRCode({ data, size = 150, className = "" }: QRCodeProps) {
  const pattern = useMemo(() => {
    // Simple hash function to generate deterministic pattern
    const hash = (str: string) => {
      let h = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        h = ((h << 5) - h) + char;
        h = h & h; // Convert to 32bit integer
      }
      return Math.abs(h);
    };

    const gridSize = 21; // Standard QR code grid
    const cellSize = size / gridSize;
    const cells: boolean[][] = [];
    
    // Generate pattern based on hash
    for (let row = 0; row < gridSize; row++) {
      cells[row] = [];
      for (let col = 0; col < gridSize; col++) {
        // Finder patterns (corners) - always filled
        const isFinderCorner = 
          (row < 7 && col < 7) ||
          (row < 7 && col >= gridSize - 7) ||
          (row >= gridSize - 7 && col < 7);
        
        // Finder pattern structure
        if (isFinderCorner) {
          const localRow = row < 7 ? row : row - (gridSize - 7);
          const localCol = col < 7 ? col : col - (gridSize - 7);
          const isOuter = localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6;
          const isInner = localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4;
          cells[row][col] = isOuter || isInner;
        } else {
          // Data area - deterministic based on hash
          const cellIndex = row * gridSize + col;
          const bitPos = cellIndex % 32;
          const hashValue = hash(data + String(Math.floor(cellIndex / 32)));
          cells[row][col] = ((hashValue >> bitPos) & 1) === 1;
        }
      }
    }

    // Generate SVG rects
    const rects: string[] = [];
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (cells[row][col]) {
          rects.push(
            `<rect x="${col * cellSize}" y="${row * cellSize}" width="${cellSize + 0.5}" height="${cellSize + 0.5}" fill="black"/>`
          );
        }
      }
    }

    return rects.join("");
  }, [data, size]);

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="white"/>
      ${pattern}
    </svg>
  `;

  // Render SVG directly instead of using img element
  return (
    <div 
      className={className}
      style={{ width: size, height: size }}
      aria-label="QR Code"
      role="img"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

export default QRCode;
