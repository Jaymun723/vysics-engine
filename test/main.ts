import { Vec2D } from "maabm"
import { createVancas } from "vancas"
import { RectangleRigidShape, CircleRigidShape } from "../src/Shapes"
import { PhysicsEngine } from "../src/Engine"
import { PhysicalObject } from "../src/Objects"

let physicalObjects: PhysicalObject[] = [
  new PhysicalObject({
    shape: new RectangleRigidShape({
      center: new Vec2D(150, 475),
      width: 300,
      height: 50,
      angle: 0,
    }),
    mass: 0,
  }),
  new PhysicalObject({
    shape: new RectangleRigidShape({
      center: new Vec2D(25, 350),
      width: 50,
      height: 200,
      angle: 0,
    }),
    mass: 0,
  }),
  new PhysicalObject({
    shape: new RectangleRigidShape({
      center: new Vec2D(350, 250),
      angle: Math.PI / -5,
      height: 30,
      width: 350,
    }),
    mass: 0,
  }),
]

const vancas = createVancas({ height: 500, width: 500 })

// @ts-ignore
global.vancas = vancas

vancas.initialize()
vancas.mouse.contextmenu = false
vancas.mouse.preventDefault = true

let objectSelector = 0
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === " ") {
    objectSelector = (objectSelector + 1) % (physicalObjects.length + 1)
  } else if (e.key === "c") {
    physicalObjects.push(
      new PhysicalObject({
        mass: 1,
        shape: new CircleRigidShape({
          angle: 0,
          center: Vec2D.from(vancas.mouse),
          radius: 10,
        }),
      })
    )
  } else if (e.key === "r") {
    physicalObjects.push(
      new PhysicalObject({
        mass: 1,
        shape: new RectangleRigidShape({
          angle: 0,
          center: Vec2D.from(vancas.mouse),
          width: 10,
          height: 10,
        }),
      })
    )
  } else if (e.key === "s") {
    FULL_DEBUG = !FULL_DEBUG
  }
})

let FULL_DEBUG = false

const debugObj = (obj: PhysicalObject, color: string) => {
  if (obj.shape.type === "rectangle") {
    debugRect(obj.shape, color)
  } else if (obj.shape.type === "circle") {
    debugCircle(obj.shape, color)
  }

  if (FULL_DEBUG) {
    vancas.circle({
      x: obj.position.x,
      y: obj.position.y,
      stroke: true,
      color: "orange",
      radius: 5,
    })
    const velocityPoint = obj.position.add(obj.velocity.mul(1))
    vancas.line({
      x1: obj.position.x,
      y1: obj.position.y,
      x2: velocityPoint.x,
      y2: velocityPoint.y,
      color: "orange",
    })
  }
}

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

  if (FULL_DEBUG) {
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
}

const debugCircle = (circle: CircleRigidShape, color: string) => {
  vancas.circle({
    radius: circle.radius,
    x: circle.center.x,
    y: circle.center.y,
    color,
  })
  vancas.circle({ radius: 2, x: circle.center.x, y: circle.center.y })

  if (FULL_DEBUG) {
    vancas.line({
      x1: circle.center.x,
      y1: circle.center.y,
      x2: circle.linePoint.x,
      y2: circle.linePoint.y,
    })
    vancas.circle({
      radius: circle.boundRadius,
      x: circle.center.x,
      y: circle.center.y,
      stroke: true,
    })
  }
}

const engine = new PhysicsEngine({
  objects: physicalObjects,
  positionalCorrection: { iterations: 15, rate: 0.8 },
  drawHook: () => {
    vancas.background("grey")
    for (let i = 0; i < physicalObjects.length; i++) {
      debugObj(physicalObjects[i], i === objectSelector ? "red" : "white")
    }
  },
  preUpdateHook: (dt) => {
    const selectedObject = physicalObjects[objectSelector]
    if (selectedObject) {
      if (vancas.mouse.button === 1) {
        selectedObject.rotate((Math.PI / 6) * dt)
      } else if (vancas.mouse.button === 2) {
        selectedObject.rotate((-Math.PI / 6) * dt)
      }
    }
  },
  postUpdateHook: (dt) => {
    for (let i = 0; i < physicalObjects.length; i++) {
      const physicalObject = physicalObjects[i]
      if (
        (physicalObject.position.y > vancas.height ||
          physicalObject.position.x < 0 ||
          physicalObject.position.x > vancas.width) &&
        physicalObject.mass !== 0
      ) {
        physicalObjects.splice(i, 1)
      }
    }
  },
})

// @ts-ignore
global.engine = engine

engine.start()

const root = document.getElementById("root")
if (root) {
  root.innerHTML = ""
  root.appendChild(vancas.canvasEl)
}
