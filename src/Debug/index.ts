import { Vec2D } from "maabm"
import { Vancas } from "vancas"
import { PhysicalObject } from "../Objects"
import { CircleRigidShape, PolygonRigidShape } from "../Shapes"

interface DrawObjectOptions {
  object: PhysicalObject
  debug: boolean
  debugColor?: string
  fill: boolean
  primaryColor: string
  secondaryColor: string
  pxPerM: number
}

export const drawObjectFactory = (vancas: Vancas) => {
  const drawPolygon = drawPolygonFactory(vancas)
  const drawCircle = drawCircleFactory(vancas)

  return ({ debug, object, primaryColor, pxPerM, secondaryColor, debugColor, fill }: DrawObjectOptions) => {
    if (object.shape.type === "circle") {
      const shape = object.shape

      if (fill) {
        drawCircle({
          circle: shape,
          color: secondaryColor,
          fill: true,
          pxPerM,
        })
      }
      drawCircle({
        circle: shape,
        color: primaryColor,
        fill: false,
        pxPerM,
      })
    } else {
      const shape = object.shape as PolygonRigidShape

      drawPolygon({
        color: primaryColor,
        fill: false,
        pxPerM,
        vertices: shape.vertices,
      })
      if (fill) {
        drawPolygon({
          color: secondaryColor,
          fill: true,
          pxPerM,
          vertices: shape.vertices,
        })
      }
    }

    const center = object.position

    vancas.circle({
      x: center.x * pxPerM,
      y: pxPerM * center.y,
      radius: 4,
      color: primaryColor,
    })
  }
}

interface DrawCircleOptions {
  circle: CircleRigidShape
  color: string
  pxPerM: number
  fill: boolean
}

const drawCircleFactory = (vancas: Vancas) => ({ color, fill, pxPerM, circle }: DrawCircleOptions) => {
  vancas.line({
    x1: circle.center.x * pxPerM,
    y1: circle.center.y * pxPerM,
    x2: circle.linePoint.x * pxPerM,
    y2: circle.linePoint.y * pxPerM,
  })
  vancas.circle({
    radius: circle.radius * pxPerM,
    x: circle.center.x * pxPerM,
    y: circle.center.y * pxPerM,
    color: color,
    stroke: !fill,
  })
}

interface DrawPolygonOptions {
  vertices: Vec2D[]
  color: string
  pxPerM: number
  fill: boolean
}

const drawPolygonFactory = (vancas: Vancas) => ({ color, fill, pxPerM, vertices }: DrawPolygonOptions) => {
  const shaper = vancas.getShaper({ color, stroke: !fill })
  shaper.start()
  shaper.go(vertices[0].x * pxPerM, vertices[0].y * pxPerM)

  for (let i = 1; i < vertices.length; i++) {
    const v = vertices[i]
    shaper.line(v.x * pxPerM, v.y * pxPerM)
  }

  shaper.done()
}
