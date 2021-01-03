import { Vec2D } from "maabm"
import { createVancas } from "vancas"
import { RectangleRigidShape, CircleRigidShape, PolygonRigidShape } from "../src/Shapes"
import { PhysicsEngine } from "../src/Engine"
import { PhysicalObject } from "../src/Objects"
import { applyFlick } from "../src/Engine/Hooks"

let physicalObjects: PhysicalObject[] = [
  new PhysicalObject({
    shape: new RectangleRigidShape({
      angle: 0,
      center: new Vec2D(250, 400),
      height: 100,
      width: 500,
    }),
    mass: 0,
  }),
  new PhysicalObject({
    shape: new RectangleRigidShape({
      angle: 0,
      center: new Vec2D(250, 300),
      width: 40,
      height: 40,
    }),
    mass: 1,
  }),
  // new PhysicalObject({
  //   shape: new RectangleRigidShape({
  //     center: new Vec2D(150, 475),
  //     width: 300,
  //     height: 50,
  //     angle: 0,
  //   }),
  //   mass: 0,
  // }),
  // new PhysicalObject({
  //   shape: new RectangleRigidShape({
  //     center: new Vec2D(25, 350),
  //     width: 50,
  //     height: 200,
  //     angle: 0,
  //   }),
  //   mass: 0,
  // }),
  // new PhysicalObject({
  //   shape: new RectangleRigidShape({
  //     center: new Vec2D(350, 250),
  //     angle: Math.PI / -5,
  //     height: 30,
  //     width: 350,
  //   }),
  //   mass: 0,
  // }),
  // new PhysicalObject({
  //   shape: new PolygonRigidShape({
  //     angle: 0,
  //     vertices: [new Vec2D(0, 450), new Vec2D(0, 475), new Vec2D(300, 475), new Vec2D(300, 450), new Vec2D(150, 425)],
  //   }),
  //   mass: 0,
  //   friction: 0.1,
  // }),
  // new PhysicalObject({
  //   shape: PolygonRigidShape.fromCenter({
  //     vertices: [
  //       new Vec2D(-11, -20),
  //       new Vec2D(-20, -10),
  //       new Vec2D(-20, 10),
  //       new Vec2D(-10, 20),
  //       new Vec2D(10, 20),
  //       new Vec2D(20, 10),
  //       new Vec2D(20, -10),
  //       new Vec2D(10, -20),
  //     ],
  //     center: new Vec2D(100, 250),
  //     angle: 0,
  //   }),
  //   // shape: new RectangleRigidShape({
  //   //   center: new Vec2D(100, 250),
  //   //   width: 40,
  //   //   height: 40,
  //   //   angle: 0,
  //   // }),
  //   // shape: new CircleRigidShape({
  //   //   center: new Vec2D(100, 250),
  //   //   radius: 20,
  //   //   angle: 0,
  //   // }),
  //   mass: 1,
  // }),
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
    objectSelector = (objectSelector + 1) % (engine.objects.length + 1)
  } else if (e.key === "c") {
    engine.addObject(
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
    engine.addObject(
      new PhysicalObject({
        mass: 1,
        shape: new RectangleRigidShape({
          angle: 0,
          center: Vec2D.from(vancas.mouse),
          width: 30,
          height: 30,
        }),
      })
    )
  } else if (e.key === "s") {
    FULL_DEBUG = !FULL_DEBUG
  } else if (e.key === "f") {
    const obj = engine.objects[1] as PhysicalObject<RectangleRigidShape>
    // const pointOfApplication = obj.position.sub(new Vec2D(obj.shape.width, obj.shape.height).div(2))
    const pointOfApplication = obj.shape.vertices[0]
    const force = new Vec2D(0, -1).mul(10000)
    applyFlick({ object: obj, force, pointOfApplication })
  }
})

let FULL_DEBUG = false

const debugObj = (obj: PhysicalObject, color: string) => {
  if (obj.shape.type === "rectangle") {
    debugRect(obj.shape, color)
  } else if (obj.shape.type === "circle") {
    debugCircle(obj.shape, color)
  } else if (obj.shape.type === "polygon") {
    debugPolygon(obj.shape, color)
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

    const topCorner = rect.center.sub(rect.boundAABB.div(2))

    vancas.rect({
      x: topCorner.x,
      y: topCorner.y,
      width: rect.boundAABB.x,
      height: rect.boundAABB.y,
      stroke: true,
    })
  }
}

