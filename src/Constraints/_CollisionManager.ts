import { clamp, Vec2D } from "maabm"
import { PhysicalObject } from "../Objects"
import { Contact, PolygonCollisionInfo } from "./_Contacts"

export interface SolveContactOptions {
  info: PolygonCollisionInfo
  contact: Contact
  accumulate?: boolean
}

export const getRelativeVelocity = (a: PhysicalObject, rA: Vec2D, b: PhysicalObject, rB: Vec2D) => {
  const aVelocity = a.velocity.add(Vec2D.cross(a.angularVelocity, rB))
  const bVelocity = b.velocity.add(Vec2D.cross(b.angularVelocity, rB))
  const relativeVelocity = bVelocity.sub(aVelocity)
  return relativeVelocity
}

export const applyImpulse = (obj: PhysicalObject, impulse: Vec2D, r: Vec2D) => {
  obj.velocity = obj.velocity.add(impulse.mul(obj.invMass))
  obj.angularVelocity += obj.invInertia * r.cross(impulse)
}

export const solveContact = ({ contact, info, accumulate }: SolveContactOptions) => {
  const DEBUG = false

  const a = info.a
  const b = info.b
  const n = info.normal

  for (const contactPoint of contact.points) {
    const rA = contactPoint.sub(a.position)
    const rB = contactPoint.sub(b.position)

    let relativeVelocity = getRelativeVelocity(a, rA, b, rB)

    const rVelocityInNormal = relativeVelocity.dot(n)

    const rACrossN = rA.cross(n)
    const rBCrossN = rB.cross(n)

    let effectiveMassNormal = a.invMass + b.invMass
    effectiveMassNormal += a.invInertia * (rA.dot(rA) - rACrossN ** 2)
    effectiveMassNormal += b.invInertia * (rB.dot(rB) - rBCrossN ** 2)
    effectiveMassNormal = 1 / effectiveMassNormal

    let jN = -rVelocityInNormal * effectiveMassNormal

    if (accumulate) {
      const tmp = contact.normalAccumulator
      contact.normalAccumulator = Math.max(tmp + jN, 0)
      jN = contact.normalAccumulator - tmp
    } else {
      jN = Math.max(0, jN)
    }

    const impulseNormal = n.mul(jN)

    DEBUG && console.log("impulseNormal:", impulseNormal)

    // applyImpulse(a, impulseNormal.mul(1), rB)
    a.velocity = a.velocity.sub(impulseNormal.mul(a.invMass))
    a.angularVelocity -= rACrossN * jN * a.invInertia
    applyImpulse(b, impulseNormal, rB)

    // const t = n.cross(1)

    // relativeVelocity = getRelativeVelocity(a, rA, b, rB)

    // const rVelocityInTangent = relativeVelocity.dot(t)

    // const rACrossT = rA.cross(t)
    // const rBCrossT = rB.cross(t)

    // let effectiveMassTangent = a.invMass + b.invMass
    // effectiveMassTangent += a.invInertia * (rA.dot(rA) - rACrossT ** 2)
    // effectiveMassTangent += b.invInertia * (rB.dot(rB) - rBCrossT ** 2)
    // effectiveMassTangent = 1 / effectiveMassTangent

    // let jT = -rVelocityInTangent * effectiveMassTangent

    // const friction = Math.sqrt(a.friction * b.friction)

    // const maxFriction = jN * friction

    // if (accumulate) {
    //   const temp = contact.tangentAccumulator
    //   contact.tangentAccumulator = clamp(temp + jT, -maxFriction, maxFriction)
    //   jT = contact.tangentAccumulator - temp
    // } else {
    //   jT = clamp(jT, -maxFriction, maxFriction)
    // }

    // const impulseTangent = t.mul(jT)

    // applyImpulse(a, impulseTangent.mul(-1), rA)
    // applyImpulse(b, impulseTangent, rB)
  }
}

// export class CollisionManager {
//   public info: PolygonCollisionInfo
//   public contact: Contact

//   public DEBUG = false

//   public ACCUMULATE = true

//   constructor(ops: CollisionManagerOptions) {
//     this.info = ops.info
//   }

//   public solve(p: Vec2D) {
//     const DEBUG = this.DEBUG

//     const a = this.info.a
//     const b = this.info.b
//     const n = this.info.normal

//     DEBUG && console.log("solving for:")
//     DEBUG && console.log("a:", a)
//     DEBUG && console.log("b:", b)
//     DEBUG && console.log("n:", n)

