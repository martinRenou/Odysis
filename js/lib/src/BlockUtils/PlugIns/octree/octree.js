/**
 * The octree is used as an acceleration structure.
 * It is a loose octree, a special kind of octree with two boundary instead of one.
 * A first boundary (loose) will include all the primitive inside the cell.
 * The second boundary (split) is solely used to compute in which cell a primitive will land.
 * The loose boundary is bigger than the split boundary.
 * Note: The octree doesn't care which primitive it will contain, it only requires the primitive
 * to have it's own aabb... the octree will then store index's primitive
 *
 * @class
 * @param {Octree} parent_ The parent of the cell, null if the current cell is the root
 * @param {Octree[]} child_ The children, either 8 or empty if the current cell is a leaf
 * @param {int} depth_ The depth of the cell
 * @param {Aabb} aabbLoose_ Extended boundary for intersect test
 * @param {Aabb} aabbSplit_ Boundary used to define if a primitive is inside the cell or not
 * @param {int[]} indices_ The primitives indices inside the cell, empty if the cell is not a leaf
 */
let Aabb = require('./aabb');

class Octree{
  constructor(parent, depth) {
    this.parent_ = typeof parent !== 'undefined' ? parent : null;
    this.child_ = [];
    this.depth_ = typeof depth !== 'undefined' ? depth : 0;
    this.aabbLoose_ = new Aabb();
    this.aabbSplit_ = new Aabb();
    this.indices_ = [];

    /** Maximum depth */
    this.maxDepth_ = 6;
  }

  /**
   * Build an octree cell.
   * It simply defines which primitive will be included in the cell.
   * It tests if the primitive center is inside the split aabb.
   * If it is inside the loose aabb is extended to include the whole primitive.
   *
   * @param {int[]} indices The indices of the primitives
   * @param {Aabb[]} idAabb The aabb of the primitives
   * @param {Aabb} aabb The base aabb of the cell
   */
  build (indices, idAabb, aabb) {
    let aabbSplit = this.aabbSplit_;
    let aabbLoose = this.aabbLoose_;
    aabbSplit.copy(aabb);
    aabbLoose.copy(aabb);
    this.indices_.length = 0;
    let cellIndices = this.indices_;

    for (let i = 0, len = indices.length; i < len; i++) {
      let index = indices[i];
      let t = idAabb[index];
      if (aabbSplit.pointInside(t.computeCenter())) {
        aabbLoose.expandsWithAabb(t);
        cellIndices.push(index);
      }
    }

    let nbIndicesCell = cellIndices.length;

    if (this.depth_ < this.maxDepth_) {
      this.constructCells(idAabb);
    }
  }

  /**
   * Construct the children cell.
   * It simply cuts the cell in 8 sub cells.
   *
   * @param {Aabb[]} idAabb The aabb of the primitives
   */
  constructCells (idAabb) {
    let child = this.child_;
    let indices = this.indices_;
    let min = this.aabbSplit_.min_,
      max = this.aabbSplit_.max_;
    let xmin = min[0],
      ymin = min[1],
      zmin = min[2];
    let xmax = max[0],
      ymax = max[1],
      zmax = max[2];
    let cen = this.aabbSplit_.computeCenter();
    let xcen = cen[0],
      ycen = cen[1],
      zcen = cen[2];
    let dX = (xmax - xmin) * 0.5,
      dY = (ymax - ymin) * 0.5,
      dZ = (zmax - zmin) * 0.5;
    let nextDepth = this.depth_ + 1;
    let aabb = new Aabb();

    child[0] = new Octree(this, nextDepth);
    child[0].build(indices, idAabb, aabb.set(min[0], min[1], min[2], cen[0], cen[1], cen[2]));
    child[1] = new Octree(this, nextDepth);
    child[1].build(indices, idAabb, aabb.set(xmin + dX, ymin, zmin, xcen + dX, ycen, zcen));
    child[2] = new Octree(this, nextDepth);
    child[2].build(indices, idAabb, aabb.set(xcen, ycen - dY, zcen, xmax, ymax - dY, zmax));
    child[3] = new Octree(this, nextDepth);
    child[3].build(indices, idAabb, aabb.set(xmin, ymin, zmin + dZ, xcen, ycen, zcen + dZ));
    child[4] = new Octree(this, nextDepth);
    child[4].build(indices, idAabb, aabb.set(xmin, ymin + dY, zmin, xcen, ycen + dY, zcen));
    child[5] = new Octree(this, nextDepth);
    child[5].build(indices, idAabb, aabb.set(xcen, ycen, zcen - dZ, xmax, ymax, zmax - dZ));
    child[6] = new Octree(this, nextDepth);
    child[6].build(indices, idAabb, aabb.setCopy(cen, max));
    child[7] = new Octree(this, nextDepth);
    child[7].build(indices, idAabb, aabb.set(xcen - dX, ycen, zcen, xmax - dX, ymax, zmax));

    this.indices_.length = 0;
  }

  /**
   * Return all the primitives in the cells hit by the ray.
   *
   * @param {vec3} vNear The near 3D point of the ray
   * @param {vec3} rayInv The direction of the ray, inverted for useless performance reasons
   * @return {int[]} All the indices inside the cells that were hit
   */
  intersectRay (vNear, rayInv) {
    if (this.aabbLoose_.intersectRay(vNear, rayInv)) {
      if (this.child_[0]) {
        let totalIndices = [];
        let child = this.child_;
        for (let i = 0; i < 8; ++i) {
          let indices = child[i].intersectRay(vNear, rayInv);
          totalIndices.push.apply(totalIndices, indices);
        }
        return totalIndices;
      } else {
        return this.indices_;
      }
    }
    return [];
  }

  /**
   * Return all the primitives in the cells intersected by a plane.
   *
   * @param {vec3} origin The origin of the plane
   * @param {vec3} normal The normal of the plane
   * @return {int[]} All the indices inside the cells that were hit
   */
  intersectPlane (origin, normal) {
    if (this.aabbLoose_.intersectPlane(origin, normal)) {
      if (this.child_[0]) {
        let totalIndices = [];
        let child = this.child_;
        for (let i = 0; i < 8; ++i) {
          let indices = child[i].intersectPlane(origin, normal);
          totalIndices = totalIndices.concat(indices);
        }

        return totalIndices;
      } else {
        return this.indices_;
      }
    }
    return [];
  }
}


module.exports = Octree;
