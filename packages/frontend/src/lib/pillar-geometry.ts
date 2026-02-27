// Calculate polygon coordinates for constellation display
export function polygonPoints(sides: number, radius: number, cx: number, cy: number): [number, number][] {
  const points: [number, number][] = [];
  const angleOffset = -Math.PI / 2; // Start from top
  for (let i = 0; i < sides; i++) {
    const angle = angleOffset + (2 * Math.PI * i) / sides;
    points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
  }
  return points;
}

export function polarToCartesian(angle: number, radius: number, cx: number, cy: number): [number, number] {
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}
