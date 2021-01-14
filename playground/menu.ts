import { Polygon } from "maabm"
import { PhysicsEngine } from "../src/Engine"
import { Mouse } from "./mouse"

type TxtElement = (txt: string) => void

const getTxtElement = (id: string): TxtElement => {
  const el = document.getElementById(id)
  if (!el) throw new Error(`\`#${id}\` element not found.`)

  return (txt: string) => {
    el.textContent = txt
  }
}

interface MenuOptions {
  engine: PhysicsEngine
  mouse: Mouse
  pxPerM: number
}

export class Menu {
  public selectedId: undefined | number
  public paused = false

  private engine: PhysicsEngine
  private mouse: Mouse
  private pxPerM: number

  private i = -1
  private infoEl: HTMLParagraphElement
  private txtElements: {
    id: TxtElement
    shapeType: TxtElement
    mass: TxtElement
    momentOfInertia: TxtElement
    friction: TxtElement
    restitution: TxtElement
    dragCoefficient: TxtElement
    position: TxtElement
    velocity: TxtElement
    angle: TxtElement
    angularVelocity: TxtElement
  }

  constructor(ops: MenuOptions) {
    this.engine = ops.engine
    this.mouse = ops.mouse
    this.pxPerM = ops.pxPerM

    const info = document.getElementById("info")
    if (!info) throw new Error("`#info` element not found.")
    this.infoEl = info as HTMLParagraphElement

    this.txtElements = {
      angle: getTxtElement("angle"),
      angularVelocity: getTxtElement("angular-velocity"),
      dragCoefficient: getTxtElement("drag-coefficient"),
      friction: getTxtElement("friction"),
      id: getTxtElement("id"),
      mass: getTxtElement("mass"),
      momentOfInertia: getTxtElement("moment-of-inertia"),
      position: getTxtElement("position"),
      restitution: getTxtElement("restitution"),
      shapeType: getTxtElement("shape-type"),
      velocity: getTxtElement("velocity"),
    }

    this.mouse.addEventListener((e) => {
      if (e.type === "mousedown" && (e.button === 0 || e.button === 2) && this.mouse.position) {
        const click = this.mouse.position.div(this.pxPerM)

        let selectI = undefined as undefined | number
        for (let i = 0; i < this.engine.objects.length; i++) {
          const obj = this.engine.objects[i]

          if (obj.shape.type === "circle") {
            const dist = obj.position.sub(click).norm()

            if (dist <= obj.shape.radius) {
              selectI = i
              break
            }
          } else {
            const res = Polygon.isPointIn(obj.shape.vertices, click)
            if (res !== -1) {
              selectI = i
              break
            }
          }
        }

        if (selectI !== undefined) {
          this.i = selectI
          const newId = this.engine.objects[selectI].id
          if (this.selectedId === newId && e.button === 0) {
            this.selectedId = undefined
          } else {
            this.selectedId = newId
          }
        }
      }
    })

    window.addEventListener("keydown", (e) => {
      if (e.key === "p") {
        this.toggle()
      }
    })
  }

  public play() {
    this.paused = false
    this.engine.start()
  }
  public pause() {
    this.paused = true
    this.engine.stop()
  }
  public toggle() {
    if (this.paused) {
      this.play()
    } else {
      this.pause()
    }
  }

  public previous() {
    this.i--
    if (this.i < 0) {
      this.i = this.engine.objects.length - 1
    }
    this.selectedId = this.engine.objects[this.i].id
  }
  public next() {
    this.i++
    if (this.i > this.engine.objects.length - 1) {
      this.i = 0
    }
    this.selectedId = this.engine.objects[this.i].id
  }
  public unselect() {
    this.i = -1
    this.selectedId = undefined
  }

  public select(id: number) {
    for (let i = 0; i < this.engine.objects.length; i++) {
      const o = this.engine.objects[i]
      if (o.id === id) {
        this.i = i
        this.selectedId = id
        return
      }
    }
  }

  public updateInfo() {
    if (this.selectedId === undefined) {
      this.infoEl.style.display = "none"
      return
    }
    const obj = this.engine.objects.find((o) => o.id === this.selectedId)
    if (!obj) {
      this.selectedId = undefined
      this.infoEl.style.display = "none"
      this.i = -1
      return
    }

    if (this.infoEl.style.display === "none") {
      this.infoEl.style.display = "block"
    }

    const fixPrecision = 4

    this.txtElements.id(obj.id.toString())
    this.txtElements.shapeType(obj.shape.type)
    this.txtElements.mass(obj.mass.toFixed(fixPrecision))
    this.txtElements.momentOfInertia(obj.inertia.toFixed(fixPrecision))
    this.txtElements.friction(obj.friction.toFixed(fixPrecision))
    this.txtElements.restitution(obj.restitution.toFixed(fixPrecision))
    this.txtElements.dragCoefficient(obj.dragCoefficient ? obj.dragCoefficient.toFixed(fixPrecision) : "none")
    this.txtElements.position(`(${obj.position.x.toFixed(fixPrecision)};${obj.position.y.toFixed(fixPrecision)})`)
    this.txtElements.velocity(`(${obj.velocity.x.toFixed(fixPrecision)};${obj.velocity.y.toFixed(fixPrecision)})`)
    this.txtElements.angle((((obj.angle * 180) / Math.PI) % 360).toFixed(4))
    this.txtElements.angularVelocity(((obj.angularVelocity * 180) / Math.PI).toFixed(4))
  }
}
