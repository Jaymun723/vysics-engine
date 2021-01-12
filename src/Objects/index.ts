import { Vec2D } from "maabm"
import { BaseRigidShape, RigidShape } from "../Shapes"

interface PhysicalObjectProps<Shape extends BaseRigidShape = RigidShape> {
  shape: Shape

  /**
   * Mass of the object in kg.
   * A mass of 0 will that the object is static (doesn't fall and can't me moved).
   */
  mass: number

  /**
   * @default 0.8
   */
  friction?: number

  /**
   * "Bounciness" of the object
   * @default 0.2
   */
  restitution?: number

  /**
   * In m*s^-1
   * @default new Vec2D(0, 0)
   */
  initialVelocity?: Vec2D

  /**
   * In rad*s^-1
   * @default 0
   */
  initialAngularVelocity?: number

  /**
   * Set if the object is affected by gravity.
   * An object with a mass of 0 will always ignore gravity.
   * @default true
   */
  hasGravity?: boolean

  /**
   * Resistance of an object in a fluid environment, such as air or water.
   * If not defined the object will be affected by drag.
   * @default undefined
   */
  dragCoefficient?: number
}

export class PhysicalObject<Shape extends BaseRigidShape = RigidShape> {
  /**
   * Handle by the engine.
   */
  public id = -1

  public shape: Shape

  /**
   * In N
   */
  public force = new Vec2D(0, 0)

  /**
   * In m*s^-2
   */
  public acceleration = new Vec2D(0, 0)

  /**
   * In kg
   */
  public mass: number

  public invMass: number

  /**
   * In m*s^-1
   */
  public velocity: Vec2D

  /**
   * The position is the distance between the origin the center of mass of the object.
   * In m
   */
  public position: Vec2D

  /**
   * Rotational/angular force.
   */
  public torque = 0

  /**
   * In rad*s^-2
   */
  public angularAcceleration = 0

  /**
   * In kg*m^2
   */
  public inertia: number

  public invInertia: number
  /**
   * In rad*s^-1
   */
  public angularVelocity: number

  /**
   * In rad
   */
  public angle: number

  public friction: number

  /**
   * "Bounciness" of the object
   */
  public restitution: number

  /**
   * Set if the object is affected by gravity.
   * An object with a mass of 0 will always ignore gravity.
   */
  public hasGravity: boolean

  /**
   * Resistance of an object in a fluid environment, such as air or water.
   * If not defined the object will be affected by drag.
   */
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

  /**
   * Performs the verlet integration on the object.
   * @param dt Interval of time between the last update.
   */
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

  /**
   * @param direction In m
   */
  public move(direction: Vec2D) {
    this.shape.move(direction)
    this.position = this.position.add(direction)
  }

  /**
   * @param angle In rad
   */
  public rotate(angle: number) {
    this.angle += angle
    this.shape.rotate(angle)
  }

  public copy() {
    const copy = new PhysicalObject({
      mass: this.mass,
      shape: this.shape.copy() as Shape,
      dragCoefficient: this.dragCoefficient,
      friction: this.friction,
      hasGravity: this.hasGravity,
      initialAngularVelocity: this.angularVelocity,
      initialVelocity: this.velocity,
      restitution: this.restitution,
    })
    copy.force = this.force
    copy.torque = this.torque

    return copy
  }
}
