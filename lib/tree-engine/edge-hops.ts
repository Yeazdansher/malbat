import { Position } from "@xyflow/react";

export type Point = { x: number; y: number };

export type EdgeGeometry = {
  id: string;
  points: Point[];
};

type Segment = {
  a: Point;
  b: Point;
  horizontal: boolean;
};

const HOP_RADIUS = 11;
const CROSSING_EPSILON = 1.5;

const handleDirections: Record<Position, Point> = {
  [Position.Left]: { x: -1, y: 0 },
  [Position.Right]: { x: 1, y: 0 },
  [Position.Top]: { x: 0, y: -1 },
  [Position.Bottom]: { x: 0, y: 1 },
};

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= CROSSING_EPSILON;
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function getDirection({
  source,
  sourcePosition = Position.Bottom,
  target,
}: {
  source: Point;
  sourcePosition?: Position;
  target: Point;
}): Point {
  if (
    sourcePosition === Position.Left ||
    sourcePosition === Position.Right
  ) {
    return source.x < target.x ? { x: 1, y: 0 } : { x: -1, y: 0 };
  }

  return source.y < target.y ? { x: 0, y: 1 } : { x: 0, y: -1 };
}

/**
 * Orthogonale Punkte wie React Flow `getSmoothStepPath` / `getPoints`.
 */
export function getSmoothStepPoints({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = Position.Bottom,
  targetPosition = Position.Top,
  offset = 20,
  stepPosition = 0.5,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition?: Position;
  targetPosition?: Position;
  offset?: number;
  stepPosition?: number;
}): Point[] {
  const source = { x: sourceX, y: sourceY };
  const target = { x: targetX, y: targetY };
  const sourceDir = handleDirections[sourcePosition];
  const targetDir = handleDirections[targetPosition];
  const sourceGapped = {
    x: source.x + sourceDir.x * offset,
    y: source.y + sourceDir.y * offset,
  };
  const targetGapped = {
    x: target.x + targetDir.x * offset,
    y: target.y + targetDir.y * offset,
  };
  const dir = getDirection({
    source: sourceGapped,
    sourcePosition,
    target: targetGapped,
  });
  const dirAccessor = dir.x !== 0 ? "x" : "y";
  const currDir = dir[dirAccessor];
  let points: Point[] = [];
  let centerX: number;
  let centerY: number;
  const sourceGapOffset = { x: 0, y: 0 };
  const targetGapOffset = { x: 0, y: 0 };

  if (sourceDir[dirAccessor] * targetDir[dirAccessor] === -1) {
    if (dirAccessor === "x") {
      centerX =
        sourceGapped.x + (targetGapped.x - sourceGapped.x) * stepPosition;
      centerY = (sourceGapped.y + targetGapped.y) / 2;
    } else {
      centerX = (sourceGapped.x + targetGapped.x) / 2;
      centerY =
        sourceGapped.y + (targetGapped.y - sourceGapped.y) * stepPosition;
    }

    const verticalSplit = [
      { x: centerX, y: sourceGapped.y },
      { x: centerX, y: targetGapped.y },
    ];
    const horizontalSplit = [
      { x: sourceGapped.x, y: centerY },
      { x: targetGapped.x, y: centerY },
    ];

    points =
      sourceDir[dirAccessor] === currDir
        ? dirAccessor === "x"
          ? verticalSplit
          : horizontalSplit
        : dirAccessor === "x"
          ? horizontalSplit
          : verticalSplit;
  } else {
    const sourceTarget = [{ x: sourceGapped.x, y: targetGapped.y }];
    const targetSource = [{ x: targetGapped.x, y: sourceGapped.y }];

    if (dirAccessor === "x") {
      points = sourceDir.x === currDir ? targetSource : sourceTarget;
    } else {
      points = sourceDir.y === currDir ? sourceTarget : targetSource;
    }

    if (sourcePosition === targetPosition) {
      const diff = Math.abs(source[dirAccessor] - target[dirAccessor]);
      if (diff <= offset) {
        const gapOffset = Math.min(offset - 1, offset - diff);
        if (sourceDir[dirAccessor] === currDir) {
          sourceGapOffset[dirAccessor] =
            (sourceGapped[dirAccessor] > source[dirAccessor] ? -1 : 1) *
            gapOffset;
        } else {
          targetGapOffset[dirAccessor] =
            (targetGapped[dirAccessor] > target[dirAccessor] ? -1 : 1) *
            gapOffset;
        }
      }
    }

    if (sourcePosition !== targetPosition) {
      const dirAccessorOpposite = dirAccessor === "x" ? "y" : "x";
      const isSameDir =
        sourceDir[dirAccessor] === targetDir[dirAccessorOpposite];
      const sourceGtTargetOppo =
        sourceGapped[dirAccessorOpposite] >
        targetGapped[dirAccessorOpposite];
      const sourceLtTargetOppo =
        sourceGapped[dirAccessorOpposite] <
        targetGapped[dirAccessorOpposite];
      const flipSourceTarget =
        (sourceDir[dirAccessor] === 1 &&
          ((!isSameDir && sourceGtTargetOppo) ||
            (isSameDir && sourceLtTargetOppo))) ||
        (sourceDir[dirAccessor] !== 1 &&
          ((!isSameDir && sourceLtTargetOppo) ||
            (isSameDir && sourceGtTargetOppo)));

      if (flipSourceTarget) {
        points = dirAccessor === "x" ? sourceTarget : targetSource;
      }
    }
  }

  const gappedSource = {
    x: sourceGapped.x + sourceGapOffset.x,
    y: sourceGapped.y + sourceGapOffset.y,
  };
  const gappedTarget = {
    x: targetGapped.x + targetGapOffset.x,
    y: targetGapped.y + targetGapOffset.y,
  };

  const pathPoints = [
    source,
    ...(gappedSource.x !== points[0]?.x || gappedSource.y !== points[0]?.y
      ? [gappedSource]
      : []),
    ...points,
    ...(gappedTarget.x !== points[points.length - 1]?.x ||
    gappedTarget.y !== points[points.length - 1]?.y
      ? [gappedTarget]
      : []),
    target,
  ];

  return simplifyPoints(pathPoints);
}

