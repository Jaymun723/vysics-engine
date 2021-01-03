import { circleCircleCollision, CollisionInfo, polygonPolygonCollision, polygonCircleCollision } from "../Collision"
import { PhysicalObject } from "../Objects"
import { SpatialGrid, SpatialGridProps, converter, BroadPhaseBaseFunction, BroadPhaseBaseProps } from "."

export const gridBroadPhase: BroadPhaseBaseFunction<SpatialGridProps & BroadPhaseBaseProps> = ({
  objects,
  ...options
}) => {
  const grid = new SpatialGrid(options)
  const collisions: CollisionInfo<PhysicalObject, PhysicalObject>[] = []

  for (const obj of objects) {
    grid.insert(obj)
  }

  const couples = grid.checkCollision()

  for (const [a, b] of couples) {
    const convert = converter(a, b)
    if (a.shape.type === "circle" && b.shape.type === "circle") {
      const result = circleCircleCollision(a.shape, b.shape)
      if (result !== false) collisions.push(convert(result))
    } else if (
      (a.shape.type === "rectangle" || a.shape.type === "polygon") &&
      (b.shape.type === "rectangle" || b.shape.type === "polygon")
    ) {
      const result = polygonPolygonCollision(a.shape, b.shape)
      if (result !== false) collisions.push(convert(result))
    } else if ((a.shape.type === "rectangle" || a.shape.type === "polygon") && b.shape.type === "circle") {
      const result = polygonCircleCollision(a.shape, b.shape)
      if (result !== false) collisions.push(convert(result))
    } else if (a.shape.type === "circle" && (b.shape.type === "polygon" || b.shape.type === "rectangle")) {
      let result = polygonCircleCollision(b.shape, a.shape)
      if (result !== false) {
        result = result.changeDirection()
        collisions.push(convert(result))
      }
    }
  }

  return collisions
}
