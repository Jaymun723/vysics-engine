import { Vec2D } from "maabm"
import { BaseRigidShape, RigidShape } from "../Shapes"

interface PhysicalObjectProps<Shape extends BaseRigidShape = RigidShape> {
  shape: Shape
  mass: number
  friction?: number
  restitution?: number
  initialVelocity?: Vec2D
  initialAngularVelocity?: number

  hasGravity?: boolean
  dragCoefficient?: number
}

export class PhysicalObject<Shape extends BaseRigidShape = RigidShape> {
  public id = -1

  public shape: Shape

  public force = new Vec2D(0, 0)
  public acceleration = new Vec2D(0, 0)
  public mass: number
  public invMass: number
  public velocity: Vec2D
  public position: Vec2D

  public torque = 0
  public angularAcceleration = 0
  public inertia: number
  public invInertia: number
  public angularVelocity: number
  public angle: number

  public friction: number
  public restitution: number

  public hasGravity: boolean
  public dragCoefficient?: number

  constructor(ops: PhysicalObjectProps<Shape>) {
    this.shape = ops.shape
    this.position = this.shape.center
    this.angle = this.shape.angle

    this.velocity = ops.initialVelocity || new Vec2D(0, 0)
    this.angularVelocity = ops.initialAngularVelocity || 0

    this.mass = ops.mass
    if (this.mass !== 0) {
      this.invMass = 1 / this.mass
    } else {
      this.invMass = 0
    }

    if (ops.hasGravity !== undefined) {
      this.hasGravity = ops.hasGravity
    } else {
      this.hasGravity = this.mass !== 0
    }

    this.friction = ops.friction || 0.8
    this.restitution = ops.restitution || 0.2

    if (this.mass !== 0) {
      this.inertia = this.shape.getInertia(this.mass)
      this.invInertia = 1 / this.inertia
    } else {
      this.inertia = 0
      this.invInertia = 0
    }

    this.dragCoefficient = ops.dragCoefficient
  }

  public update(dt: number) {
    const newPosition = this.position.add(this.velocity.mul(dt).add(this.acceleration.mul(dt ** 2 * 0.5)))

    const newAcceleration = this.force.mul(this.invMass)
    const newVelocity = this.velocity.add(this.acceleration.add(newAcceleration).mul(dt * 0.5))

    const deltaPos = newPosition.sub(this.position)
    this.move(deltaPos)
    this.acceleration = newAcceleration
    this.velocity = newVelocity

    this.force = new Vec2D(0, 0)

    const newAngle = this.angle + this.angularVelocity * dt + this.angularAcceleration * (dt ** 2 * 0.5)

    const newAngularAcceleration = this.torque * this.invInertia
    const newAngularVelocity = this.angularVelocity + (this.angularAcceleration + newAngularAcceleration) * (dt * 0.5)

    const deltaAng = newAngle - this.angle
    this.rotate(deltaAng)
    this.angularAcceleration = newAngularAcceleration
    this.angularVelocity = newAngularVelocity

    this.torque = 0
  }

  public move(direction: Vec2D) {
    this.shape.move(direction)
    this.position = this.position.add(direction)
  }

  public rotate(angle: number) {
    this.angle += angle
    this.shape.rotate(angle)
  }
}
