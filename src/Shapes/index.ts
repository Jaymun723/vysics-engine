import { Vec2D } from "maabm"
import { CircleRigidShape } from "./Circle"
import { RectangleRigidShape } from "./Rectangle"

export interface BaseRigidShapeProps {
  center: Vec2D
  angle: number
}

export abstract class BaseRigidShape {
  public center: Vec2D
  public angle: number
  public abstract boundRadius: number
  public abstract type: string

  constructor(ops: BaseRigidShapeProps) {
    this.center = ops.center
    this.angle = ops.angle
  }

  public abstract move(direction: Vec2D): void

  public abstract rotate(angle: number): void

  public abstract getInertia(invMass: number): number
}

export * from "./Rectangle"
export * from "./Circle"

export type RigidShape = CircleRigidShape | RectangleRigidShape
