import { Vec2D } from "maabm"
import { RigidShape } from "../Shapes"
import { EPSILON } from "./EPA"

export const tripleCrossProduct = (a: Vec2D, b: Vec2D, c: Vec2D) => {
  const ac = a.dot(c)
  const bc = b.dot(c)

  const r = b.mul(ac).sub(a.mul(bc))
  if (r.squaredNorm() < EPSILON * EPSILON) {
    return r.mul(0)
  }
  return r.normalize()
}

export const supportFunction = (a: RigidShape, b: RigidShape, d: Vec2D) => {
  return a.furthestPoint(d).sub(b.furthestPoint(d.mul(-1)))
}

const GJK_MAX_ITERATIONS = 30

export const GJK = (a: RigidShape, b: RigidShape) => {
  let iterations = 0
  let lastSup: Vec2D
  let simplex: Vec2D[] = []

  let dir = a.center.sub(b.center).normalize()

  if (dir.squaredNorm() < EPSILON) {
    dir = new Vec2D(1, 0)
  }

  lastSup = supportFunction(a, b, dir)
  simplex.push(lastSup)

  if (lastSup.dot(dir) <= 0) {
    return false
  }

  dir = dir.mul(-1)

  while (iterations < GJK_MAX_ITERATIONS) {
    if (dir.squaredNorm() === 0 && simplex.length >= 2) {
      dir = simplex[simplex.length - 1].sub(simplex[simplex.length - 2])
      dir = new Vec2D(dir.y, -dir.x)
    }

    lastSup = supportFunction(a, b, dir)

    if (lastSup.dot(dir) <= 0) {
      return false
    }

    simplex.push(lastSup)

    if (simplex.length === 2) {
      const a = simplex[1]
      const b = simplex[0]
      const ab = b.sub(a)
      const ao = a.mul(-1)
      if (ab.squaredNorm() !== 0) {
        dir = tripleCrossProduct(ab, ao, ab)
      } else {
        dir = ao.normalize()
      }
    } else if (simplex.length === 3) {
      const a = simplex[2]
      const b = simplex[1]
      const c = simplex[0]
      const ab = b.sub(a)
      const ac = c.sub(a)
      const ao = a.mul(-1)

      var abp = tripleCrossProduct(ac, ab, ab)
      var acp = tripleCrossProduct(ab, ac, ac)
      if (abp.dot(ao) > 0) {
        simplex.splice(0, 1)
        dir = abp
      } else if (acp.dot(ao) > 0) {
        simplex.splice(1, 1)
        dir = acp
      } else {
        return simplex
      }
    }

    iterations++
  }

  console.warn("GJK used max iterations.")
  return false
}
