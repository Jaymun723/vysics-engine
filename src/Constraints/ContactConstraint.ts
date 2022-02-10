import { Vec2D, emptyArray } from "maabm"
import { BaseRigidShape } from "../Shapes"
import { Matrix } from "../tmp/Matrix"
import { BaseConstraint, BaseConstraintOptions } from "./Constraint"

export interface ContactConstraintOptions<A extends BaseRigidShape, B extends BaseRigidShape>
  extends BaseConstraintOptions<A, B> {
  contacts: Vec2D[]
  normal: Vec2D
  depth: number
  /**
   * @default 0.2
   */
  beta?: number

  /**
   * @default true
   */
  elastic?: boolean
}

export class ContactConstraint<A extends BaseRigidShape, B extends BaseRigidShape> extends BaseConstraint<A, B> {
  protected contacts: Vec2D[]
  protected normal: Vec2D
  protected depth: number
  protected beta: number
  protected elastic: boolean

  protected invMass: undefined | number[][]
  protected jacobian: undefined | number[][]
  protected bias: undefined | number[][]

  constructor(options: ContactConstraintOptions<A, B>) {
    super(options)
    this.a = options.a
    this.b = options.b
    this.contacts = options.contacts
    this.normal = options.normal
    this.depth = options.depth

    this.elastic = typeof options.elastic === "undefined" ? true : options.elastic
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

    this.jacobian = []
    this.bias = []

    for (const contact of this.contacts) {
      const rA = contact.sub(this.a.position)
      const rB = contact.sub(this.b.position)

      this.jacobian.push([
        -this.normal.x,
        -this.normal.y,
        -Vec2D.cross(rA, this.normal),
        this.normal.x,
        this.normal.y,
        Vec2D.cross(rB, this.normal),
      ])

      this.bias.push([(this.depth * this.beta) / dt])
    }
  }

  applyImpulse(dt: number) {
    if (!this.bias || !this.jacobian || !this.invMass) return
    const v = [
      [this.a.velocity.x],
      [this.a.velocity.y],
      [this.a.angularVelocity],
      [this.b.velocity.x],
      [this.b.velocity.y],
      [this.b.angularVelocity],
    ]

    if (this.invMass.length !== this.jacobian[0].length) {
      console.warn("wow wtf invMass not ok with jacobian", this.invMass, this.jacobian)
      return
    }

    const JM = Matrix.mult(this.jacobian, this.invMass)
    const transposedJacobian = Matrix.transpose(this.jacobian)

    if (transposedJacobian.length !== JM[0].length) {
      console.warn("wow wtf transposedJacobian not ok with JM", transposedJacobian, JM)
      return
    }

    const A = Matrix.mult(JM, transposedJacobian)

    const Jv = Matrix.mult(this.jacobian, v)

    const coefficient = (this.a.restitution + this.b.restitution) / 2

    let bias = this.bias
    if (this.elastic) {
      bias = Matrix.add(this.bias, Matrix.scale(Jv, coefficient))
    }

    const b = Matrix.sub(bias, Jv)

    const lambda = this.solveProjectedGaussSeidel(A, b, emptyArray(2, 0), emptyArray(2, Infinity), 50)
    const impulse = Matrix.mult(Matrix.transpose(this.jacobian), lambda)

    const newVelocity = Matrix.add(v, Matrix.mult(this.invMass, impulse))

    this.a.velocity = new Vec2D(newVelocity[0][0], newVelocity[1][0])
    this.a.angularVelocity = newVelocity[2][0]
    this.b.velocity = new Vec2D(newVelocity[3][0], newVelocity[4][0])
    this.b.angularVelocity = newVelocity[5][0]
  }

  protected solveProjectedGaussSeidel = (
    A: number[][],
    b: number[][],
    cmin: number[],
    cmax: number[],
    iterations: number
  ) => {
    const lambda = Matrix.empty(this.contacts.length, 1)

    for (let k = 0; k < iterations; k++) {
      for (let j = 0; j < A[0].length; j++) {
        lambda[j][0] = b[j][0]

        for (let i = 0; i < lambda.length; i++) {
          if (i == j) continue
          lambda[j][0] -= A[i][j] * lambda[i][0]
        }

        lambda[j][0] /= A[j][j]

        lambda[j][0] = Math.min(lambda[j][0], cmax[j])
        lambda[j][0] = Math.max(lambda[j][0], cmin[j])
      }
    }

    return lambda
  }

  protected solve2DLinear(A: number[][], b: number[][]) {
    const det = A[0][0] * A[1][1] - A[0][1] * A[1][0]
    if (det === 0) {
      console.warn("non inversible matrix")
      return [[0], [0]]
    }
    const invA = [
      [A[1][1] / det, -A[0][1] / det],
      [-A[1][0] / det, A[0][0] / det],
    ]
    return Matrix.mult(invA, b)
  }
}
