import { Vec2D } from "maabm"
import { PhysicalObject } from "../Objects"
import { BaseRigidShape } from "../Shapes"
import { Matrix } from "../tmp/Matrix"
import { BaseConstraint, BaseConstraintOptions } from "./Constraint"

interface ContactConstraintOptions<A extends BaseRigidShape, B extends BaseRigidShape>
  extends BaseConstraintOptions<A, B> {
  contacts: Vec2D[]
  normal: Vec2D
  depth: number
  /**
   * @default 0.2
   */
  beta?: number
}

export class ContactConstraint<A extends BaseRigidShape, B extends BaseRigidShape> extends BaseConstraint<A, B> {
  private contacts: Vec2D[]
  private normal: Vec2D
  private depth: number

  private beta: number

  private invMass: undefined | number[][]
  private jacobian: undefined | number[][]
  private bias: undefined | number

  constructor(options: ContactConstraintOptions<A, B>) {
    super(options)
    this.a = options.a
    this.b = options.b
    this.contacts = options.contacts
    this.normal = options.normal
    this.depth = options.depth

    this.beta = options.beta || 0.2
  }

  computeValue() {
    return -this.depth
  }

  preStep(dt: number) {
    this.invMass = [
      [this.a.invMass, 0, 0, 0, 0, 0],
      [0, this.a.invMass, 0, 0, 0, 0],
      [0, 0, this.a.invInertia, 0, 0, 0],
      [0, 0, 0, this.b.invMass, 0, 0],
      [0, 0, 0, 0, this.b.invMass, 0],
      [0, 0, 0, 0, 0, this.b.invInertia],
    ]

    const pA = this.contacts[0]
    const cA = this.a.position
    const pB = this.contacts[1]
    const cB = this.b.position

    this.jacobian = [
      [
        this.normal.x,
        this.normal.y,
        Vec2D.cross(pA.sub(cA), this.normal),
        -this.normal.x,
        -this.normal.y,
        -Vec2D.cross(pB.sub(cB), this.normal),
      ],
    ]

    this.bias = (this.beta / dt) * this.depth
  }

  applyImpulse() {
    if (!this.bias || !this.jacobian || !this.invMass) return
    const jXInvMass = Matrix.mult(this.jacobian, this.invMass)
    const lambdaDenominator = Matrix.mult(jXInvMass, Matrix.transpose(this.jacobian))[0][0]

    if (Math.abs(lambdaDenominator) <= 1e-15) return

    const v = [
      [this.a.velocity.x],
      [this.a.velocity.y],
      [this.a.angularVelocity],
      [this.b.velocity.x],
      [this.b.velocity.y],
      [this.b.angularVelocity],
    ]

    const jXv = Matrix.mult(this.jacobian, v)[0][0]

    const coef = 1
    const bias = this.bias + -Matrix.mult(this.jacobian, v)[0][0] * coef

    let lambda = -(jXv + bias) / lambdaDenominator

    // lambda = Math.min(0, lambda)

    const impulse = Matrix.transpose(Matrix.scale(this.jacobian, lambda))

    const newVelocity = Matrix.add(v, Matrix.mult(this.invMass, impulse))

    this.a.velocity = new Vec2D(newVelocity[0][0], newVelocity[1][0])
    this.a.angularVelocity = newVelocity[2][0]
    this.b.velocity = new Vec2D(newVelocity[3][0], newVelocity[4][0])
    this.b.angularVelocity = newVelocity[5][0]
  }
}
