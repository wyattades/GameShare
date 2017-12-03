export const generatePolygonFromEllipse = (w, h, numOfPoints = 10) => {

  const radiusX = w / 2;
  const radiusY = h / 2;

  const TWO_PI = Math.PI * 2;
  const delta = TWO_PI / numOfPoints;

  const points = [];

  for (let a = 0; a < TWO_PI; a += delta) {
    points.push([
      (radiusX * Math.cos(a)),
      (radiusY * Math.sin(a)),
    ]);
  }

  return points;
};
