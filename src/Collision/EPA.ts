import { Vec2D } from "maabm"
import { RigidShape } from "../Shapes"
import { supportFunction, tripleCrossProduct } from "./GJK"

export const EPSILON = 1e-5
const EPA_MAX_ITERATIONS = 100

export const EPA = (a: RigidShape, b: RigidShape, s: Vec2D[]) => {
  let iterations = 0

  while (iterations < EPA_MAX_ITERATIONS) {
    const edge = getNearestEdge(s)
    const sup = supportFunction(a, b, edge.normal)
    const d = Math.abs(sup.dot(edge.normal))

    if (d - edge.distance <= EPSILON) {
      return {
        normal: edge.normal,
        distance: edge.distance,
      }
    } else {
      s.splice(edge.index, 0, sup)
    }

    iterations++
  }

  throw new Error("EPA couldn't find a solution (max iterations used).")
}

export const getBarycenter = (simplex: Vec2D[]) => {
  let avg = new Vec2D(0, 0)
  for (const vertex of simplex) {
    avg = avg.add(vertex)
  }
  return avg.mul(1 / simplex.length)
}

const getNearestEdge = (simplex: Vec2D[]) => {
  const best = {
    distance: Infinity,
    normal: new Vec2D(0, 0),
    index: 0,
  }

  for (let i = 0; i < simplex.length; i++) {
    const j = (i + 1) % simplex.length
    const v1 = simplex[i]
    const v2 = simplex[j]

    const edge = v2.sub(v1)
    if (edge.squaredNorm() === 0) {
      continue
    }

    const originTov1 = v1

    let n = tripleCrossProduct(edge, originTov1, edge)

    if (n.squaredNorm() === 0) {
      n = new Vec2D(edge.y, -edge.x)
      const center = getBarycenter(simplex)
      const centerTov1 = v1.sub(center)
      if (n.dot(centerTov1) < 0) {
        n = n.mul(-1)
      }
    }

    const dist = Math.abs(n.dot(v1))

    if (dist < best.distance) {
      best.distance = dist
      best.index = j
      best.normal = n
    }
  }

  return best
}
