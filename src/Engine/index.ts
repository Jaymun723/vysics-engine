import { Vec2D } from "maabm"
import { resolveCollision } from "../Collision"
import { PhysicalObject } from "../Objects"
import { gravityHook, CollisionHook, UpdateHook, createDragHook } from "./Hooks"
import { BroadPhaseBaseFunction, bruteBroadPhase, gridBroadPhase } from "../BroadPhase"

export * from "./Hooks"

interface PositionalCorrection {
  iterations: number
  rate: number
}

interface PhysicsEngineProps {
  objects: PhysicalObject[]

  /**
   * In m
   */
  width: number
  /**
   * In m
   */
  height: number

  /**
   * @default { iterations: 15, rate: 0.8 }
   */
  positionalCorrection?: PositionalCorrection | false

  /**
   * The maximum number of frames per seconds
   * @default 60
   */
  fps?: number

  /**
   * Principally used to add forces.
   * In the engine the gravity and drag hook are already integrated.
   * @default [gravityHook, dragHook]
   */
  preUpdateHooks?: UpdateHook[]

  /**
   * Principally used to add game logic (object outside of world for exemple).
   * @default []
   */
  postUpdateHooks?: UpdateHook[]

  /**
   * Called after all of the objects are correctly updated.
   */
  drawHook?: (engine: PhysicsEngine) => void

  /**
   * Used to implement game collision logic.
   * Must return a boolean value determining if the engine should solve the collision.
   */
  shouldCollideHook?: CollisionHook<boolean>

  /**
   * Called after a collision has been successfully solved.
   * May be used to implement more complex resolution.
   */
  postCollideHook?: CollisionHook

  /**
   * Broad phase method.
   * `grid` is usually the best.
   * @default "grid"
   */
  broadPhase?: "grid" | "brute"

  /**
   * Width / Height a grid cell (for the broad phase)
   * @default 1
   */
  mPerCell?: number

  /**
   * Density of fluid used in the engine.
   * Used for the drag forces.
   * By default it's the density of air: `1.2`.
   * Try `1000` for the water.
   * @default 1.2
   */
  density?: number
}

export class PhysicsEngine {
  public objects: PhysicalObject[]

  /**
   * In m
   */
  public width: number

  /**
   * In m
   */
  public height: number

  public positionalCorrection?: PositionalCorrection

  public broadPhaseFunction: BroadPhaseBaseFunction

  /**
   * Maximum frames per seconds.
   */
  public fps: number

  public updateIntervalMilliseconds: number
  public updateIntervalSeconds: number
  /**
   * Shortcut for `updateIntervalSeconds`.
   */
  public dt: number

  /**
   * Principally used to add forces.
   * In the engine the gravity and drag hook are already integrated.
   */
  public preUpdateHooks: UpdateHook[]

  /**
   * Principally used to add game logic (object outside of world for exemple).
   */
  public postUpdateHooks: UpdateHook[]

  /**
   * Used to implement game collision logic.
   * Must return a boolean value determining if the engine should solve the collision.
   */
  public shouldCollideHook?: CollisionHook<boolean>

  /**
   * Called after a collision has been successfully solved.
   * May be used to implement more complex resolution.
   */
  public postCollideHook?: CollisionHook

  /**
   * Called after all of the objects are correctly updated.
   */
  public drawHook?: (engine: PhysicsEngine) => void

  private idIncrementor = 0

  private running = false

  private time = {
    current: 0,
    elapsed: 0,
    previous: 0,
    lag: 0,
  }

  /**
   * Gravity vector used in the engine.
   * In m*s^-2
   */
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
          pxPerCell: ops.mPerCell || 10,
          ...props,
        })
    }

    if (ops.positionalCorrection) {
      this.positionalCorrection = ops.positionalCorrection
    } else if (ops.positionalCorrection === undefined) {
      this.positionalCorrection = { iterations: 18, rate: 0.8 }
    }

    this.fps = ops.fps || 60
    this.updateIntervalMilliseconds = 1000 / this.fps
    this.updateIntervalSeconds = 1 / this.fps
    this.dt = this.updateIntervalSeconds

    const density = ops.density || 1.2
    const dragHook = createDragHook(density)

    this.preUpdateHooks = ops.preUpdateHooks || [gravityHook, dragHook]
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

  /**
   * Adds a `PhysicalObject` to the engine.
   * Use this to update the object id.
   */
  public addObject(object: PhysicalObject) {
    object.id = this.idIncrementor
    this.idIncrementor++
    this.objects.push(object)
  }

  public removeObject(id: number) {
    this.objects = this.objects.filter((o) => o.id !== id)
  }

  public start() {
    this.running = true
    this.step()
  }
  public stop() {
    this.running = false
    this.time = {
      current: 0,
      elapsed: 0,
      previous: 0,
      lag: 0,
    }
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

    if (this.drawHook) this.drawHook(this)

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

  /**
   * You can use this method to update objects positions if you implement your own time stepping logic.
   * @param dt Interval of time between two updates.
   */
  public update(dt: number) {
    for (const object of this.objects) {
      object.update(dt)
    }
  }

  /**
   * You can use this method to solve collisions of objects if you implement your own time stepping logic.
   */
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
