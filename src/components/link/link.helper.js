/**
 * @module Link/helper
 * @description
 * A set of helper methods to manipulate/create links.
 */
import { LINE_TYPES } from "./link.const";

/**
 * Computes radius value for a straight line.
 * @returns {number} radius for straight line.
 * @memberof Link/helper
 */
function straightLineRadius() {
  return 0;
}

/**
 * Computes radius for a smooth curve effect.
 * @param {number} x1 - x value for point 1
 * @param {number} y1 - y value for point 1
 * @param {number} x2 - y value for point 2
 * @param {number} y2 - y value for point 2
 * @returns{number} value of radius.
 * @memberof Link/helper
 */
function smoothCurveRadius(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Computes radius value for a full curve (semi circumference).
 * @returns {number} radius for full curve.
 * @memberof Link/helper
 */
function fullCurveRadius() {
  return 1;
}

const RADIUS_STRATEGIES = {
  [LINE_TYPES.STRAIGHT]: straightLineRadius,
  [LINE_TYPES.CURVE_SMOOTH]: smoothCurveRadius,
  [LINE_TYPES.CURVE_FULL]: fullCurveRadius,
};

/**
 * Get a strategy to compute line radius.<br/>
 * *CURVE_SMOOTH* type inspired by {@link http://bl.ocks.org/mbostock/1153292|mbostock - Mobile Patent Suits}.
 * @param {string} [type=LINE_TYPES.STRAIGHT] type of curve to get radius strategy from.
 * @returns {Function} a function that calculates a radius
 * to match curve type expectation. Fallback is the straight line.
 * @memberof Link/helper
 */
function getRadiusStrategy(type) {
  return RADIUS_STRATEGIES[type] || RADIUS_STRATEGIES[LINE_TYPES.STRAIGHT];
}

/**
 * This method returns the path definition for a given link base on the line type
 * and the link source and target.
 * {@link https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d|d attribute mdn}
 * @param {Object} sourceCoords - link sourceCoords
 * @param {Object} targetCoords - link targetCoords
 * @param {string} type - the link line type
 * @param {Array.<Object>} breakPoints - additional set of points that the link will cross
 * @returns {string} the path definition for the requested link
 * @memberof Link/helper
 */
function buildLinkPathDefinition(
  sourceCoords = {},
  targetCoords = {},
  type = LINE_TYPES.STRAIGHT,
  breakPoints = [],
  targetWidth = 0,
  targetHeight = 0
) {
  const { x: sx, y: sy } = sourceCoords;
  const validType = LINE_TYPES[type] || LINE_TYPES.STRAIGHT;
  const calcRadiusFn = getRadiusStrategy(validType);

  const restOfLinkPoints = [...breakPoints, targetCoords];
  const restOfLinkPath = restOfLinkPoints
    .map(({ x, y }, i) => {
      const { x: px, y: py } = i > 0 ? restOfLinkPoints[i - 1] : sourceCoords;
      const radius = calcRadiusFn(px, py, x, y);
      // Check if i is the last point
      if (i === restOfLinkPoints.length - 1) {
        // Slope of the link line
        var alpha = Math.atan((y - py) / (x - px));
        // Slope of bottom left edge to top right edge of node (is positive)
        var beta = Math.atan(targetHeight / targetWidth);
        // Decrease percent
        var threshold = 8;
        // Change x and y to be the edge of the target
        if (alpha > -beta && alpha <= beta) {
          // Left or right edge of target
          // Calculate sign of x - px
          var sign = Math.sign(x - px);
          var widthPercent = targetWidth / 2 / (x - px);
          var xNew = x - sign * (x - px) * widthPercent + sign * threshold;
          x = xNew;
          var yNew = y - sign * (y - py) * widthPercent;
          y = yNew;
        } else {
          // Top or bottom edge of target
          // Calculate sign of y - py
          var sign = Math.sign(y - py);
          var heightPercent = targetHeight / 2 / (y - py);
          var xNew = x - sign * (x - px) * heightPercent;
          x = xNew;
          var yNew = y - sign * (y - py) * heightPercent + sign * threshold;
          y = yNew;
        }
      }
      return ` A${radius},${radius} 0 0,1 ${x},${y}`;
    })
    .join("");

  return `M${sx},${sy}${restOfLinkPath}`;
}

export { buildLinkPathDefinition };
