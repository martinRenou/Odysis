/**
 * An Axis Aligned Bounding Box (Aabb).
 * It is defined by two 3D points.
 *
 * @class
 * @param {vec3} min_ The min 3D point
 * @param {vec3} max_ The max 3D point
 */
let vec3 = require('gl-matrix-vec3');

class Aabb {
  constructor(){
    this.min_ = [0, 0, 0];
    this.max_ = [0, 0, 0];
  }

  /**
   * Clone the aabb.
   *
   * @return {Aabb} The clone of the aabb
   */
  clone() {
    let ab = new Aabb();
    ab.min_ = this.min_.slice();
    ab.max_ = this.max_.slice();
    return ab;
  }

  /**
   * Copy the aabb.
   *
   * @param {Aabb} aabb The aabb to copy
   * @return {Aabb} The aabb
   */
  copy(aabb){
    vec3.copy(this.min_, aabb.min_);
    vec3.copy(this.max_, aabb.max_);
    return this;
  }

  /**
   * Set the aabb.
   *
   * @param {vec3} min The min 3D point
   * @param {vec3} max The max 3D point
   * @return {Aabb} The aabb
   */
  setCopy(min, max) {
    vec3.copy(this.min_, min);
    vec3.copy(this.max_, max);
    return this;
  }

  /**
   * Set the aabb.
   *
   * @param {float} xmin The x value of the min 3D point
   * @param {float} ymin The y value of the min 3D point
   * @param {float} zmin The z value of the min 3D point
   * @param {float} xmax The x value of the max 3D point
   * @param {float} ymax The y value of the max 3D point
   * @param {float} zmax The z value of the max 3D point
   * @return {Aabb} The aabb
   */
  set(xmin, ymin, zmin, xmax, ymax, zmax) {
    let min = this.min_,
      max = this.max_;
    min[0] = xmin;
    min[1] = ymin;
    min[2] = zmin;
    max[0] = xmax;
    max[1] = ymax;
    max[2] = zmax;
    return this;
  }

  /**
   * Compute the center of the aabb.
   *
   * @return {vec3} The center of the aabb
   */
  computeCenter() {
    let min = this.min_;
    let max = this.max_;
    return [
      (min[0] + max[0]) * 0.5,
      (min[1] + max[1]) * 0.5,
      (min[2] + max[2]) * 0.5];
  }

  /**
   * Test if the aabb touch themselves.
   *
   * @param {Aabb} aabb The aabb to test
   * @return {bool} False if the two aabb are completely separated
   */
  isOutside(aabb) {
    let min = this.min_,
      max = this.max_;
    let abmin = aabb.min_,
      abmax = aabb.max_;

    if (abmin[0] > max[0] || abmax[0] < min[0]) return true;
    if (abmin[1] > max[1] || abmax[1] < min[1]) return true;
    if (abmin[2] > max[2] || abmax[2] < min[2]) return true;
    return false;
  }

  /**
   * Test if the aabb is inside another aabb.
   *
   * @param {Aabb} aabb The aabb to test
   * @return {bool} True if the aabb is inside the another aabb
   */
  isInside(aabb) {
    let min = this.min_,
      max = this.max_;
    let abmin = aabb.min_,
      abmax = aabb.max_;

    if (min[0] >= abmin[0] && max[0] <= abmax[0] &&
            min[1] >= abmin[1] && max[1] <= abmax[1] &&
            min[2] >= abmin[2] && max[2] <= abmax[2])
      return true;
    return false;
  }

  /**
   * Test a 3D point is inside the aabb.
   *
   * @param {vec3} vert The 3D point
   * @return {bool} True if the 3D point is inside the aabb
   */
  pointInside(vert) {
    let min = this.min_,
      max = this.max_;
    let vx = vert[0],
      vy = vert[1],
      vz = vert[2];

    if (vx <= min[0]) return false;
    if (vx > max[0]) return false;
    if (vy <= min[1]) return false;
    if (vy > max[1]) return false;
    if (vz <= min[2]) return false;
    if (vz > max[2]) return false;
    return true;
  }

