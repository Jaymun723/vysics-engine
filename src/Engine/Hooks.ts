import { PhysicsEngine } from "."
import { PhysicalObject } from "../Objects"
import { CollisionInfo } from "../Collision"
import { Polygon, Vec2D } from "maabm"

export type UpdateHook = (engine: PhysicsEngine) => void

export const gravityHook: UpdateHook = (engine) => {
  for (const object of engine.objects) {
    if (object.hasGravity) {
      object.force = object.force.add(PhysicsEngine.gravity)
    }
  }
}

export const createDragHook = (density: number) => {
  const dragHook: UpdateHook = (engine) => {
    for (const object of engine.objects) {
      if (object.dragCoefficient) {
        const v = object.velocity
        const vSquared = v.mul(v)
        const area = object.shape.getArea()
        const f = vSquared.mul(area * density * object.dragCoefficient * -0.5)
        object.force = object.force.add(f)
      }
    }
  }

  return dragHook
}

interface ApplyFlickProps {
  object: PhysicalObject
  pointOfApplication: Vec2D
  force: Vec2D
}
export const applyFlick = ({ force, object, pointOfApplication }: ApplyFlickProps) => {
  if (object.shape.type === "circle") {
    const dist = object.position.sub(pointOfApplication).norm()

    if (dist > object.shape.radius) return
  } else {
    if (Polygon.isPointIn(object.shape.vertices, pointOfApplication) === -1) return
  }

  object.force = force
  const r = pointOfApplication.sub(object.position)
  object.torque = r.cross(force)
}

export type CollisionHook<T = void> = (collision: CollisionInfo<PhysicalObject, PhysicalObject>) => T
