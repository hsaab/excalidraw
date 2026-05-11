import {
  curve,
  curveCatmullRomCubicApproxPoints,
  curveOffsetPoints,
  pointFrom,
  pointRotateRads,
} from "@excalidraw/math";

import type {
  Curve,
  GlobalPoint,
  LineSegment,
  LocalPoint,
} from "@excalidraw/math";
import type { GeometricShape } from "@excalidraw/utils/shape";

import type { ExcalidrawHeartElement } from "./types";

type HeartPoint = readonly [x: number, y: number];
type HeartSegment = readonly [
  controlPoint1: HeartPoint,
  controlPoint2: HeartPoint,
  endPoint: HeartPoint,
];

export const HEART_START_POINT: HeartPoint = [0.5, 0.28];

export const HEART_CUBIC_SEGMENTS: readonly HeartSegment[] = [
  [
    [0.44, 0.08],
    [0.12, 0.02],
    [0.08, 0.32],
  ],
  [
    [0.02, 0.62],
    [0.28, 0.78],
    [0.5, 0.96],
  ],
  [
    [0.72, 0.78],
    [0.98, 0.62],
    [0.92, 0.32],
  ],
  [
    [0.88, 0.02],
    [0.56, 0.08],
    HEART_START_POINT,
  ],
];

const getSafeDimension = (dimension: number) => dimension || 1;

const mapHeartPoint = <Point extends GlobalPoint | LocalPoint>(
  [x, y]: HeartPoint,
  width: number,
  height: number,
  offsetX = 0,
  offsetY = 0,
): Point =>
  pointFrom<Point>(
    offsetX + x * getSafeDimension(width),
    offsetY + y * getSafeDimension(height),
  );

export const getHeartPath = (width: number, height: number) => {
  const start = mapHeartPoint<LocalPoint>(HEART_START_POINT, width, height);
  const path = [`M ${start[0]} ${start[1]}`];

  for (const [controlPoint1, controlPoint2, endPoint] of HEART_CUBIC_SEGMENTS) {
    const cp1 = mapHeartPoint<LocalPoint>(controlPoint1, width, height);
    const cp2 = mapHeartPoint<LocalPoint>(controlPoint2, width, height);
    const end = mapHeartPoint<LocalPoint>(endPoint, width, height);
    path.push(`C ${cp1[0]} ${cp1[1]}, ${cp2[0]} ${cp2[1]}, ${end[0]} ${end[1]}`);
  }

  return path.join(" ");
};

const getHeartBaseCurves = (
  element: ExcalidrawHeartElement,
): Curve<GlobalPoint>[] => {
  let start = mapHeartPoint<GlobalPoint>(
    HEART_START_POINT,
    element.width,
    element.height,
    element.x,
    element.y,
  );

  return HEART_CUBIC_SEGMENTS.map(([controlPoint1, controlPoint2, endPoint]) => {
    const end = mapHeartPoint<GlobalPoint>(
      endPoint,
      element.width,
      element.height,
      element.x,
      element.y,
    );
    const segment = curve<GlobalPoint>(
      start,
      mapHeartPoint<GlobalPoint>(
        controlPoint1,
        element.width,
        element.height,
        element.x,
        element.y,
      ),
      mapHeartPoint<GlobalPoint>(
        controlPoint2,
        element.width,
        element.height,
        element.x,
        element.y,
      ),
      end,
    );

    start = end;
    return segment;
  });
};

export const deconstructHeartElement = (
  element: ExcalidrawHeartElement,
  offset = 0,
): [LineSegment<GlobalPoint>[], Curve<GlobalPoint>[]] => {
  const baseCurves = getHeartBaseCurves(element);
  const curves =
    offset === 0
      ? baseCurves
      : baseCurves.flatMap(
          (heartCurve) =>
            curveCatmullRomCubicApproxPoints(
              curveOffsetPoints(heartCurve, offset),
            ) ?? [heartCurve],
        );

  return [[], curves];
};

export const getHeartShape = <Point extends GlobalPoint | LocalPoint>(
  element: ExcalidrawHeartElement,
): GeometricShape<Point> => {
  const center = pointFrom<GlobalPoint>(
    element.x + element.width / 2,
    element.y + element.height / 2,
  );
  const curves = getHeartBaseCurves(element).map((heartCurve) =>
    curve<Point>(
      pointRotateRads(heartCurve[0], center, element.angle) as Point,
      pointRotateRads(heartCurve[1], center, element.angle) as Point,
      pointRotateRads(heartCurve[2], center, element.angle) as Point,
      pointRotateRads(heartCurve[3], center, element.angle) as Point,
    ),
  );

  return {
    type: "polycurve",
    data: curves,
  };
};
