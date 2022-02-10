import { Vec2D } from "maabm"
import { PhysicalObject } from "../Objects"
import { BaseRigidShape } from "../Shapes"
import { Matrix } from "../tmp/Matrix"
import { BaseConstraint, BaseConstraintOptions } from "./Constraint"

interface JointConstraintOptions<A extends BaseRigidShape, B extends BaseRigidShape>
  extends BaseConstraintOptions<A, B> {
  getPointOnA: (a: PhysicalObject<A>) => Vec2D
  getPointOnB: (b: PhysicalObject<B>) => Vec2D
  /**
   * @default 0
   */
  distance?: number
  /**
   * @default 0.2
   */
  beta?: number
}

export class JointConstraint<A extends BaseRigidShape, B extends BaseRigidShape> extends BaseConstraint<A, B> {
  private getPointOnA: (a: PhysicalObject<A>) => Vec2D
  private getPointOnB: (b: PhysicalObject<B>) => Vec2D

  private distance: number
  private beta: number

  private invMass: undefined | number[][]
  private jacobian: undefined | number[][]
  private bias: undefined | number

  constructor(options: JointConstraintOptions<A, B>) {
    super(options)
    this.a = options.a
    this.getPointOnA = options.getPointOnA
    this.b = options.b
    this.getPointOnB = options.getPointOnB

    this.distance = options.distance || 0
    this.beta = options.beta || 0.2
  }

  computeValue() {
    const pA = this.getPointOnA(this.a)
    const pB = this.getPointOnB(this.b)
    const pAB = pA.sub(pB)
    return pAB.dot(pAB) - this.distance ** 2
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

    const pA = this.getPointOnA(this.a)
    const cA = this.a.position
    const pB = this.getPointOnB(this.b)
    const cB = this.b.position

    const pAMinusPB = pA.sub(pB)
    const pBMinusPA = pB.sub(pA)

    this.jacobian = [
      [
        pAMinusPB.x,
        pAMinusPB.y,
        -Vec2D.cross(pAMinusPB, pA.sub(cA)),
        pBMinusPA.x,
        pBMinusPA.y,
        Vec2D.cross(pAMinusPB, pB.sub(cB)),
      ],
    ]

    this.bias = (this.beta / dt) * this.computeValue()
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

    const lambda = -(jXv + this.bias) / lambdaDenominator

    const impulse = Matrix.transpose(Matrix.scale(this.jacobian, lambda))

    const newVelocity = Matrix.add(v, Matrix.mult(this.invMass, impulse))

    this.a.velocity = new Vec2D(newVelocity[0][0], newVelocity[1][0])
    this.a.angularVelocity = newVelocity[2][0]
    this.b.velocity = new Vec2D(newVelocity[3][0], newVelocity[4][0])
    this.b.angularVelocity = newVelocity[5][0]
  }
}