//     // for (let i = 1; i < this.contact.points.length; i++) {
//     //   const contactPoint = this.contact.points[i]

//     const contactPoint = p

//     DEBUG && console.log("contactPoint:", contactPoint)

//     const rA = contactPoint.sub(a.position)
//     const rB = contactPoint.sub(b.position)

//     let relativeVelocity = this.getRelativeVelocity(a, rA, b, rB)

//     DEBUG && console.log("relativeVelocity:", relativeVelocity)

//     const rVelocityInNormal = relativeVelocity.dot(n)

//     const rACrossN = rA.cross(n)
//     const rBCrossN = rB.cross(n)

//     let effectiveMassNormal = a.invMass + b.invMass
//     effectiveMassNormal += a.invInertia * (rA.dot(rA) - rACrossN ** 2)
//     effectiveMassNormal += b.invInertia * (rB.dot(rB) - rBCrossN ** 2)
//     effectiveMassNormal = 1 / effectiveMassNormal

//     const restitution = Math.min(a.restitution, b.restitution)

//     let jN = -rVelocityInNormal * effectiveMassNormal

//     if (this.ACCUMULATE) {
//       const tmp = this.previousJN
//       this.previousJN = Math.max(tmp + jN, 0)
//       jN = this.previousJN - tmp
//     } else {
//       jN = Math.max(0, jN)
//     }

//     const impulseNormal = n.mul(jN)

//     DEBUG && console.log("impulseNormal:", impulseNormal)

//     // this.applyImpulse(a, impulseNormal.mul(-1), rA)

//     a.velocity = a.velocity.sub(impulseNormal.mul(a.invMass))

//     DEBUG && console.log(rA.cross(impulseNormal), jN * rACrossN)

//     a.angularVelocity -= rACrossN * jN * a.invInertia

//     DEBUG && console.log("a.velocity:", a.velocity)
//     DEBUG && console.log("a.angularVelocity:", a.angularVelocity)

//     this.applyImpulse(b, impulseNormal, rB)

//     const t = n.cross(1)

//     relativeVelocity = this.getRelativeVelocity(a, rA, b, rB)
//     const rVelocityInTangent = relativeVelocity.dot(t)

//     const rACrossT = rA.cross(t)
//     const rBCrossT = rB.cross(t)

//     let effectiveMassTangent = a.invMass + b.invMass
//     effectiveMassTangent += a.invInertia * (rA.dot(rA) - rACrossT ** 2)
//     effectiveMassTangent += b.invInertia * (rB.dot(rB) - rBCrossT ** 2)
//     effectiveMassTangent = 1 / effectiveMassTangent

//     let jT = -rVelocityInTangent * effectiveMassTangent

//     const friction = Math.sqrt(a.friction * b.friction)

//     const maxFriction = jN * friction

//     // 		if (World::accumulateImpulses)
//     // {
//     // 	// Compute friction impulse
//     // 	float maxPt = friction * c->Pn;

//     // 	// Clamp friction
//     // 	float oldTangentImpulse = c->Pt;
//     // 	c->Pt = Clamp(oldTangentImpulse + dPt, -maxPt, maxPt);
//     // 	dPt = c->Pt - oldTangentImpulse;
//     // }
//     // else
//     // {
//     // 	float maxPt = friction * dPn;
//     // 	dPt = Clamp(dPt, -maxPt, maxPt);
//     // }
//     // jT = clamp(jT, -maxFriction, maxFriction)

//     if (this.ACCUMULATE) {
//     }

//     const impulseTangent = t.mul(jT)

//     this.applyImpulse(a, impulseTangent.mul(-1), rA)
//     this.applyImpulse(b, impulseTangent, rB)
//     // }
//   }

//   private getRelativeVelocity(a: PhysicalObject, rA: Vec2D, b: PhysicalObject, rB: Vec2D) {
//     const aVelocity = a.velocity.add(Vec2D.cross(a.angularVelocity, rB))
//     const bVelocity = b.velocity.add(Vec2D.cross(b.angularVelocity, rB))
//     const relativeVelocity = bVelocity.sub(aVelocity)
//     return relativeVelocity
//   }

//   private applyImpulse(obj: PhysicalObject, impulse: Vec2D, r: Vec2D) {
//     obj.velocity = obj.velocity.add(impulse.mul(obj.invMass))
//     obj.angularVelocity += obj.invInertia * r.cross(impulse)
//   }
// }
