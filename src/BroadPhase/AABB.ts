import { Vec2D } from "maabm"
import { RigidShape } from "../Shapes"

export interface AABBox {
  min: Vec2D
  max: Vec2D
}

export const shapeToBox = (shape: RigidShape): AABBox => {
  return {
    min: shape.center.sub(shape.boundAABB.div(2)),
    max: shape.center.add(shape.boundAABB.div(2)),
  }
}

export const intersectAABB = (a: AABBox, b: AABBox) => {
  return a.min.x <= b.max.x && a.max.x >= b.min.x && a.min.y <= b.max.y && a.max.y >= b.min.y
}
