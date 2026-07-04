/**
 * Generates a unique, human-readable SKU based on the product name,
 * category and a random alphanumeric suffix + timestamp fragment.
 *
 * Example: "WIRELESS-MOUSE-ELEC-7F3K9A"
 */
const generateSku = (productName = '', category = '') => {
  const cleanSegment = (str) =>
    str
      .toString()
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 15);

  const namePart = cleanSegment(productName) || 'PROD';
  const categoryPart = cleanSegment(category).slice(0, 4) || 'GEN';
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timePart = Date.now().toString(36).toUpperCase().slice(-4);

  return `${namePart}-${categoryPart}-${randomPart}${timePart}`;
};

module.exports = generateSku;