  /**
   * Expand the size of the aabb to include a 3D point.
   *
   * @param {int} vx X coordinate of the point
   * @param {int} vy Y coordinate of the point
   * @param {int} vz Z coordinate of the point
   */
  expandsWithPoint(vx, vy, vz) {
    let min = this.min_,
      max = this.max_;

    if (vx > max[0]) max[0] = vx;
    if (vx < min[0]) min[0] = vx;
    if (vy > max[1]) max[1] = vy;
    if (vy < min[1]) min[1] = vy;
    if (vz > max[2]) max[2] = vz;
    if (vz < min[2]) min[2] = vz;
  }

  /**
   * Expand the size of the aabb to include another aabb.
   *
   * @param {Aabb} aabb The another aabb that will be include
   */
  expandsWithAabb(aabb){
    let min = this.min_,
      max = this.max_;
    let abmin = aabb.min_,
      abmax = aabb.max_;
    let abminx = abmin[0],
      abminy = abmin[1],
      abminz = abmin[2];
    let abmaxx = abmax[0],
      abmaxy = abmax[1],
      abmaxz = abmax[2];

    if (abmaxx > max[0]) max[0] = abmaxx;
    if (abminx < min[0]) min[0] = abminx;
    if (abmaxy > max[1]) max[1] = abmaxy;
    if (abminy < min[1]) min[1] = abminy;
    if (abmaxz > max[2]) max[2] = abmaxz;
    if (abminz < min[2]) min[2] = abminz;
  }

  /**
   * Intersection between the aabb and a ray.
   *
   * @param {vec3} vNear The near 3D point of the ray
   * @param {vec3} rayInv The direction of the ray, inverted for useless
   * performance reasons
   * @return {bool} True if a ray intersection the box
   */
  intersectRay(vNear, rayInv) {
    let min = this.min_,
      max = this.max_;
    let irx = rayInv[0],
      iry = rayInv[1],
      irz = rayInv[2];
    let vx = vNear[0],
      vy = vNear[1],
      vz = vNear[2];

    let t1 = (min[0] - vx) * irx,
      t2 = (max[0] - vx) * irx,
      t3 = (min[1] - vy) * iry,
      t4 = (max[1] - vy) * iry,
      t5 = (min[2] - vz) * irz,
      t6 = (max[2] - vz) * irz;

    let tmin = Math.max(
        Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6)),
      tmax = Math.min(
        Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));
    return (tmax >= 0 && tmin < tmax);
  }

  /**
   * Intersection between the aabb and a sphere.
   *
   * @param {vec3} vert The center of the sphere
   * @param {float} radiusSquared The squared radius of the sphere
   * @return {bool} True if the sphere intersect with the box
   */
  intersectSphere(vert, radiusSquared) {
    let min = this.min_,
      max = this.max_;
    let vx = vert[0],
      vy = vert[1],
      vz = vert[2];

    let nearest = [0, 0, 0];
    if (min[0] > vx) nearest[0] = min[0];
    else if (max[0] < vx) nearest[0] = max[0];
    else nearest[0] = vx;

    if (min[1] > vy) nearest[1] = min[1];
    else if (max[1] < vy) nearest[1] = max[1];
    else nearest[1] = vy;

    if (min[2] > vz) nearest[2] = min[2];
    else if (max[2] < vz) nearest[2] = max[2];
    else nearest[2] = vz;

    return vec3.sqrDist(vert, nearest) < radiusSquared;
  }

  /**
   * Intersection between the aabb and a plane.
   *
   * @param {vec3} origin The origin of the plane
   * @param {vec3} normal The normal of the plane
   * @return {bool} True if the plane intersect with the box
   */
  intersectPlane(origin, normal) {
    let center = this.computeCenter();
    let lenSqr = vec3.sqrDist(this.min_, this.max_) * 0.25;
    let distToPlane = vec3.dot(vec3.sub(center, center, origin), normal);
    return (distToPlane * distToPlane) < lenSqr;
  }
}

module.exports = Aabb;
