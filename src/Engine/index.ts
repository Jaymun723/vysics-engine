import { Vec2D } from "maabm"
import { resolveCollision } from "../Collision"
import { PhysicalObject } from "../Objects"
import { gravityHook, CollisionHook, UpdateHook } from "./Hooks"
import { BroadPhaseBaseFunction, bruteBroadPhase, gridBroadPhase } from "../BroadPhase"

export * from "./Hooks"

interface PositionalCorrection {
  iterations: number
  rate: number
}

interface PhysicsEngineProps {
  objects: PhysicalObject[]
  width: number
  height: number

  positionalCorrection?: PositionalCorrection
  fps?: number

  preUpdateHooks?: UpdateHook[]
  postUpdateHooks?: UpdateHook[]
  drawHook?: () => void

  shouldCollideHook?: CollisionHook<boolean>
  postCollideHook?: CollisionHook

  broadPhase?: "grid" | "brute"
  pxPerCell?: number
}

export class PhysicsEngine {
  public objects: PhysicalObject[]
  public width: number
  public height: number
  public positionalCorrection?: PositionalCorrection

  public broadPhaseFunction: BroadPhaseBaseFunction

  public fps: number
  public updateIntervalMilliseconds: number
  public updateIntervalSeconds: number
  public dt: number

  public preUpdateHooks: UpdateHook[]
  public postUpdateHooks: UpdateHook[]
  public shouldCollideHook?: CollisionHook<boolean>
  public postCollideHook?: CollisionHook
  public drawHook?: () => void

  private idIncrementor = 0

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
    for (const obj of this.objects) {
      obj.id = this.idIncrementor
      this.idIncrementor++
    }

    this.width = ops.width
    this.height = ops.height

    if (ops.broadPhase && ops.broadPhase === "brute") {
      this.broadPhaseFunction = bruteBroadPhase
    } else {
      this.broadPhaseFunction = (props) =>
        gridBroadPhase({
          min: new Vec2D(0, 0),
          max: new Vec2D(this.width, this.height),
          pxPerCell: ops.pxPerCell || 10,
          ...props,
        })
    }

    this.positionalCorrection = ops.positionalCorrection
    this.fps = ops.fps || 60
    this.updateIntervalMilliseconds = 1000 / this.fps
    this.updateIntervalSeconds = 1 / this.fps
    this.dt = this.updateIntervalSeconds

    this.preUpdateHooks = ops.preUpdateHooks || [gravityHook]
    this.postUpdateHooks = ops.preUpdateHooks || []

    this.drawHook = ops.drawHook

    this.shouldCollideHook = ops.shouldCollideHook
    this.postCollideHook = ops.postCollideHook
  }

  public addPreUpdateHook(hook: UpdateHook) {
    this.preUpdateHooks.push(hook)
  }

  public addPostUpdateHook(hook: UpdateHook) {
    this.postUpdateHooks.push(hook)
  }

  public addObject(object: PhysicalObject) {
    object.id = this.idIncrementor
    this.idIncrementor++
    this.objects.push(object)
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

    if (this.drawHook) this.drawHook()

    while (this.time.lag >= this.updateIntervalMilliseconds) {
      this.time.lag -= this.updateIntervalMilliseconds
      for (const preHook of this.preUpdateHooks) {
        preHook(this)
      }
      this.computeCollisions()
      this.update(this.updateIntervalSeconds)
      for (const postHook of this.postUpdateHooks) {
        postHook(this)
      }
    }
  }

  public update(dt: number) {
    for (const object of this.objects) {
      object.update(dt)
    }
  }

  public computeCollisions() {
    const resolution = () => {
      const collisions = this.broadPhaseFunction({ objects: this.objects })
      for (const collision of collisions) {
        if (this.shouldCollideHook) {
          const res = this.shouldCollideHook(collision)
          if (!res) {
            continue
          }
        }
        resolveCollision(collision, this.positionalCorrection)
        if (this.postCollideHook) this.postCollideHook(collision)
      }
    }

    if (this.positionalCorrection) {
      resolution()
    } else {
      resolution()
    }
  }
}
