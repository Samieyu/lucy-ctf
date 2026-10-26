/**
 * Calculates current point value for dynamic scoring challenges.
 * Standard quadratic decay formula modeled after CTFd:
 * points = max(minPoints, round(((minPoints - initialPoints) / decay^2) * (solves - 1)^2 + initialPoints))
 */
export function calculateDynamicPoints(
  initialPoints: number,
  minPoints: number,
  decay: number,
  solveCount: number,
): number {
  if (solveCount <= 1) {
    return initialPoints;
  }
  const solves = Math.min(solveCount, decay);
  const value =
    ((minPoints - initialPoints) / Math.pow(decay, 2)) *
      Math.pow(solves - 1, 2) +
    initialPoints;

  return Math.max(minPoints, Math.round(value));
}
