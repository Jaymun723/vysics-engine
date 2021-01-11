import { Vec2D, Polygon } from "maabm"
import { BaseRigidShape, BaseRigidShapeProps } from "."

export interface PolygonRigidShapeProps extends Omit<BaseRigidShapeProps, "center"> {
  vertices: Vec2D[]
}

export class PolygonRigidShape extends BaseRigidShape {
  public center: Vec2D
  public vertices: Vec2D[]
  public normals: Vec2D[]
  public boundAABB: Vec2D

  public type = "polygon" as const

  constructor(ops: PolygonRigidShapeProps) {
    super({ ...ops, center: new Vec2D(0, 0) })

    this.vertices = ops.vertices

    const angles = Polygon.getInteriorAngles(this.vertices)

    if (angles.some((a) => a > Math.PI)) {
      throw new Error("Not a valid convex polygon")
    }

    this.center = Polygon.getCentroid(this.vertices)
    this.normals = Polygon.getNormals(this.vertices)
    this.boundAABB = PolygonRigidShape.computeAABB(this.vertices)

    if (this.angle !== 0) {
      const angle = this.angle
      this.angle = 0
      this.rotate(angle)
    }
  }

  public static fromCenter(ops: PolygonRigidShapeProps & { center: Vec2D }) {
    return new PolygonRigidShape({
      ...ops,
      vertices: ops.vertices.map((v) => v.add(ops.center)),
    })
  }

  public static computeAABB(vertices: Vec2D[]) {
    const width = {
      min: Infinity,
      max: -Infinity,
    }
    const height = {
      min: Infinity,
      max: -Infinity,
    }

    const xAxis = new Vec2D(1, 0)
    const yAxis = new Vec2D(0, 1)
    for (const vertex of vertices) {
      const xDot = vertex.dot(xAxis)
      if (xDot < width.min) {
        width.min = xDot
      }
      if (xDot > width.max) {
        width.max = xDot
      }
      const yDot = vertex.dot(yAxis)
      if (yDot < height.min) {
        height.min = yDot
      }
      if (yDot > height.max) {
        height.max = yDot
      }
    }

    return new Vec2D(width.max - width.min, height.max - height.min)
  }

  public move(direction: Vec2D) {
    this.center = this.center.add(direction)
    for (let i = 0; i < this.vertices.length; i++) {
      this.vertices[i] = this.vertices[i].add(direction)
    }
  }

  public rotate(angle: number) {
    this.angle += angle
    for (let i = 0; i < this.vertices.length; i++) {
      this.vertices[i] = this.vertices[i].rotateAround(this.center, angle)
    }
    this.normals = Polygon.getNormals(this.vertices)
  }

  public getInertia(mass: number) {
    return Polygon.getMomentOfInertia(this.vertices, mass)
  }

  public getArea() {
    return Polygon.getArea(this.vertices)
  }
}
