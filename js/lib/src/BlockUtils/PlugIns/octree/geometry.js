let vec3 = require('gl-matrix-vec3');

let Geometry = {};

/**
 * Normalize the mouse coordinates between -1 and 1.
 *
 * @param {int} mouseX X coordinate of the mouse
 * @param {int} mouseY Y coordinate of the mouse
 * @param {int} width The width of the screen
 * @param {int} height The height of the screen
 * @return {vec2} The normalized coordinates
 */
Geometry.normalizedMouse = function (mouseX, mouseY, width, height)
{
  return [(2 * mouseX / width) - 1, 1 - (2 * mouseY / height)];
};

/**
 * Projection of the mouse coordinates on an unit sphere.
 *
 * @param {vec2} mouseXY The mouse coordinates
 * @return {vec3} Normalized vector from the sphere's center to the projected point
 */
Geometry.mouseOnUnitSphere = function (mouseXY)
{
  let mouseX = mouseXY[0];
  let mouseY = mouseXY[1];
  let tempZ = 1 - mouseX * mouseX - mouseY * mouseY;
  let mouseZ = tempZ > 0 ? Math.sqrt(tempZ) : 0;
  let sourisSphere = [mouseX, mouseY, mouseZ];
  return vec3.normalize(sourisSphere, sourisSphere);
};

/**
 * Compute the intersection between a ray and a triangle. Returne false if it doesn't intersect.
 *
 * @param {vec3} s1 The first point of the ray
 * @param {vec3} s2 The second point of the ray
 * @param {vec3} v1 First point of the triangle
 * @param {vec3} v2 Second point of the triangle
 * @param {vec3} v3 Third point of the triangle
 * @param {vec3} normal The normal of the triangle (can be recomputed, but we prefer not to)
 * @param {vec3} vertInter The 3D intersection point between the triangle's plane and the ray
 * @return {bool} True if the ray intersects the triangle
 */
Geometry.intersectionRayTriangle = function (s1, s2, v1, v2, v3, normal, vertInter)
{
  let temp = [0, 0, 0];
  vec3.sub(temp, s1, v1);
  let dist1 = vec3.dot(temp, normal);
  let dist2 = vec3.dot(vec3.sub(temp, s2, v1), normal);
    //ray copplanar to triangle
  if ((dist1 * dist2) >= 0)
    return false;
    //intersection between ray and triangle
  let val = -dist1 / (dist2 - dist1);
  vec3.scaleAndAdd(vertInter, s1, vec3.sub(temp, s2, s1), val);
  let cross = [0, 0, 0];
  vec3.cross(cross, normal, vec3.sub(temp, v2, v1));
  if (vec3.dot(cross, vec3.sub(temp, vertInter, v1)) < 0)
    return false;
  vec3.cross(cross, normal, vec3.sub(temp, v3, v2));
  if (vec3.dot(cross, vec3.sub(temp, vertInter, v2)) < 0)
    return false;
  vec3.cross(cross, normal, vec3.sub(temp, v1, v3));
  if (vec3.dot(cross, vec3.sub(temp, vertInter, v1)) < 0)
    return false;
  return true;
};

/**
 * Compute the bounding box of a triangle defined by 3 points.
 *
 * @param {Aabb} aabb The bounding box to compute
 * @param {float} v1x X coordinate of the first point
 * @param {float} v1y Y coordinate of the first point
 * @param {float} v1z Z coordinate of the first point
 * @param {float} v2x X coordinate of the second point
 * @param {float} v2y Y coordinate of the second point
 * @param {float} v2z Z coordinate of the second point
 * @param {float} v3x X coordinate of the third point
 * @param {float} v3y Y coordinate of the third point
 * @param {float} v3z Z coordinate of the third point
 */
Geometry.computeTriangleAabb = function (aabb, v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z)
{
  let min = aabb.min_,
    max = aabb.max_;
  min[0] = Math.min(v1x, v2x, v3x);
  min[1] = Math.min(v1y, v2y, v3y);
  min[2] = Math.min(v1z, v2z, v3z);
  max[0] = Math.max(v1x, v2x, v3x);
  max[1] = Math.max(v1y, v2y, v3y);
  max[2] = Math.max(v1z, v2z, v3z);
};

/**
 * Compute the bounding box of a tetrahedron defined by 4 points.
 *
 * @param {Aabb} aabb The bounding box to compute
 * @param {float} v1x X coordinate of the first point
 * @param {float} v1y Y coordinate of the first point
 * @param {float} v1z Z coordinate of the first point
 * @param {float} v2x X coordinate of the second point
 * @param {float} v2y Y coordinate of the second point
 * @param {float} v2z Z coordinate of the second point
 * @param {float} v3x X coordinate of the third point
 * @param {float} v3y Y coordinate of the third point
 * @param {float} v3z Z coordinate of the third point
 * @param {float} v4x X coordinate of the fourth point
 * @param {float} v4y Y coordinate of the fourth point
 * @param {float} v4z Z coordinate of the fourth point
 */
