import { Vec2D } from 'maabm'
import { RigidShape } from '../Shapes'

interface CollisionInfoProps<AType = RigidShape, BType = RigidShape> {
  depth: number
  normal: Vec2D
  start: Vec2D
  a: AType
  b: BType
}

export class CollisionInfo<AType = RigidShape, BType = RigidShape> {
  public a: AType
  public b: BType

  public depth: number
  public normal: Vec2D
  public start: Vec2D
  public end: Vec2D

  constructor(ops: CollisionInfoProps<AType, BType>) {
    this.a = ops.a
    this.b = ops.b
    this.depth = ops.depth
    this.normal = ops.normal
    this.start = ops.start
    this.end = this.start.add(this.normal.mul(this.depth))
  }

  public changeDirection() {
    return new CollisionInfo({
      a: this.a,
      b: this.b,
      depth: this.depth,
      normal: this.normal.mul(-1),
      start: this.end,
    })
  }
}
