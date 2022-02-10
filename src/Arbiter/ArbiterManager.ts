import { Arbiter } from "./Arbiter"

export class ArbiterManager {
  public arbiters: Arbiter[] = []

  public find(targetArbiter: Arbiter): undefined | Arbiter {
    for (let i = 0; i < this.arbiters.length; i++) {
      const currentArbiter = this.arbiters[i]

      if (targetArbiter.sameHas(currentArbiter)) {
        return currentArbiter
      }
    }
  }

  private insert(arb: Arbiter): void {
    this.arbiters.push(arb)
  }

  private update(current: Arbiter, newer: Arbiter): void {
    for (let i = 0; i < this.arbiters.length; i++) {
      if (this.arbiters[i].sameHas(current)) {
        this.arbiters[i] = newer
      }
    }
  }

  private remove(arbiter: Arbiter): void {
    for (let i = 0; i < this.arbiters.length; i++) {
      if (this.arbiters[i].sameHas(arbiter)) {
        // @ts-ignore
        // this.arbiters[i] = undefined
        delete this.arbiters[i]
      }
    }

    this.arbiters = this.arbiters.filter(Boolean)
  }

  public newEntry(arbiter: Arbiter): void {
    const possibleArbiter = this.find(arbiter)
    const collisionArbiter = arbiter.hasCollision()
    if (!possibleArbiter && collisionArbiter) {
      this.insert(arbiter)
    } else if (possibleArbiter && collisionArbiter) {
      this.update(possibleArbiter, arbiter)
    } else if (possibleArbiter && !collisionArbiter) {
      this.remove(possibleArbiter)
    }
  }
}
