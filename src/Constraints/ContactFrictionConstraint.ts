import { emptyArray, Vec2D } from "maabm"
import { Matrix } from "../tmp/Matrix"
import { BaseRigidShape } from "../Shapes"
import { ContactConstraint, ContactConstraintOptions } from "./ContactConstraint"

interface ContactFrictionConstraintOptions<A extends BaseRigidShape, B extends BaseRigidShape>
  extends ContactConstraintOptions<A, B> {}

export class ContactFrictionConstraint<A extends BaseRigidShape, B extends BaseRigidShape> extends ContactConstraint<
  A,
  B
> {
  public tangent: Vec2D
  private tangentJacobian: number[][] | undefined
  private accumulatedLambda: number[] = []

  constructor(options: ContactFrictionConstraintOptions<A, B>) {
    super(options)

    this.tangent = new Vec2D(this.normal.y, -this.normal.x)
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
    this.tangentJacobian = []
    this.bias = []
    this.accumulatedLambda = emptyArray(this.contacts.length, 0)

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
      this.tangentJacobian.push([
        -this.tangent.x,
        -this.tangent.y,
        -Vec2D.cross(rA, this.tangent),
        this.tangent.x,
        this.tangent.y,
        Vec2D.cross(rB, this.tangent),
      ])

      this.bias.push([(this.depth * this.beta) / dt])
    }
  }

  applyImpulse(dt: number) {
    if (!this.bias || !this.jacobian || !this.invMass || !this.tangentJacobian) return
    const v = [
      [this.a.velocity.x],
      [this.a.velocity.y],
      [this.a.angularVelocity],
      [this.b.velocity.x],
      [this.b.velocity.y],
      [this.b.angularVelocity],
    ]

    const A = Matrix.mult(Matrix.mult(this.jacobian, this.invMass), Matrix.transpose(this.jacobian))

    const Jv = Matrix.mult(this.jacobian, v)

    const coefficient = (this.a.restitution + this.b.restitution) / 2

    let bias = this.bias
    if (this.elastic) {
      bias = Matrix.add(this.bias, Matrix.scale(Jv, coefficient))
    }

    const b = Matrix.sub(bias, Jv)

    const cMin = emptyArray(2, 0)
    const cMax = emptyArray(2, Infinity)

    const lambda = this.solveProjectedGaussSeidel(A, b, cMin, cMax, 50)

    const impulse = Matrix.mult(Matrix.transpose(this.jacobian), lambda)

    const newV = Matrix.add(v, Matrix.mult(this.invMass, impulse))

    const tangentA = Matrix.mult(
      Matrix.mult(this.tangentJacobian, this.invMass),
      Matrix.transpose(this.tangentJacobian)
    )
    const tangentB = Matrix.scale(Matrix.mult(this.tangentJacobian, newV), -1)

    let tangentLambda

    if (this.contacts.length === 1) {
      const a = tangentA[0][0]
      const b = tangentB[0][0]

      tangentLambda = [[b / a]]
    } else if (this.contacts.length === 2) {
      tangentLambda = this.solve2DLinear(tangentA, tangentB)
    } else {
      const cMin = emptyArray(this.contacts.length, -Infinity)
      const cMax = emptyArray(this.contacts.length, Infinity)
      tangentLambda = this.solveProjectedGaussSeidel(tangentA, tangentB, cMin, cMax, 50)
    }

    const mu = 0.3

    for (let i = 0; i < tangentLambda.length; i++) {
      for (let j = 0; j < tangentLambda[i].length; j++) {
        const tL = tangentLambda[i][j]
        const l = lambda[i][j]
        if (tL > mu * l) {
          tangentLambda[i][j] = mu * l
        } else if (tL < -mu * l) {
          tangentLambda[i][j] = -mu * l
        }
      }
    }

    const tangentImpulse = Matrix.mult(Matrix.transpose(this.tangentJacobian), tangentLambda)

    const finalV = Matrix.add(newV, Matrix.mult(this.invMass, tangentImpulse))

    this.a.velocity = new Vec2D(finalV[0][0], finalV[1][0])
    this.a.angularVelocity = finalV[2][0]
    this.b.velocity = new Vec2D(finalV[3][0], finalV[4][0])
    this.b.angularVelocity = finalV[5][0]
  }
}