function simplifyPoints(points: Point[]): Point[] {
  const deduped: Point[] = [];

  for (const point of points) {
    const previous = deduped[deduped.length - 1];
    if (
      previous &&
      nearlyEqual(previous.x, point.x) &&
      nearlyEqual(previous.y, point.y)
    ) {
      continue;
    }
    deduped.push(point);
  }

  if (deduped.length < 3) {
    return deduped;
  }

  const collapsed: Point[] = [deduped[0]];

  for (let index = 1; index < deduped.length - 1; index += 1) {
    const previous = collapsed[collapsed.length - 1];
    const current = deduped[index];
    const next = deduped[index + 1];

    const collinearHorizontal =
      nearlyEqual(previous.y, current.y) &&
      nearlyEqual(current.y, next.y);
    const collinearVertical =
      nearlyEqual(previous.x, current.x) &&
      nearlyEqual(current.x, next.x);

    if (collinearHorizontal || collinearVertical) {
      continue;
    }

    collapsed.push(current);
  }

  collapsed.push(deduped[deduped.length - 1]);
  return collapsed;
}

function toSegments(points: Point[]): Segment[] {
  const segments: Segment[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const a = points[index];
    const b = points[index + 1];

    if (nearlyEqual(a.x, b.x) && nearlyEqual(a.y, b.y)) {
      continue;
    }

    const horizontal = nearlyEqual(a.y, b.y);
    const vertical = nearlyEqual(a.x, b.x);

    if (!horizontal && !vertical) {
      continue;
    }

    if (distance(a, b) < HOP_RADIUS) {
      continue;
    }

    segments.push({ a, b, horizontal });
  }

  return segments;
}

/**
 * Y-Positionen, an denen eine senkrechte Kante eine waagerechte kreuzt
 * bzw. eine durchgehende Geschwister-Sammelschiene trifft.
 */
function hopYsOnVertical(
  vertical: Segment,
  others: EdgeGeometry[],
  selfId: string
): number[] {
  if (vertical.horizontal) {
    return [];
  }

  const x = vertical.a.x;
  const minY = Math.min(vertical.a.y, vertical.b.y);
  const maxY = Math.max(vertical.a.y, vertical.b.y);
  const hopYs: number[] = [];

  type HorizHit = { y: number; minX: number; maxX: number };
  const hits: HorizHit[] = [];

  for (const other of others) {
    if (other.id === selfId) {
      continue;
    }

    for (const segment of toSegments(other.points)) {
      if (!segment.horizontal) {
        continue;
      }

      const y = segment.a.y;
      const segMinX = Math.min(segment.a.x, segment.b.x);
      const segMaxX = Math.max(segment.a.x, segment.b.x);

      if (y <= minY + HOP_RADIUS || y >= maxY - HOP_RADIUS) {
        continue;
      }

      if (x < segMinX - CROSSING_EPSILON || x > segMaxX + CROSSING_EPSILON) {
        continue;
      }

      hits.push({ y, minX: segMinX, maxX: segMaxX });
    }
  }

  // Nur echte Durchkreuzungen (Schiene links UND rechts der Senkrechten).
  // T-Verbindungen (Schiene endet an der Senkrechten) erzeugen keinen Hop —
  // wichtig für Geschwister-Sammelschienen derselben Familie.
  for (const hit of hits) {
    const crossesThrough =
      hit.minX < x - HOP_RADIUS && hit.maxX > x + HOP_RADIUS;

    if (crossesThrough) {
      hopYs.push(hit.y);
    }
  }

  return [...new Set(hopYs.map((value) => Math.round(value)))].sort(
    (left, right) => left - right
  );
}

/**
 * Baut den Kantenpfad. An H×V-Kreuzungen bekommt das
 * senkrechte Segment einen Halbkreis nach rechts.
 */
export function buildHopPath(
  points: Point[],
  others: EdgeGeometry[],
  selfId: string
): string {
  if (points.length < 2) {
    return "";
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const a = points[index];
    const b = points[index + 1];
    const horizontal = nearlyEqual(a.y, b.y);
    const vertical = nearlyEqual(a.x, b.x);

    if (horizontal || !vertical) {
      path += ` L ${b.x} ${b.y}`;
      continue;
    }

    const goingDown = b.y >= a.y;
    const hopYs = hopYsOnVertical(
      { a, b, horizontal: false },
      others,
      selfId
    )
      .filter((y) =>
        goingDown
          ? y > a.y + HOP_RADIUS && y < b.y - HOP_RADIUS
          : y < a.y - HOP_RADIUS && y > b.y + HOP_RADIUS
      )
      .sort((left, right) => (goingDown ? left - right : right - left));

    const x = a.x;

    for (const hopY of hopYs) {
      const beforeY = goingDown ? hopY - HOP_RADIUS : hopY + HOP_RADIUS;
      const afterY = goingDown ? hopY + HOP_RADIUS : hopY - HOP_RADIUS;

      path += ` L ${x} ${beforeY}`;
      // Halbkreis nach rechts
      path += ` A ${HOP_RADIUS} ${HOP_RADIUS} 0 0 ${goingDown ? 1 : 0} ${x} ${afterY}`;
    }

    path += ` L ${b.x} ${b.y}`;
  }

  return path;
}