Geometry.computeTetraAabb = function (aabb, v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z, v4x, v4y, v4z)
{
  let min = aabb.min_,
    max = aabb.max_;
  min[0] = Math.min(v1x, v2x, v3x, v4x);
  min[1] = Math.min(v1y, v2y, v3y, v4y);
  min[2] = Math.min(v1z, v2z, v3z, v4z);
  max[0] = Math.max(v1x, v2x, v3x, v4x);
  max[1] = Math.max(v1y, v2y, v3y, v4y);
  max[2] = Math.max(v1z, v2z, v3z, v4z);
};

/**
 * Compute the bounding box of a tetrahedron defined by 4 points.
 *
 * @param {Aabb} aabb The bounding box to compute
 * @param {Float32Array} vertexList List a coordinate of the object
 */
Geometry.computeGeometryAabb = function (aabb, vertexList)
{
  let min = aabb.min_,
    max = aabb.max_;
  min = Infinity;
  max = -Infinity;
  let xyz = 0;
  for (let i, n = vertexList.length ; i < n ; i++) {
    min[xyz] = Math.min(min[xyz], vertexList[i]);
    max[xyz] = Math.max(max[xyz], vertexList[i]);
    xyz = (xyz+1) % 3;
  }
};

/**
 * Compute the normal of a triangle defined by 3 points.
 *
 * @param {vec3} normal The normal to compute
 * @param {float} v1x X coordinate of the first point
 * @param {float} v1y Y coordinate of the first point
 * @param {float} v1z Z coordinate of the first point
 * @param {float} v2x X coordinate of the second point
 * @param {float} v2y Y coordinate of the second point
 * @param {float} v2z Z coordinate of the second point
 * @param {float} v3x X coordinate of the third point
 * @param {float} v3y Y coordinate of the third point
 * @param {float} v3z Z coordinate of the third point
 */
Geometry.normal = function (normal, v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z)
{
  let ax = v2x - v1x,
    ay = v2y - v1y,
    az = v2z - v1z;
  let bx = v3x - v1x,
    by = v3y - v1y,
    bz = v3z - v1z;
  let nx = 0,
    ny = 0,
    nz = 0;
  nx = ay * bz - az * by;
  ny = az * bx - ax * bz;
  nz = ax * by - ay * bx;
  let len = nx * nx + ny * ny + nz * nz;
  if (len !== 0)
    {
    len = 1 / Math.sqrt(len);
    normal[0] = nx * len;
    normal[1] = ny * len;
    normal[2] = nz * len;
  }
  return normal;
};

/**
 * Compute the non-normalized normal of a triangle defined by 3 points.
 *
 * @param {vec3} normal The normal to compute
 * @param {float} v1x X coordinate of the first point
 * @param {float} v1y Y coordinate of the first point
 * @param {float} v1z Z coordinate of the first point
 * @param {float} v2x X coordinate of the second point
 * @param {float} v2y Y coordinate of the second point
 * @param {float} v2z Z coordinate of the second point
 * @param {float} v3x X coordinate of the third point
 * @param {float} v3y Y coordinate of the third point
 * @param {float} v3z Z coordinate of the third point
 */
Geometry.normalNonUnit = function (normal, v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z)
{
  let ax = v2x - v1x,
    ay = v2y - v1y,
    az = v2z - v1z;
  let bx = v3x - v1x,
    by = v3y - v1y,
    bz = v3z - v1z;
  normal[0] = ay * bz - az * by;
  normal[1] = az * bx - ax * bz;
  normal[2] = ax * by - ay * bx;
  return normal;
};

// Same as Geometry.normalNonUnit
Geometry.normalNonUnitV = function (normal, v1, v2, v3)
{
  return Geometry.normalNonUnit(normal, v1[0], v1[1], v1[2], v2[0], v2[1], v2[2], v3[0], v3[1], v3[2]);
};

/**
 * Return true if a point is inside a triangle.
 * It tests the sum of the 3 areas created with the edges and the point.
 *
 * @param {vec3} point The point to test
 * @param {vec3} v1 First point of the triangle
 * @param {vec3} v2 Second point of the triangle
 * @param {vec3} v3 Third point of the triangle
 * @return {bool} True if the point lies inside the triangle
 */
Geometry.pointInsideTriangle = function (point, v1, v2, v3)
{
  let vec1 = [0, 0, 0];
  vec3.sub(vec1, v1, v2);
  let vec2 = [0, 0, 0];
  vec3.sub(vec2, v1, v3);
  let vecP1 = [0, 0, 0];
  vec3.sub(vecP1, point, v2);
  let vecP2 = [0, 0, 0];
  vec3.sub(vecP2, point, v3);
  let temp = [0, 0, 0];
  let total = vec3.len(vec3.cross(temp, vec1, vec2));
  let area1 = vec3.len(vec3.cross(temp, vec1, vecP1));
  let area2 = vec3.len(vec3.cross(temp, vec2, vecP2));
  let area3 = vec3.len(vec3.cross(temp, vecP1, vecP2));
  if (Math.abs(total - (area1 + area2 + area3)) < 0.000000001) //magic epsilon...
    return true;
  else
        return false;
};

