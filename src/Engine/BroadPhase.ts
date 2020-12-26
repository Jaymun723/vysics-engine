import { circleCircleCollision } from '../Collision/CircleCircle'
import { CollisionInfo } from '../Collision/CollisionInfo'
import { rectangleCircleCollision } from '../Collision/RectangleCircle'
import { rectangleRectangleCollision } from '../Collision/RectangleRectangle'
import { PhysicalObject } from '../Objects'

const converter = (objA: PhysicalObject, objB: PhysicalObject) => (
  collisionInfo: CollisionInfo
) => {
  return new CollisionInfo({
    ...collisionInfo,
    a: objA,
    b: objB,
  })
}

export const broadPhase = (objects: PhysicalObject[]) => {
  const collisions: CollisionInfo<PhysicalObject, PhysicalObject>[] = []

  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      const a = objects[i].shape
      const b = objects[j].shape
      const squaredDist = a.center.sub(b.center).squaredNorm()
      const radiusSum = (a.boundRadius + b.boundRadius) ** 2

      const convert = converter(objects[i], objects[j])

      if (radiusSum >= squaredDist) {
        if (a.type === 'circle' && b.type === 'circle') {
          const result = circleCircleCollision(a, b)
          if (result !== false) collisions.push(convert(result))
        } else if (a.type === 'rectangle' && b.type === 'rectangle') {
          const result = rectangleRectangleCollision(a, b)
          if (result !== false) collisions.push(convert(result))
        } else if (a.type === 'rectangle' && b.type === 'circle') {
          const result = rectangleCircleCollision(a, b)
          if (result !== false) collisions.push(convert(result))
        } else if (a.type === 'circle' && b.type === 'rectangle') {
          let result = rectangleCircleCollision(b, a)
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
