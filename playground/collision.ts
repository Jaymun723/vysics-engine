import { Vec2D } from "maabm"
import { createVancas } from "vancas"
import { CollisionInfo } from "../src/Collision"
import { gridBroadPhase } from "../src/BroadPhase/GridBroadPhase"
import { RectangleRigidShape, RigidShape } from "../src/Shapes"
import { PolygonRigidShape } from "../src/Shapes/Polygon"

const vancas = createVancas({
  width: 500,
  height: 500,
})

const root = document.getElementById("root")
if (root) {
  root.innerHTML = ""
  root.appendChild(vancas.canvasEl)
}

const shapes: RigidShape[] = [
  new RectangleRigidShape({
    angle: 0,
    center: new Vec2D(250, 175),
    height: 100,
    width: 50,
  }),
  new RectangleRigidShape({
    angle: 0,
    center: new Vec2D(250, 325),
    height: 100,
    width: 100,
  }),
]

const debugRect = (rect: RectangleRigidShape, color: string) => {
  const shaper = vancas.getShaper({ color })
  shaper
    .start()
    .go(rect.vertices[0].x, rect.vertices[0].y)
    .line(rect.vertices[1].x, rect.vertices[1].y)
    .line(rect.vertices[2].x, rect.vertices[2].y)
    .line(rect.vertices[3].x, rect.vertices[3].y)
    .done()
  vancas.circle({ x: rect.center.x, y: rect.center.y, radius: 2 })
  for (let i = 0; i < 4; i++) {
    const vertex = rect.vertices[i]
    vancas.circle({
      radius: 2,
      x: vertex.x,
      y: vertex.y,
    })

    const j = i === 3 ? 0 : i + 1
    const secondVertex = rect.vertices[j]
    const middle = vertex.add(secondVertex).div(2)
    vancas.circle({ radius: 2, x: middle.x, y: middle.y })
    const normal = rect.normals[i]
    const end = middle.add(normal.mul(20))
    vancas.line({ x1: middle.x, y1: middle.y, x2: end.x, y2: end.y })
  }

  vancas.circle({
    x: rect.center.x,
    y: rect.center.y,
    radius: rect.boundRadius,
    stroke: true,
  })
}

let selectedShapeIndex = 0
let collisions: CollisionInfo[] = []

window.addEventListener("keydown", (e) => {
  if (e.key === " ") {
    selectedShapeIndex = (selectedShapeIndex + 1) % (shapes.length + 1)
  } else if (e.key === "R") {
    const shape = shapes[selectedShapeIndex]
    if (shape) {
      shape.rotate(-shape.angle)
    }
  } else if (e.key === "r") {
    const shape = shapes[selectedShapeIndex]
    if (shape) {
      shape.rotate(Math.PI / 6)
    }
  }
})

vancas.mouse.contextmenu = false
vancas.mouse.preventDefault = true

vancas.update = (dt) => {
  const selectedShape = shapes[selectedShapeIndex]

  if (selectedShape) {
    const mouse = Vec2D.from(vancas.mouse)
    const dist = mouse.sub(selectedShape.center)
    selectedShape.move(dist)

    if (vancas.mouse.button === 1) {
      selectedShape.rotate((Math.PI / 8) * dt)
    } else if (vancas.mouse.button === 2) {
      selectedShape.rotate((-Math.PI / 8) * dt)
    }
  }

  collisions = []
  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      const a = shapes[i]
      const b = shapes[j]
      const squaredDist = b.center.sub(a.center).squaredNorm()
      if (squaredDist > (a.boundRadius + b.boundRadius) ** 2) {
        continue
      }

      if (a.type === "rectangle" && b.type === "rectangle") {
        const col = rectangleRectangleCollision(a, b)
        if (col) {
          collisions.push(col)
        }
      }
    }
  }
}

vancas.render = () => {
  vancas.background("grey")

  for (const shape of shapes) {
    if (shape.type === "rectangle") {
      debugRect(shape, shapes.indexOf(shape) === selectedShapeIndex ? "red" : "white")
    }
  }

  for (const collision of collisions) {
    vancas.circle({
      x: collision.start.x,
      y: collision.start.y,
      radius: 4,
    })
    const endPoint = collision.start.add(collision.normal.mul(collision.depth))
    vancas.line({
      x1: collision.start.x,
      y1: collision.start.y,
      x2: endPoint.x,
      y2: endPoint.y,
    })
  }
}

vancas.start()
