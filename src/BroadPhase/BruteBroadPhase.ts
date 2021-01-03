import { circleCircleCollision, CollisionInfo, polygonCircleCollision, polygonPolygonCollision } from "../Collision"
import { PhysicalObject } from "../Objects"
import { intersectAABB, shapeToBox, converter, BroadPhaseBaseFunction } from "."

export const bruteBroadPhase: BroadPhaseBaseFunction = ({ objects }) => {
  const collisions: CollisionInfo<PhysicalObject, PhysicalObject>[] = []
  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      const a = objects[i].shape
      const b = objects[j].shape
      const aBox = shapeToBox(a)
      const bBox = shapeToBox(b)
      if (intersectAABB(aBox, bBox)) {
        const convert = converter(objects[i], objects[j])
        if (a.type === "circle" && b.type === "circle") {
          const result = circleCircleCollision(a, b)
          if (result !== false) collisions.push(convert(result))
        } else if (
          (a.type === "rectangle" || a.type === "polygon") &&
          (b.type === "rectangle" || b.type === "polygon")
        ) {
          const result = polygonPolygonCollision(a, b)
          if (result !== false) collisions.push(convert(result))
        } else if ((a.type === "rectangle" || a.type === "polygon") && b.type === "circle") {
          const result = polygonCircleCollision(a, b)
          if (result !== false) collisions.push(convert(result))
        } else if (a.type === "circle" && (b.type === "polygon" || b.type === "rectangle")) {
          let result = polygonCircleCollision(b, a)
          if (result !== false) {
            result = result.changeDirection()
            collisions.push(convert(result))
          }
        }
      }
    }
  }
  return collisions
}