const debugPolygon = (pol: PolygonRigidShape, color: string) => {
  const shaper = vancas.getShaper({ color })
  shaper.start().go(pol.vertices[0].x, pol.vertices[0].y)
  for (let i = 1; i < pol.vertices.length; i++) {
    shaper.line(pol.vertices[i].x, pol.vertices[i].y)
  }
  shaper.done()

  vancas.circle({ x: pol.center.x, y: pol.center.y, radius: 2 })

  if (FULL_DEBUG) {
    for (let i = 0; i < pol.vertices.length; i++) {
      const vertex = pol.vertices[i]
      vancas.circle({
        radius: 2,
        x: vertex.x,
        y: vertex.y,
      })

      const j = (i + 1) % pol.vertices.length

      const secondVertex = pol.vertices[j]
      const middle = vertex.add(secondVertex).div(2)

      vancas.circle({ radius: 2, x: middle.x, y: middle.y })

      const normal = pol.normals[i]
      const end = middle.add(normal.mul(20))
      vancas.line({ x1: middle.x, y1: middle.y, x2: end.x, y2: end.y })
    }

    const topCorner = pol.center.sub(pol.boundAABB.div(2))

    vancas.rect({
      x: topCorner.x,
      y: topCorner.y,
      width: pol.boundAABB.x,
      height: pol.boundAABB.y,
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
    const topCorner = circle.center.sub(circle.boundAABB.div(2))
    vancas.rect({
      x: topCorner.x,
      y: topCorner.y,
      width: circle.boundAABB.x,
      height: circle.boundAABB.y,
      stroke: true,
    })
    // vancas.circle({
    //   radius: circle.boundRadius,
    //   x: circle.center.x,
    //   y: circle.center.y,
    //   stroke: true,
    // })
  }
}

let fps = 0
let before = Date.now()
const engine = new PhysicsEngine({
  objects: physicalObjects,
  positionalCorrection: { iterations: 15, rate: 0.8 },
  height: 500,
  width: 500,
  pxPerCell: 25,
  fps: 120,
  broadPhase: "grid",
  drawHook: () => {
    const now = Date.now()
    fps = Math.round(1000 / (now - before))
    before = now

    vancas.background("grey")

    if (FULL_DEBUG) {
      const pxPerCell = 25
      const w = Math.floor(engine.width / pxPerCell)
      const h = Math.floor(engine.height / pxPerCell)
      for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
          vancas.rect({
            x: x * pxPerCell,
            y: y * pxPerCell,
            width: pxPerCell,
            height: pxPerCell,
            stroke: true,
            lineWidth: 1,
          })
        }
      }
    }

    for (let i = 0; i < engine.objects.length; i++) {
      debugObj(engine.objects[i], i === objectSelector ? "red" : "white")
    }

    vancas.text({
      x: 0,
      y: 30,
      text: String(fps),
    })
  },
})

engine.addPreUpdateHook((engine) => {
  const selectedObject = engine.objects[objectSelector]
  if (selectedObject) {
    if (vancas.mouse.button === 1) {
      selectedObject.rotate((Math.PI / 6) * engine.dt)
    } else if (vancas.mouse.button === 2) {
      selectedObject.rotate((-Math.PI / 6) * engine.dt)
    }
  }
})

engine.addPostUpdateHook((engine) => {
  for (let i = 0; i < engine.objects.length; i++) {
    const physicalObject = engine.objects[i]
    if (
      (physicalObject.position.y > vancas.height ||
        physicalObject.position.x < 0 ||
        physicalObject.position.x > vancas.width) &&
      physicalObject.mass !== 0
    ) {
      engine.objects.splice(i, 1)
    }
  }
})

// @ts-ignore
global.engine = engine

engine.start()

const root = document.getElementById("root")
if (root) {
  root.innerHTML = ""
  root.appendChild(vancas.canvasEl)
}
