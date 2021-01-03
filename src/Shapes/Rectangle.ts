import { Vec2D } from "maabm"
import { BaseRigidShape, BaseRigidShapeProps } from "."
import { PolygonRigidShape } from "./Polygon"

export interface RectangleRigidShapeProps extends BaseRigidShapeProps {
  width: number
  height: number
}

export class RectangleRigidShape extends BaseRigidShape {
  public width: number
  public height: number
  public vertices: Vec2D[]
  public normals: Vec2D[]
  public boundAABB: Vec2D

  public type = "rectangle" as const

  constructor(ops: RectangleRigidShapeProps) {
    super(ops)
    this.width = ops.width
    this.height = ops.height

    this.boundAABB = new Vec2D(this.width, this.height)

    this.vertices = [
      this.center.add(-this.width / 2, -this.height / 2),
      this.center.add(-this.width / 2, this.height / 2),
      this.center.add(this.width / 2, this.height / 2),
      this.center.add(this.width / 2, -this.height / 2),
    ]

    this.normals = RectangleRigidShape.computeNormal(this.vertices)

    if (this.angle !== 0) {
      const angle = this.angle
      this.angle = 0
      this.rotate(angle)
    }
  }

  private static computeNormal(vertices: Vec2D[]) {
    const normals = []
    for (let i = 0; i < 4; i++) {
      const j = i === 3 ? 0 : i + 1
      const k = j === 3 ? 0 : j + 1
      normals.push(vertices[j].sub(vertices[k]).normalize())
    }
    return normals
  }

  public move(direction: Vec2D) {
    this.center = this.center.add(direction)
    for (let i = 0; i < 4; i++) {
      this.vertices[i] = this.vertices[i].add(direction)
    }
  }

  public rotate(angle: number) {
    this.angle += angle
    for (let i = 0; i < 4; i++) {
      this.vertices[i] = this.vertices[i].rotateAround(this.center, angle)
    }
    this.normals = RectangleRigidShape.computeNormal(this.vertices)
    this.boundAABB = PolygonRigidShape.computeAABB(this.vertices)
  }

  public getInertia(mass: number) {
    if (mass === 0) return 0
    return (mass * (this.width ** 2 + this.height ** 2)) / 12
  }
}
