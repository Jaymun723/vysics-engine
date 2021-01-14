import { Polygon, Vec2D } from "maabm"
import { Vancas } from "vancas"
import { applyFlick, PhysicsEngine } from "../src/Engine"
import { Menu } from "./menu"
import { Mouse } from "./mouse"

interface ForceApplierOptions {
  engine: PhysicsEngine
  vancas: Vancas
  mouse: Mouse
  menu: Menu
  pxPerM: number
}

export class ForceApplier {
  private engine: PhysicsEngine
  private vancas: Vancas
  private mouse: Mouse
  private menu: Menu
  private pxPerM: number

  private startPoint: Vec2D | undefined

  constructor(ops: ForceApplierOptions) {
    this.engine = ops.engine
    this.vancas = ops.vancas
    this.mouse = ops.mouse
    this.menu = ops.menu
    this.pxPerM = ops.pxPerM

    this.mouse.addEventListener((e) => {
      if (e.type === "mouseleave" && this.startPoint) {
        this.startPoint = undefined
        return
      }

      if (!this.menu.selectedId) return
      const object = this.engine.objects.find((o) => o.id === this.menu.selectedId)
      if (!object || object.mass === 0) return

      if (!this.startPoint && e.type === "mousedown" && e.button === 2 && this.mouse.position) {
        const enginePosition = this.mouse.position.div(this.pxPerM)

        if (object.shape.type === "circle") {
          const dist = object.position.sub(enginePosition).norm()

          if (dist > object.shape.radius) return
        } else {
          if (Polygon.isPointIn(object.shape.vertices, enginePosition) === -1) return
        }

        this.menu.pause()
        this.startPoint = this.mouse.position
      } else if (e.type === "mouseup" && e.button === 2 && this.startPoint && this.mouse.position) {
        const force = this.startPoint.sub(this.mouse.position).mul(10)

        applyFlick({
          force,
          object,
          pointOfApplication: this.startPoint.div(this.pxPerM),
        })

        this.menu.play()
        this.startPoint = undefined
      }
    })
  }

  draw() {
    if (this.startPoint && this.mouse.position) {
      this.vancas.line({
        x1: this.startPoint.x,
        y1: this.startPoint.y,
        x2: this.mouse.position.x,
        y2: this.mouse.position.y,
        color: "white",
        lineWidth: 4.0,
      })
      this.vancas.line({
        x1: this.startPoint.x,
        y1: this.startPoint.y,
        x2: this.mouse.position.x,
        y2: this.mouse.position.y,
        color: "black",
        lineWidth: 3.0,
      })
    }
  }
}
