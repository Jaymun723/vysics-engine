import { Vec2D } from "maabm"
import { SpatialGrid, SpatialGridProps } from "../BroadPhase"
import { getContactPoints } from "../Collision/ContactPoints"
import { EPA, GJK } from "../Collision/GJK"
import { PhysicalObject } from "../Objects"

interface CreateManifoldsOptions {
  gridOptions: SpatialGridProps
  bodies: PhysicalObject[]
}

export const createManifolds = (options: CreateManifoldsOptions) => {
  const grid = new SpatialGrid(options.gridOptions)

  for (const body of options.bodies) {
    grid.insert(body)
  }

  const couples = grid.checkCollision()

  const manifolds: Vec2D[][] = []

  for (const [a, b] of couples) {
    const gjkResult = GJK(a.shape, b.shape)
    if (gjkResult) {
      const { depth, normal } = EPA(a.shape, b.shape, gjkResult)

      const contacts = getContactPoints({
        a: a.shape,
        b: b.shape,
        normal,
      })

      manifolds.push(contacts)
    }
  }

  return manifolds
}
