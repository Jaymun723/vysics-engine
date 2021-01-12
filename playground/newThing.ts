import { Vec2D } from "maabm"
import { createVancas } from "vancas"
import { PhysicsEngine } from "../src/Engine"
import { PhysicalObject } from "../src/Objects"
import { RectangleRigidShape } from "../src/Shapes"

const dimensions = {
  ratioPxPerM: 0,
  vancas: new Vec2D(0, 0),
  engine: new Vec2D(0, 0),
}

dimensions.vancas = new Vec2D(500, 500)
dimensions.ratioPxPerM = 100
dimensions.engine = dimensions.vancas.div(dimensions.ratioPxPerM)

const vancas = createVancas({ width: dimensions.vancas.x, height: dimensions.vancas.y })
const root = document.getElementById("root")
if (root) {
  root.innerHTML = ""
  root.appendChild(vancas.canvasEl)
}

vancas.initialize()
vancas.mouse.contextmenu = false
vancas.mouse.preventDefault = true

const physicalObjects = [
  new PhysicalObject({
    mass: 0,
    shape: new RectangleRigidShape({
      angle: 0,
      center: new Vec2D(2.5, 4.5),
      height: 1,
      width: 5,
    }),
  }),
  new PhysicalObject({
    mass: 1,
    shape: new RectangleRigidShape({
      angle: 0,
      center: new Vec2D(2.5, 0),
      height: 1,
      width: 1,
    }),
    dragCoefficient: 1,
  }),
]

const engine = new PhysicsEngine({
  width: dimensions.engine.x,
  height: dimensions.engine.y,
  objects: physicalObjects,
  mPerCell: 1,
  positionalCorrection: { iterations: 15, rate: 0.8 },
  drawHook: () => {
    vancas.background("grey")

    for (const obj of physicalObjects) {
      const v = obj.shape.vertices.map((v) => v.mul(dimensions.ratioPxPerM))
      const c = obj.shape.center.mul(dimensions.ratioPxPerM)

      const shaper = vancas.getShaper({ color: "red" })
      shaper.start().go(v[0].x, v[0].y).line(v[1].x, v[1].y).line(v[2].x, v[2].y).line(v[3].x, v[3].y).done()
      vancas.circle({ x: c.x, y: c.y, radius: 2 })
    }
  },
})

engine.start()
