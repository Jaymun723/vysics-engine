import { Arbiter } from "./Arbiter"
import { ArbiterManager } from "./ArbiterManager"

const createFakeArbiter = (ops: { id: number; col: boolean }): Arbiter => {
  return {
    hasCollision() {
      return ops.col
    },
    sameHas(other: any) {
      return ops.id === other.id
    },
    id: ops.id,
  } as any
}

describe("ArbiterManager", () => {
  test("newEntry", () => {
    const a = createFakeArbiter({ col: true, id: 1 })

    const manager = new ArbiterManager()

    manager.newEntry(a)
    expect(manager.arbiters.length).toBe(1)
    expect(manager.arbiters[0]).toBe(a)

    expect(manager.find(a)).toBe(a)

    const b = createFakeArbiter({ col: false, id: 1 })

    expect(manager.find(b)).toBe(a)
    manager.newEntry(b)

    expect(manager.arbiters.length).toBe(0)

    manager.newEntry(b)
    expect(manager.arbiters.length).toBe(0)

    manager.newEntry(a)
    expect(manager.arbiters.length).toBe(1)
    expect(manager.arbiters[0]).toBe(a)

    const c = createFakeArbiter({ col: true, id: 1 })
    manager.newEntry(c)

    expect(manager.arbiters.length).toBe(1)
    expect(manager.arbiters[0]).toBe(c)
  })
})
