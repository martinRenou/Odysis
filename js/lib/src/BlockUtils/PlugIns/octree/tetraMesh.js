let Octree = require('./octree');
let Plane = require('./plane');
let Aabb = require('./aabb');
let mat4 = require('gl-matrix-mat4');
let vec3 = require('gl-matrix-vec3');
let mat3 = require('gl-matrix-mat3');
let Geometry = require('./geometry');

/**
 * A tetrahedrical mesh represented by the geometry buffers and a transformation matrix.
 *
 * @class
 * @param {Float32Array} nodeArray_ The array of nodes
 * @param {Uint32Array|Uint16Array} tetraArray_ The index array defining the tetrahedron
 * @param {vec3} center_ The center of the mesh
 * @param {Octree} octree_ The octree of the mesh
 * @param {mat4} matTransform_ The transformation matrix of the mesh
 * @param {float} scale_ The scale of the mesh
 */
class TetraMesh{
  constructor() {
    //tetrahedron informations
    this.nodeArray_ = null;
    this.tetraArray_ = null;
    this.dataArrays_ = null;

    this.center_ = [0, 0, 0];
    this.octree_ = new Octree();

    this.matTransform_ = mat4.create();
    this.scale_ = 1;

    this.countVertices_ = 0;
  }

  initTetraMesh(positions, tetraIndex, data){
    this.nodeArray_  = positions;
    this.tetraArray_ = tetraIndex;
    this.dataArrays_  = data;
    this.computeAabbAndCenter();
    this.computeOctree();
  }

  /**
   * Compute the root bounding box and the mesh center.
   */
  computeAabbAndCenter() {
    let vAr = this.nodeArray_;
    let aabb = this.octree_.aabbLoose_;
    aabb.min_ = [vAr[0], vAr[1], vAr[2]];
    aabb.max_ = [vAr[0], vAr[1], vAr[2]];
    let nbVertices = vAr.length / 3;
    for (var i = 0; i < nbVertices; ++i) {
      let j = i * 3;
      aabb.expandsWithPoint(vAr[j], vAr[j + 1], vAr[j + 2]);
    }
    this.center_ = aabb.computeCenter();
  }

  /**
   * Scale the mesh.
   *
   * @param {float|null} factor Optional parameter representing the scale factor
   */
  scale(factor) {
    let aabb = this.octree_.aabbLoose_;

    //if no parameter is given, we normalize the mesh size according the globalScale_
    let scale = this.scale_ = factor ? factor :
      TriMesh.globalScale_ / vec3.dist(aabb.min_, aabb.max_);
    let vAr = this.nodeArray_;
    let nbVar = vAr.length;
    for (let i = 0; i < nbVar; ++i)
      vAr[i] *= scale;
    vec3.scale(aabb.min_, aabb.min_, scale);
    vec3.scale(aabb.max_, aabb.max_, scale);
    vec3.scale(this.center_, this.center_, scale);
  }

  /**
   * Compute the mesh octree (used for picking).
   */
  computeOctree() {
    let vAr = this.nodeArray_;
    let iAr = this.tetraArray_;
    let nbTetras = iAr.length / 4;
    let tetrasAll = new Array(nbTetras);
    let tetrasAabb = new Array(nbTetras);
    for (let i = 0; i < nbTetras; ++i)
        {
      tetrasAll[i] = i;
      tetrasAabb[i] = new Aabb();
      let j = i * 4;
      let ind1 = iAr[j] * 3,
        ind2 = iAr[j + 1] * 3,
        ind3 = iAr[j + 2] * 3,
        ind4 = iAr[j + 3] * 3;
      let v1x = vAr[ind1],
        v1y = vAr[ind1 + 1],
        v1z = vAr[ind1 + 2];
      let v2x = vAr[ind2],
        v2y = vAr[ind2 + 1],
        v2z = vAr[ind2 + 2];
      let v3x = vAr[ind3],
        v3y = vAr[ind3 + 1],
        v3z = vAr[ind3 + 2];
      let v4x = vAr[ind4],
        v4y = vAr[ind4 + 1],
        v4z = vAr[ind4 + 2];
      Geometry.computeTetraAabb(
        tetrasAabb[i],
        v1x, v1y, v1z,
        v2x, v2y, v2z,
        v3x, v3y, v3z,
        v4x, v4y, v4z);
    }
    this.octree_.build(tetrasAll, tetrasAabb, this.octree_.aabbLoose_);
  }

  /**
   * Move the mesh center to a certain point.
   *
   * @param {vec3} destination The destination where the mesh center should be
   */
  moveTo(destination) {
    mat4.translate(this.matTransform_, mat4.create(),
      vec3.sub(destination, destination, this.center_));
  }

