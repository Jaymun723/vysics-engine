import { Vec2D } from "maabm"
import { BaseRigidShape, BaseRigidShapeProps } from "."

export interface CircleRigidShapeProps extends BaseRigidShapeProps {
  radius: number
}

export class CircleRigidShape extends BaseRigidShape {
  public radius: number
  public linePoint: Vec2D
  public boundAABB: Vec2D

  public type = "circle" as const

  constructor(ops: CircleRigidShapeProps) {
    super(ops)

    this.radius = ops.radius
    this.boundAABB = new Vec2D(this.radius * 2, this.radius * 2)
    this.linePoint = this.center.add(this.radius, 0)
  }

  public move(direction: Vec2D) {
    this.center = this.center.add(direction)
    this.linePoint = this.linePoint.add(direction)
  }

  public rotate(angle: number) {
    this.angle += angle
    this.linePoint = this.linePoint.rotateAround(this.center, angle)
  }

  public getInertia(mass: number) {
    if (mass === 0) return 0
    return (mass * this.radius ** 2) / 12
  }
}
