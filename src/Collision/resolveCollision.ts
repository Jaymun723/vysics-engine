import { PhysicalObject } from '../Objects'
import { CollisionInfo } from './CollisionInfo'

export const resolveCollision = (
  collision: CollisionInfo<PhysicalObject, PhysicalObject>,
  positionalCorrection?: { iterations: number; rate: number }
) => {
  if (collision.a.invMass === 0 && collision.b.invMass === 0) return

  // Positional
  if (positionalCorrection) {
    const correctionAmount =
      (collision.depth / (collision.a.invMass + collision.b.invMass)) *
      positionalCorrection.rate
    const correctionVector = collision.normal.mul(correctionAmount)
    collision.a.move(correctionVector.mul(-collision.a.invMass))
    collision.b.move(correctionVector.mul(collision.b.invMass))
  }

  const n = collision.normal
  const aVelocity = collision.a.velocity
  const bVelocity = collision.b.velocity

  const relativeVelocity = bVelocity.sub(aVelocity)

  const rVelocityInNormal = relativeVelocity.dot(n)

  if (rVelocityInNormal > 0) {
    return
  }

  const restitution = Math.min(collision.a.restitution, collision.b.restitution)
  const friction = Math.min(collision.a.friction, collision.b.friction)

  const jN =
    (-(1 + restitution) * rVelocityInNormal) /
    (collision.a.invMass + collision.b.invMass)
  const impulseNormal = n.mul(jN)

  collision.a.velocity = collision.a.velocity.sub(
    impulseNormal.mul(collision.a.invMass)
  )
  collision.b.velocity = collision.b.velocity.add(
    impulseNormal.mul(collision.b.invMass)
  )

  let tangent = relativeVelocity.sub(n.mul(relativeVelocity.dot(n)))

  if (tangent.x !== 0 || tangent.y !== 0) {
    tangent = tangent.normalize().mul(-1)
  }

  let jT =
    (-(1 + restitution) * relativeVelocity.dot(tangent) * friction) /
    (collision.a.invMass + collision.b.invMass)

  if (jT > jN) {
    jT = jN
  }

  const impulseTangent = tangent.mul(jT)

  collision.a.velocity = collision.a.velocity.sub(
    impulseTangent.mul(collision.a.invMass)
  )
  collision.b.velocity = collision.b.velocity.add(
    impulseTangent.mul(collision.b.invMass)
  )
}