  /**
   * Make a slice from the trehadrical mesh.
   *
   * @param {Plane} plane The cutting plane
   */
  makeSlice(a, b, c, d) {
    let plane = new Plane();
    // Equation is a*X + b*Y +c*Z + d = 0
    plane.updateFromEquation(a, b, c, d);
    //transform the plane in the same space as the tetra mesh
    let origin = [plane.originX_, plane.originY_, plane.originZ_];
    let normal = [plane.normalX_, plane.normalY_, plane.normalZ_];
    vec3.normalize(normal, normal);
    let matInverse = mat4.create();
    mat4.invert(matInverse, this.matTransform_);
    vec3.transformMat4(origin, origin, matInverse);
    vec3.transformMat3(normal, normal, mat3.normalFromMat4(mat3.create(), matInverse));

    //plane octree intersection
    let iTetrasCandidates = this.octree_.intersectPlane(origin, normal);
    let nbTetrasCandidates = iTetrasCandidates.length;

    // Input arrays
    let pts = this.nodeArray_;
    let ids = this.tetraArray_;
    let datas = this.dataArrays_;

    // Output arrays
    let vArr = [];
    let dArrs = new Array(datas.length);
    for (let ind = 0, len = dArrs.length; ind < len; ind++) {
      dArrs[ind] = []; }
    let tmp = [0, 0, 0];

    //For each tetrahedron...
    for(let i = 0; i < nbTetrasCandidates; ++i) {
      let j = iTetrasCandidates[i] * 4;
      let id = ids.slice(j,j+4);
      let v1 = pts.slice(id[0]*3, id[0]*3 + 3),
        v2 = pts.slice(id[1]*3, id[1]*3 + 3),
        v3 = pts.slice(id[2]*3, id[2]*3 + 3),
        v4 = pts.slice(id[3]*3, id[3]*3 + 3);
      let dot1 = vec3.dot(normal, vec3.sub(tmp, origin, v1)) > 0 ? -1 : 1;
      let dot2 = vec3.dot(normal, vec3.sub(tmp, origin, v2)) > 0 ? -1 : 1;
      let dot3 = vec3.dot(normal, vec3.sub(tmp, origin, v3)) > 0 ? -1 : 1;
      let dot4 = vec3.dot(normal, vec3.sub(tmp, origin, v4)) > 0 ? -1 : 1;

      // If all the points are on the same side of the plane
      let absDot = dot1 + dot2 + dot3 + dot4;
      if ( absDot == 4 || absDot == -4 ) {
        continue;
      }

      let dot = [dot1, dot2, dot3, dot4];
      let v = [v1, v2, v3, v4];
      // the tetra is overlapping the plane
      let interPoints = [];
      let interScalars = new Array(datas.length);
      for (let ind = 0, len = interScalars.length; ind < len; ind++) {
        interScalars[ind] = []; }

      let vinter = [];
      let val, coeffInter;

      // For each edges find if there is an intersection
      for (let k = 0; k < 3; k++) {
        for(let l = k+1; l < 4 ; l++ ) {
          // Test if the two points are on the same side of the plane
          if (dot[k]*dot[l]>0) { continue; }
          vinter = Geometry.intersectionSegmentPlane(v[k], v[l], origin, normal);
          interPoints.push(vinter[0]);

          coeffInter = (vinter[1] / vec3.dist(v[k], v[l]));

          datas.forEach((data, dataIndex) => {
            val = data[id[k]] +
                  coeffInter * (data[id[l]] - data[id[k]]);

            interScalars[dataIndex].push(val);
          });
        }
      }
      v1 = interPoints[0];
      v2 = interPoints[1];
      v3 = interPoints[2];
      let s1 = [], s2 = [], s3 = [];

      interScalars.forEach((interScalar) => {
        s1.push(interScalar[0]);
        s2.push(interScalar[1]);
        s3.push(interScalar[2]);
      });

      //check if the winding of the 3 vertices
      if (vec3.dot(Geometry.normalNonUnitV(tmp, v1, v2, v3), normal) < 0.0) {
        // Fill vertex array
        vArr.push(v1, v2, v3);

        // Fill data arrays
        dArrs.forEach((dArr, dArrIndex) => {
          dArr.push(s1[dArrIndex], s2[dArrIndex], s3[dArrIndex]);
        });

        if (interPoints.length === 4) {
          // Fill vertex array
          vArr.push(v2, interPoints[3], v3);

          // Fill data arrays
          dArrs.forEach((dArr, dArrIndex) => {
            dArr.push(
                  s2[dArrIndex],
                  interScalars[dArrIndex][3],
                  s3[dArrIndex]
                );
          });
        }

      } else {
        vArr.push(v1, v3, v2);

        dArrs.forEach((dArr, dArrIndex) => {
          dArr.push(s1[dArrIndex], s3[dArrIndex], s2[dArrIndex]);
        });

        if (interPoints.length === 4) {
          vArr.push(v2, v3, interPoints[3]);

          dArrs.forEach((dArr, dArrIndex) => {
            dArr.push(
                  s2[dArrIndex],
                  s3[dArrIndex],
                  interScalars[dArrIndex][3]
                );
          });
        }
      }
    } // End for each tetra

    let nbPoints = vArr.length;
    let vArray = new Float32Array(nbPoints * 3);
    for (let i = 0; i < nbPoints; ++i) {
      vArray[i * 3] = vArr[i][0];
      vArray[i * 3 + 1] = vArr[i][1];
      vArray[i * 3 + 2] = vArr[i][2];
    }

    return { 'vertex': vArray, 'data': dArrs };
  }
}

module.exports = TetraMesh;
