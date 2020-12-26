import { Vancas } from 'vancas'
import { resolveCollision } from '../Collision/resolveCollision'
import { PhysicalObject } from '../Objects'
import { broadPhase } from './BroadPhase'

interface PhysicsEngineProps {
  objects: PhysicalObject[]
  positionalCorrection?: { iterations: number; rate: number }
}

export class PhysicsEngine {
  public objects: PhysicalObject[]
  public positionalCorrection?: { iterations: number; rate: number }

  constructor(ops: PhysicsEngineProps) {
    this.objects = ops.objects
    this.positionalCorrection = ops.positionalCorrection
  }

  public update(dt: number) {
    for (const object of this.objects) {
      object.update(dt)
    }
  }

  public computeCollisions(vancas: Vancas) {
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
