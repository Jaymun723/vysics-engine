/**
 * For now the code of the playground is a bit messy...
 * Nonetheless it's a good overview of a how to use the vysics-engine.
 */
import { Vec2D } from "maabm"
import { createVancas } from "vancas"
import { createDumpingHook, PhysicsEngine } from "../src/Engine"
import { PhysicalObject } from "../src/Objects"
import { CircleRigidShape, RectangleRigidShape } from "../src/Shapes"
import { Drawers } from "./drawers"
import { ForceApplier } from "./ForceApplier"
import { Menu } from "./menu"
import { Mouse } from "./mouse"

const vancas = createVancas({
  width: 1200,
  height: 700,
})
vancas.initialize()
vancas.mouse.contextmenu = false
vancas.mouse.preventDefault = true

const pxPerM = 10
const world = { width: vancas.width / pxPerM, height: vancas.height / pxPerM }

const drawers = new Drawers({ pxPerM, vancas })
const mouse = new Mouse({ vancas })

const root = document.getElementById("root")
if (root) {
  root.innerHTML = ""
  root.appendChild(vancas.canvasEl)
}

const ground = new PhysicalObject({
  // Static
  mass: 0,
  shape: new RectangleRigidShape({
    angle: 0,
    center: new Vec2D(world.width / 2, world.height - 4),
    width: world.width,
    height: 8,
  }),
})

const platform = new PhysicalObject({
  // Static
  mass: 0,
  shape: new RectangleRigidShape({
    angle: Math.PI / 12,
    center: new Vec2D(60, world.height / 2),
    width: 35,
    height: 4,
  }),
})

const wall = new PhysicalObject({
  // Static
  mass: 0,
  shape: new RectangleRigidShape({
    angle: 0,
    center: new Vec2D(world.width - 3, world.height - 8 - 25),
    width: 6,
    height: 50,
  }),
})

const roof = new PhysicalObject({
  // Static
  mass: 0,
  shape: new RectangleRigidShape({
    angle: -Math.PI / 12,
    center: new Vec2D(world.width - 18, 15),
    width: 40,
    height: 6,
  }),
})

const fallingBall = new PhysicalObject({
  mass: 1,
  shape: new CircleRigidShape({
    angle: 0,
    center: new Vec2D(world.width / 2, 1),
    radius: 3,
  }),
})

const startingObjects = [ground, fallingBall, platform, wall, roof]

window.addEventListener("keydown", (e) => {
  if (e.key === " ") {
    for (const obj of engine.objects) {
      engine.removeObject(obj.id)
    }
    for (const obj of startingObjects.map((o) => o.copy())) {
      engine.addObject(obj)
    }
  }

  if (!mouse.position) return

  const center = mouse.position.div(pxPerM)

  if (e.key === "r") {
    const newObj = new PhysicalObject({
      mass: 3,
      shape: new RectangleRigidShape({
        angle: 0,
        center,
        height: 3,
        width: 3,
      }),
    })
    engine.addObject(newObj)
    menu.select(newObj.id)
  }
  if (e.key === "c") {
    const newObj = new PhysicalObject({
      mass: 1,
      shape: new CircleRigidShape({
        angle: 0,
        center,
        radius: 2,
      }),
    })
    engine.addObject(newObj)
    menu.select(newObj.id)
  }
})

const engine = new PhysicsEngine({
  width: world.width,
  height: world.height,
  objects: startingObjects.map((o) => o.copy()),
})

const dampingHook = createDumpingHook({ linear: -0.1, angular: -0.1 })

engine.addPreUpdateHook(dampingHook)

engine.addPostUpdateHook((engine) => {
  for (const obj of engine.objects) {
    if (obj.position.x < 0 || obj.position.x > world.width) {
      engine.removeObject(obj.id)
    }
  }
})

const menu = new Menu({ engine, mouse, pxPerM })
const forceApplier = new ForceApplier({ engine, menu, mouse, pxPerM, vancas })

vancas.render = () => {
  vancas.background("lightgrey")

  menu.updateInfo()

  const colors = ["white", "brown", "purple", "yellow", "green", "blue", "orange", "pink", "cyan"]

  for (const obj of engine.objects) {
    const isSelected = obj.id === menu.selectedId
    if (obj.mass === 0) {
      drawers.draw(obj, "black", isSelected)
    } else {
      drawers.draw(obj, colors[obj.id % colors.length], isSelected)
    }
  }

  forceApplier.draw()

  if (mouse.position) {
    const pos = mouse.position
    const w = 15
    const h = 15
    const l = 2
    let c
    switch (mouse.button) {
      case "left":
        c = "red"
        break
      case "right":
        c = "green"
        break
      default:
        c = "grey"
        break
    }

    vancas.line({
      x1: pos.x,
      x2: pos.x,
      y1: pos.y - h / 2,
      y2: pos.y + h / 2,
      lineWidth: l,
      color: c,
    })

    vancas.line({
      x1: pos.x - w / 2,
      x2: pos.x + w / 2,
      y1: pos.y,
      y2: pos.y,
      lineWidth: l,
      color: c,
    })
  }
}

vancas.start()

engine.start()
