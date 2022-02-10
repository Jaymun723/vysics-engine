import { PhysicalObject } from "../Objects"
import { BaseRigidShape } from "../Shapes"

export interface BaseConstraintOptions<A extends BaseRigidShape, B extends BaseRigidShape> {
  a: PhysicalObject<A>
  b: PhysicalObject<B>
  /**
   * @default -Infinity
   */
  cmin?: number
  /**
   * @default Infinity
   */
  cmax?: number
}

export abstract class BaseConstraint<A extends BaseRigidShape, B extends BaseRigidShape> {
  protected a: PhysicalObject<A>
  protected b: PhysicalObject<B>
  protected cmin: number
  protected cmax: number

  constructor(options: BaseConstraintOptions<A, B>) {
    this.a = options.a
    this.b = options.b
    this.cmin = options.cmin || -Infinity
    this.cmax = options.cmax || Infinity
  }

  abstract computeValue(): number
}
