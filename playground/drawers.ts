import { Vancas } from "vancas"
import { PhysicalObject } from "../src/Objects"
import { CircleRigidShape, PolygonRigidShape, RectangleRigidShape } from "../src/Shapes"

interface DrawersOptions {
  pxPerM: number
  vancas: Vancas
}

export class Drawers {
  private pxPerM: number
  private vancas: Vancas

  constructor(ops: DrawersOptions) {
    this.pxPerM = ops.pxPerM
    this.vancas = ops.vancas
  }

  private polygon(polygon: PolygonRigidShape | RectangleRigidShape, color: string) {
    const vertices = polygon.vertices.map((v) => v.mul(this.pxPerM))
    const center = polygon.center.mul(this.pxPerM)

    const innerShaper = this.vancas.getShaper({ color })
    const outlineShaper = this.vancas.getShaper({ color: "black", stroke: true })
    innerShaper.start()
    innerShaper.go(vertices[0].x, vertices[0].y)
    outlineShaper.start()
    outlineShaper.go(vertices[0].x, vertices[0].y)

    for (let i = 1; i < vertices.length; i++) {
      const v = vertices[i]
      innerShaper.line(v.x, v.y)
      outlineShaper.line(v.x, v.y)
    }

    innerShaper.done()
    outlineShaper.done()

    this.vancas.circle({ x: center.x, y: center.y, radius: 2, color: "black" })
  }

  private circle(circle: CircleRigidShape, color: string) {
    const center = circle.center.mul(this.pxPerM)
    const radius = circle.radius * this.pxPerM

    this.vancas.circle({
      color,
      radius,
      x: center.x,
      y: center.y,
    })
    this.vancas.circle({
      color: "black",
      radius,
      stroke: true,
      x: center.x,
      y: center.y,
    })
    this.vancas.circle({
      color: "black",
      radius: 2,
      x: center.x,
      y: center.y,
    })
  }

  public draw(object: PhysicalObject, color: string) {
    if (object.shape.type === "circle") {
      this.circle(object.shape, color)
    } else {
      this.polygon(object.shape, color)
    }
  }
}
