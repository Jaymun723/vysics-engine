import { Vec2D } from "maabm"
import { resolveCollision } from "../Collision"
import { PhysicalObject } from "../Objects"
import { broadPhase } from "./BroadPhase"

export * from "./BroadPhase"

interface PositionalCorrection {
  iterations: number
  rate: number
}

interface PhysicsEngineProps {
  objects: PhysicalObject[]
  positionalCorrection?: PositionalCorrection
  fps?: number
  preUpdateHook?: (dt: number) => void
  postUpdateHook?: (dt: number) => void
  drawHook?: () => void
}

export class PhysicsEngine {
  public objects: PhysicalObject[]
  public positionalCorrection?: PositionalCorrection

  public fps: number
  public updateIntervalMilliseconds: number
  public updateIntervalSeconds: number

  public preUpdateHook?: (dt: number) => void
  public postUpdateHook?: (dt: number) => void
  public drawHook?: () => void

  private running = false
  private time = {
    current: 0,
    elapsed: 0,
    previous: 0,
    lag: 0,
  }

  public static gravity = new Vec2D(0, 9.81)

  constructor(ops: PhysicsEngineProps) {
    this.objects = ops.objects
    this.positionalCorrection = ops.positionalCorrection
    this.fps = ops.fps || 60
    this.updateIntervalMilliseconds = 1000 / this.fps
    this.updateIntervalSeconds = 1 / this.fps
    this.preUpdateHook = ops.preUpdateHook
    this.postUpdateHook = ops.postUpdateHook
    this.drawHook = ops.drawHook
  }

  public start() {
    this.running = true
    this.step()
  }
  public stop() {
    this.running = false
  }

  private step() {
    if (!this.running) return
    const now = Date.now()
    if (this.time.previous === 0) {
      this.time.previous = now
    }
    requestAnimationFrame(() => {
      this.step()
    })

    this.time.current = now
    this.time.elapsed = this.time.current - this.time.previous
    this.time.previous = this.time.current
    this.time.lag += this.time.elapsed

    while (this.time.lag >= this.updateIntervalMilliseconds) {
      this.time.lag -= this.updateIntervalMilliseconds
      if (this.preUpdateHook) this.preUpdateHook(this.updateIntervalSeconds)
      this.computeCollisions()
      this.update(this.updateIntervalSeconds)
      if (this.postUpdateHook) this.postUpdateHook(this.updateIntervalSeconds)
    }

    if (this.drawHook) this.drawHook()
  }

  public update(dt: number) {
    for (const object of this.objects) {
      object.update(dt)
    }
  }

  public computeCollisions() {
    if (this.positionalCorrection) {
      for (let i = 0; i < this.positionalCorrection.iterations; i++) {
        const collisions = broadPhase(this.objects)
        for (const collision of collisions) {
          resolveCollision(collision, this.positionalCorrection)
        }
      }
    } else {
      const collisions = broadPhase(this.objects)
      for (const collision of collisions) {
        resolveCollision(collision)
      }
    }
  }
}
