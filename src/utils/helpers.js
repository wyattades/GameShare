// Helper functions for converting: hex color string <--> color integer
export const intToHex = int => {
  const hexString = `000000${((int) >>> 0).toString(16)}`.slice(-6);
  return `#${hexString}`;
};
export const hexToInt = hex => parseInt(hex.substring(1), 16);

// Constrain val between min and max
export const constrain = (val, min, max) => {
  if (val < min) return min;
  if (val > max) return max;
  return val;
};
