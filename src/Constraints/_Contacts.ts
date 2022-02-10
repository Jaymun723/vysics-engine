import { Vec2D } from "maabm"
import { PhysicalObject } from "../Objects"
import { PolygonRigidShape } from "../Shapes"
import { CollisionInfo } from "../Collision/CollisionInfo"

export type PolygonCollisionInfo = Omit<
  CollisionInfo<PhysicalObject<PolygonRigidShape>, PhysicalObject<PolygonRigidShape>>,
  "changeDirection"
>

export interface ContactOptions {
  collisionInfo: PolygonCollisionInfo
}

interface Edge {
  maxProj: Vec2D
  start: Vec2D
  end: Vec2D
}

export class Contact {
  public points: Vec2D[]

  public normalAccumulator = 0
  public tangentAccumulator = 0

  private collisionInfo: PolygonCollisionInfo

  constructor(ops: ContactOptions) {
    this.collisionInfo = ops.collisionInfo

    const n = this.collisionInfo.normal
    const e1 = this.bestEdge(this.collisionInfo.a.shape.vertices, n)
    const e2 = this.bestEdge(this.collisionInfo.b.shape.vertices, n.mul(-1))

    const { flipped, incident, reference } = this.getIncidentAndReference(e1, e2, n)

    const refEdge = reference.end.sub(reference.start)
    const refv = refEdge.normalize()

    const o1 = refv.dot(reference.start)

    let cp = this.clip(incident.start, incident.end, refv, o1)

    // if (cp.length < 2) throw new Error("No contact points")
    if (cp.length < 2) {
      console.warn("Contact has less than two points")
    }

    const o2 = refv.dot(reference.end)
    cp = this.clip(cp[0], cp[1], refv.mul(-1), -o2)

    // if (cp.length < 2) throw new Error("No contacts points")
    if (cp.length < 2) {
      console.warn("Contact has less than two points")
    }

    let refNorm = new Vec2D(-refv.y, refv.x)

    const max = refNorm.dot(reference.maxProj)

    // if (refNorm.dot(cp[0]) - max < 0.0) {
    //   cp = cp.filter((p) => !(p.x === cp[0].x && p.y === cp[0].y))
    // }
    // if (refNorm.dot(cp[1]) - max < 0.0) {
    //   cp = cp.filter((p) => !(p.x === cp[1].x && p.y === cp[1].y))
    // }

    for (let i = 0; i < cp.length; i++) {
      if (refNorm.dot(cp[i]) - max < 0) {
        // @ts-ignore
        // cp[i] = undefined
        delete cp[i]
      }
    }

    this.points = cp.filter(Boolean)
  }

  private clip(v1: Vec2D, v2: Vec2D, n: Vec2D, o: number) {
    let cp: Vec2D[] = []
    const d1 = n.dot(v1) - o
    const d2 = n.dot(v2) - o

    if (d1 >= 0) {
      cp.push(v1)
    }
    if (d2 >= 0) {
      cp.push(v2)
    }

    if (d1 * d2 < 0.0) {
      let e = v2.sub(v1)
      const u = d1 / (d1 - d2)
      const p = e.mul(u).add(v1)
      cp.push(p)
    }

    return cp
  }

  private getIncidentAndReference(e1: Edge, e2: Edge, n: Vec2D) {
    const e1V = e1.end.sub(e1.start)
    const e2V = e2.end.sub(e2.start)
    if (Math.abs(e1V.dot(n)) <= Math.abs(e2V.dot(n))) {
      return {
        reference: e1,
        incident: e2,
        flipped: false,
      }
    } else {
      return {
        reference: e2,
        incident: e1,
        flipped: true,
      }
    }
  }

  private bestEdge(vertices: Vec2D[], n: Vec2D): Edge {
    // this.DEBUG && console.log("this.bestEdge called with:")
    // this.DEBUG && console.log("  vertices:", vertices)
    // this.DEBUG && console.log("  n:", n)
    let max = -Infinity
    let i = 0
    for (let index = 0; index < vertices.length; index++) {
      const v = vertices[index]
      const projection = n.dot(v)
      if (projection > max) {
        max = projection
        i = index
      }
    }

    const h = (i + vertices.length - 1) % vertices.length
    const j = (i + 1) % vertices.length

    const vectorBefore = vertices[h]
    const vector = vertices[i]
    const vectorAfter = vertices[j]

    const leftVector = vector.sub(vectorAfter).normalize()
    const rightVector = vector.sub(vectorBefore).normalize()

    if (rightVector.dot(n) <= leftVector.dot(n)) {
      return {
        maxProj: vector,
        start: vectorBefore,
        end: vector,
      }
    } else {
      return {
        maxProj: vector,
        start: vector,
        end: vectorAfter,
      }
    }
  }
}
