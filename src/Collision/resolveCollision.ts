import { PhysicalObject } from "../Objects"
import { CollisionInfo } from "."

export const resolveCollision = (
  collision: CollisionInfo<PhysicalObject, PhysicalObject>,
  positionalCorrection?: { iterations: number; rate: number }
) => {
  if (collision.a.invMass === 0 && collision.b.invMass === 0) return

  if (positionalCorrection) {
    const correctionAmount = (collision.depth / (collision.a.invMass + collision.b.invMass)) * positionalCorrection.rate
    const correctionVector = collision.normal.mul(correctionAmount)
    collision.a.move(correctionVector.mul(-collision.a.invMass))
    collision.b.move(correctionVector.mul(collision.b.invMass))
  }

  const n = collision.normal

  const start = collision.start.mul(collision.b.invMass / (collision.a.invMass + collision.b.invMass))
  const end = collision.end.mul(collision.a.invMass / (collision.a.invMass + collision.b.invMass))
  const p = start.add(end)

  const rA = p.sub(collision.a.position)
  const rB = p.sub(collision.b.position)

  const aVelocity = collision.a.velocity.add(
    -1 * collision.a.angularVelocity * rA.y,
    collision.a.angularVelocity * rA.x
  )
  const bVelocity = collision.b.velocity.add(
    -1 * collision.b.angularVelocity * rB.y,
    collision.b.angularVelocity * rB.x
  )
  const relativeVelocity = bVelocity.sub(aVelocity)

  const rVelocityInNormal = relativeVelocity.dot(n)

  if (rVelocityInNormal > 0) {
    return
  }

  const restitution = Math.min(collision.a.restitution, collision.b.restitution)
  const friction = Math.min(collision.a.friction, collision.b.friction)

  const rACrossN = rA.cross(n)
  const rBCrossN = rB.cross(n)

  const jN =
    (-(1 + restitution) * rVelocityInNormal) /
    (collision.a.invMass +
      collision.b.invMass +
      rACrossN * rACrossN * collision.a.invInertia +
      rBCrossN * rBCrossN * collision.b.invInertia)

  const impulseNormal = n.mul(jN)

  collision.a.velocity = collision.a.velocity.sub(impulseNormal.mul(collision.a.invMass))
  collision.b.velocity = collision.b.velocity.add(impulseNormal.mul(collision.b.invMass))
  collision.a.angularVelocity -= rACrossN * jN * collision.a.invInertia
  collision.b.angularVelocity += rBCrossN * jN * collision.b.invInertia

  const tangent = relativeVelocity.sub(n.mul(rVelocityInNormal)).normalize().mul(-1)

  const rACrossT = rA.cross(tangent)
  const rBCrossT = rB.cross(tangent)

  let jT =
    (-(1 + restitution) * relativeVelocity.dot(tangent) * friction) /
    (collision.a.invMass +
      collision.b.invMass +
      rACrossT * rACrossT * collision.a.invInertia +
      rBCrossT * rBCrossT * collision.b.invInertia)

  if (jT > jN) {
    jT = jN
  }

  const impulseTangent = tangent.mul(jT)

  collision.a.velocity = collision.a.velocity.sub(impulseTangent.mul(collision.a.invMass))
  collision.b.velocity = collision.b.velocity.add(impulseTangent.mul(collision.b.invMass))
  collision.a.angularVelocity -= rACrossT * jT * collision.a.invInertia
  collision.b.angularVelocity += rBCrossT * jT * collision.b.invInertia
}
