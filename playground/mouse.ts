import { Vec2D } from "maabm"
import { Vancas } from "vancas"

interface MouseOptions {
  vancas: Vancas
}

export class Mouse {
  public button: "left" | "middle" | "right" | undefined
  public position: Vec2D | undefined

  private vancas: Vancas

  constructor(ops: MouseOptions) {
    this.vancas = ops.vancas

    this.vancas.canvasEl.addEventListener("mousedown", (e) => {
      this.setMousePosition(e)

      switch (e.button) {
        case 0:
          this.button = "left"
          break
        case 1:
          this.button = "middle"
          break
        case 2:
          this.button = "right"
          break
      }
    })
    this.vancas.canvasEl.addEventListener("mouseleave", (e) => {
      this.position = undefined
      this.button = undefined
    })
    this.vancas.canvasEl.addEventListener("mousemove", (e) => {
      this.setMousePosition(e)
    })
    this.vancas.canvasEl.addEventListener("mouseup", (e) => {
      this.setMousePosition(e)
      this.button = undefined
    })
  }

  private setMousePosition = (e: MouseEvent) => {
    this.position = new Vec2D(
      e.clientX - (this.vancas.canvasEl.offsetLeft - window.pageXOffset),
      e.clientY - (this.vancas.canvasEl.offsetTop - window.pageYOffset)
    )
  }
}