/**
 * Return true if a triangle intersects or is inside a sphere.
 *
 * @param {vec3} point The point to test
 * @param {float} radiusSq The radius of the sphere squared
 * @param {vec3} v1 First point of the triangle
 * @param {vec3} v2 Second point of the triangle
 * @param {vec3} v3 Third point of the triangle
 * @return {bool} True if the point intersects or is inside the sphere
 */
Geometry.sphereIntersectTriangle = function (point, radiusSq, v1, v2, v3)
{
  if (Geometry.distanceToSegment(point, v1, v2) < radiusSq) return true;
  if (Geometry.distanceToSegment(point, v2, v3) < radiusSq) return true;
  if (Geometry.distanceToSegment(point, v1, v3) < radiusSq) return true;
  return false;
};

/**
 * Compute the distance from a point and a segment.
 *
 * @param {vec3} point The point to project on the segment
 * @param {vec3} v1 First point of the segment
 * @param {vec3} v2 Second point of the segment
 * @return {float} The distance between the point and the segment
 */
Geometry.distanceToSegment = function (point, v1, v2)
{
  let pt = [0, 0, 0];
  vec3.sub(pt, point, v1);
  let v2v1 = [0, 0, 0];
  vec3.sub(v2v1, v2, v1);
  let len = vec3.sqrLen(v2v1);
  let t = vec3.dot(pt, v2v1) / len;
  if (t < 0) return vec3.sqrLen(pt);
  if (t > 1) return vec3.sqrLen(vec3.sub(pt, point, v2));

  pt[0] = point[0] - v1[0] + t * v2v1[0];
  pt[1] = point[1] - v1[1] + t * v2v1[1];
  pt[2] = point[2] - v1[2] + t * v2v1[2];
  return vec3.sqrLen(pt);
};

/**
 * Compute the signed angle between two 2D vectors in radian.
 *
 * @param {vec2} v1 The first point
 * @param {vec2} v2 The second point
 * @return {float} The signed angle in radian
 */
Geometry.signedAngle2d = function (v1, v2)
{
  let v1x = v1[0],
    v1y = v1[1],
    v2x = v2[0],
    v2y = v2[1];
  return Math.atan2(v1x * v2y - v1y * v2x, v1x * v2x + v1y * v2y);
};

/**
 * Compute the shortest distance from a point to a plane.
 *
 * @param {vec3} v The point to project
 * @param {vec3} ptPlane A point on the plane
 * @param {vec3} nPlane The normal of the plane
 * @return {float} The distance between the point and the plane
 */
Geometry.pointPlaneDistance = function (v, ptPlane, nPlane)
{
  return vec3.dot(vec3.sub([0, 0, 0], v, ptPlane), nPlane);
};

/**
 * Mirror a point according to a plane.
 *
 * @param {vec3} v The point to mirror
 * @param {vec3} ptPlane A point on the plane
 * @param {vec3} nPlane The normal of the plane
 * @return {vec3} The position of the mirrored point
 */
Geometry.mirrorPoint = function (v, ptPlane, nPlane)
{
  return vec3.sub(v, v, vec3.scale([0, 0, 0], nPlane, Geometry.pointPlaneDistance(v, ptPlane, nPlane) * 2));
};

/**
 * Compute the projection of a point on a line.
 *
 * @param {vec3} v The point to project
 * @param {vec3} vNear A first point on the line
 * @param {vec3} nPlane A second point on the line
 * @return {vec3} The position of the projected point on the line
 */
Geometry.pointOnLine = function (v, vNear, vFar)
{
  let ab = [0, 0, 0];
  vec3.sub(ab, vFar, vNear);
  let temp = [0, 0, 0];
  let dot = vec3.dot(ab, vec3.sub(temp, v, vNear));
  return vec3.scaleAndAdd(temp, vNear, ab, dot / vec3.sqrLen(ab));
};

/**
 * Compute the intersection between a plane and a segment.
 *
 * @param {vec3} v1 The first point of the segment
 * @param {vec3} v2 The second point of the segment
 * @param {vec3} origin The origin of the plane
 * @param {vec3} normal The normal of the plane
 * @return {vec3} The position of the projected point on the line FIXME
 */
Geometry.intersectionSegmentPlane = function (v1, v2, origin, normal)
{
  let tmp = [0, 0, 0];
  let distToPlane = vec3.dot(vec3.sub(tmp, v1, origin), normal);
  let dotNormals = vec3.dot(normal, vec3.normalize(tmp, vec3.sub(tmp, v2, v1)));
  let t = -distToPlane / dotNormals;
  return [vec3.scaleAndAdd(tmp, v1, tmp, t), t];
};

module.exports = Geometry;
