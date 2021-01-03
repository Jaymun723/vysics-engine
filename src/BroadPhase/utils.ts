import { CollisionInfo } from "../Collision"
import { PhysicalObject } from "../Objects"

export const converter = (objA: PhysicalObject, objB: PhysicalObject) => (collisionInfo: CollisionInfo) => {
  return new CollisionInfo({
    ...collisionInfo,
    a: objA,
    b: objB,
  })
}
