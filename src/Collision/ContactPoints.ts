// https://pybullet.org/Bullet/phpBB3/viewtopic.php?p=&f=&t=288

import { Vec2D } from "maabm"
import { PolygonRigidShape, RectangleRigidShape, RigidShape } from "../Shapes"

interface Edge {
  maxProj: Vec2D
  start: Vec2D
  end: Vec2D
}

interface GetContactPointsOptions {
  a: RigidShape
  b: RigidShape
  normal: Vec2D
}

export const getContactPoints = ({ a, b, normal: n }: GetContactPointsOptions) => {
  if (a.type === "circle") {
    return [a.furthestPoint(n)]
  } else if (b.type === "circle") {
    return [b.furthestPoint(n)]
  }

  const e1 = bestEdge(a, n)
  const e2 = bestEdge(b, n.mul(-1))

  const { incident, reference } = getIncidentAndReference(e1, e2, n)

  const refEdge = reference.end.sub(reference.start)
  const refv = refEdge.normalize()

  const o1 = refv.dot(reference.start)

  let cp = clip(incident.start, incident.end, refv, o1)

  if (cp.length < 2) {
    console.warn("Contact has less than two points")
    return []
  }

  const o2 = refv.dot(reference.end)
  cp = clip(cp[0], cp[1], refv.mul(-1), -o2)

  if (cp.length < 2) {
    console.warn("Contact has less than two points")
    return []
  }

  let refNorm = new Vec2D(-refv.y, refv.x)

  const max = refNorm.dot(reference.maxProj)

  for (let i = 0; i < cp.length; i++) {
    if (refNorm.dot(cp[i]) - max < 0) {
      delete cp[i]
    }
  }

  return cp.filter(Boolean)
}

const clip = (v1: Vec2D, v2: Vec2D, n: Vec2D, o: number) => {
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

const getIncidentAndReference = (e1: Edge, e2: Edge, n: Vec2D) => {
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

const bestEdge = (shape: PolygonRigidShape | RectangleRigidShape, n: Vec2D): Edge => {
  const vertices = shape.vertices
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
