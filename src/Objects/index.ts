import { Vec2D } from "maabm"
import { BaseRigidShape, RigidShape } from "../Shapes"

interface PhysicalObjectProps<Shape extends BaseRigidShape = RigidShape> {
  shape: Shape
  mass: number
  friction?: number
  restitution?: number
  initialVelocity?: Vec2D
  initialAngularVelocity?: number
}

export class PhysicalObject<Shape extends BaseRigidShape = RigidShape> {
  public shape: Shape
  public position: Vec2D
  public angle: number

  public velocity: Vec2D
  public angularVelocity: number

  public mass: number
  public invMass: number
  public friction: number
  public restitution: number
  public inertia: number

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
    this.friction = ops.friction || 0.8
    this.restitution = ops.restitution || 0.2

    this.inertia = this.shape.getInertia(this.mass)
  }

  public update(dt: number) {
    const acceleration = this.invMass !== 0 ? new Vec2D(0, 30) : new Vec2D(0, 0)
    const angularAcceleration = 0

    this.velocity = this.velocity.add(acceleration.mul(dt))
    this.move(this.velocity.mul(dt))

    this.angularVelocity += angularAcceleration * dt
    this.rotate(this.angularVelocity * dt)
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
