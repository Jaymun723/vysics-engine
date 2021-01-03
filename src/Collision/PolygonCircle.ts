import { CircleRigidShape, PolygonRigidShape, RectangleRigidShape } from "../Shapes"
import { CollisionInfo } from "."

const nearestEdge = (a: PolygonRigidShape | RectangleRigidShape, b: CircleRigidShape) => {
  let bestDistance = -Infinity
  let nearestEdgeIndex = 0
  for (let i = 0; i < a.vertices.length; ++i) {
    const v = b.center.sub(a.vertices[i])
    const projection = v.dot(a.normals[i])
    if (projection > 0) {
      return {
        inside: false,
        nearestEdgeIndex: i,
        distance: projection,
      }
    }
    if (projection > bestDistance) {
      bestDistance = projection
      nearestEdgeIndex = i
    }
  }
  return {
    inside: true,
    nearestEdgeIndex,
    distance: bestDistance,
  }
}

export const polygonCircleCollision = (a: PolygonRigidShape | RectangleRigidShape, b: CircleRigidShape) => {
  const { distance, inside, nearestEdgeIndex } = nearestEdge(a, b)

  if (!inside) {
    const v1 = b.center.sub(a.vertices[nearestEdgeIndex])
    const v2 = a.vertices[(nearestEdgeIndex + 1) % a.vertices.length].sub(a.vertices[nearestEdgeIndex])
    const dot = v1.dot(v2)

    if (dot < 0) {
      const dist = v1.norm()
      if (dist > b.radius) {
        return false
      }
      const normal = v1.normalize()
      const radiusVec = normal.mul(-b.radius)
      return new CollisionInfo({
        a,
        b,
        depth: b.radius - dist,
        normal,
        start: b.center.add(radiusVec),
      })
    } else {
      const v1 = b.center.sub(a.vertices[(nearestEdgeIndex + 1) % a.vertices.length])
      const v2 = a.vertices[nearestEdgeIndex].sub(a.vertices[(nearestEdgeIndex + 1) % a.vertices.length])
      const dot = v1.dot(v2)
      if (dot < 0) {
        const dist = v1.norm()
        if (dist > b.radius) {
          return false
        }
        const normal = v1.normalize()
        const radiusVec = normal.mul(-b.radius)
        return new CollisionInfo({
          a,
          b,
          depth: b.radius - dist,
          normal,
          start: b.center.add(radiusVec),
        })
      } else if (distance < b.radius) {
        const radiusVec = a.normals[nearestEdgeIndex].mul(b.radius)
        return new CollisionInfo({
          a,
          b,
          depth: b.radius - distance,
          normal: a.normals[nearestEdgeIndex],
          start: b.center.sub(radiusVec),
        })
      } else {
        return false
      }
    }
  } else {
    const radiusVec = a.normals[nearestEdgeIndex].mul(b.radius)
    return new CollisionInfo({
      a,
      b,
      depth: b.radius - distance,
      normal: a.normals[nearestEdgeIndex],
      start: b.center.sub(radiusVec),
    })
  }
}
