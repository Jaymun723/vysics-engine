import { CollisionInfo } from "../Collision"
import { PhysicalObject } from "../Objects"

export interface BroadPhaseBaseProps {
  objects: PhysicalObject[]
}

export type BroadPhaseBaseFunction<Props extends BroadPhaseBaseProps = BroadPhaseBaseProps> = (
  props: Props
) => CollisionInfo<PhysicalObject, PhysicalObject>[]

export * from "./AABB"
export * from "./BruteBroadPhase"
export * from "./Grid"
export * from "./GridBroadPhase"
export * from "./utils"
