class Plane {
  constructor(/*gl*/) {
    this.originX_ = 0;
    this.originY_ = 0;
    this.originZ_ = 0;
    this.normalX_ = 1;
    this.normalY_ = 0;
    this.normalZ_ = 0;
  }

  /**
   * Initialize the geometry.
   */
  setValues(x, y, z, nx, ny, nz) {
    this.originX_ = x;
    this.originY_ = y;
    this.originZ_ = z;
    this.normalX_ = nx;
    this.normalY_ = ny;
    this.normalZ_ = nz;
  }

  /**
   * Compute the plan from the equation a*X + b*Y +c*Z + d = 0
   */
  updateFromEquation(a, b, c, d)
    {
    if (a !== 0){
      this.originX_ = -d/a;
      this.originY_ = 0;
      this.originZ_ = 0;
    }
    else if (b !== 0){
      this.originX_ = 0;
      this.originY_ = -d/b;
      this.originZ_ = 0;
    }
    else if (c !== 0){
      this.originX_ = 0;
      this.originY_ = 0;
      this.originZ_ = -d/c;
    }
    else{
      this.originX_ = 0;
      this.originY_ = 0;
      this.originZ_ = 0;
    }
    this.normalX_ = a;
    this.normalY_ = b;
    this.normalZ_ = c;
  }
}

module.exports = Plane;
