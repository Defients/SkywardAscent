// PlaceholderUtils.js
const createPlaceholder = (
  text,
  width = 200,
  height = 200,
  color = "#3a3a5a"
) => {
  // Create a data URL for a simple placeholder image
  const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color}"/>
        <text x="50%" y="50%" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dominant-baseline="middle">
          ${text}
        </text>
      </svg>
    `;
  const encodedSvg = encodeURIComponent(svg);
  return `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
};

export default {
  createPlaceholder,
};
