import { Vec2D } from "maabm"
import { CollisionInfo } from "."
import { RectangleRigidShape, PolygonRigidShape } from "../Shapes"

interface SupportPoint {
  dist: number
  point: Vec2D
}

const findSupportPoint = (vertices: Vec2D[], dir: Vec2D, ptOnEdge: Vec2D) => {
  const supportPoint = {
    dist: -Infinity,
    point: undefined as Vec2D | undefined,
  }
  for (const vertex of vertices) {
    const vToEdge = vertex.sub(ptOnEdge)
    const projection = vToEdge.dot(dir)
    if (projection > 0 && projection > supportPoint.dist) {
      supportPoint.point = vertex
      supportPoint.dist = projection
    }
  }

  if (supportPoint.point === undefined) {
    return undefined
  } else {
    return supportPoint as SupportPoint
  }
}

const findAxisLeastPenetration = (
  a: PolygonRigidShape | RectangleRigidShape,
  b: PolygonRigidShape | RectangleRigidShape
) => {
  let supportPoint
  let bestDistance = Infinity
  let bestIndex = 0
  let hasSupport = true
  let i = 0
  while (hasSupport && i < a.normals.length) {
    const n = a.normals[i]

    const dir = n.mul(-1)
    const ptOnEdge = a.vertices[i]

    const tempSupportPoint = findSupportPoint(b.vertices, dir, ptOnEdge)
    hasSupport = tempSupportPoint !== undefined

    if (tempSupportPoint !== undefined && tempSupportPoint.dist < bestDistance) {
      bestDistance = tempSupportPoint.dist
      bestIndex = i
      supportPoint = tempSupportPoint.point
    }
    i++
  }
  if (hasSupport && supportPoint) {
    const normal = a.normals[bestIndex]
    const start = supportPoint.add(normal.mul(bestDistance))
    return new CollisionInfo({
      a,
      b,
      depth: bestDistance,
      normal,
      start,
    })
  }
  return false
}

export const polygonPolygonCollision = (
  a: PolygonRigidShape | RectangleRigidShape,
  b: PolygonRigidShape | RectangleRigidShape
) => {
  const axisAB = findAxisLeastPenetration(a, b)
  if (axisAB !== false) {
    const axisBA = findAxisLeastPenetration(b, a)
    if (axisBA !== false) {
      // When depth is equal it s broken need fix
      if (axisAB.depth < axisBA.depth) {
        const depthVec = axisAB.normal.mul(axisAB.depth)
        return new CollisionInfo({
          a,
          b,
          depth: axisAB.depth,
          normal: axisAB.normal,
          start: axisAB.start.sub(depthVec),
        })
      } else {
        return new CollisionInfo({
          a,
          b,
          depth: axisBA.depth,
          normal: axisBA.normal.mul(-1),
          start: axisBA.start,
        })
      }
    }
  }
  return false
}
