import { Vec2D } from "maabm"
import { CircleRigidShape } from "../Shapes"
import { CollisionInfo } from "."

export const circleCircleCollision = (a: CircleRigidShape, b: CircleRigidShape) => {
  const fromAtoB = b.center.sub(a.center)
  const squaredDist = fromAtoB.squaredNorm()
  const squaredRadiusSum = (a.radius + b.radius) ** 2

  if (squaredRadiusSum >= squaredDist) {
    if (squaredDist !== 0) {
      const depth = a.radius + b.radius - fromAtoB.norm()

      const normalFromBtoA = fromAtoB.mul(-1).normalize()
      const pointInRadiusB = b.center.add(normalFromBtoA.mul(b.radius))

      return new CollisionInfo({
        a,
        b,
        depth,
        normal: fromAtoB.normalize(),
        start: pointInRadiusB,
      })
    } else if (a.radius > b.radius) {
      return new CollisionInfo({
        a,
        b,
        depth: a.radius + b.radius,
        normal: new Vec2D(0, -1),
        start: a.center.add(0, a.radius),
      })
    } else {
      return new CollisionInfo({
        a,
        b,
        depth: a.radius + b.radius,
        normal: new Vec2D(0, -1),
        start: b.center.add(0, b.radius),
      })
    }
  }
  return false
}
