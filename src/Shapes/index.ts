import { Vec2D } from "maabm"
import { CircleRigidShape } from "./Circle"
import { PolygonRigidShape } from "./Polygon"
import { RectangleRigidShape } from "./Rectangle"

export interface BaseRigidShapeProps {
  /**
   * The distance between the centroid of the shape and the origin.
   * In m
   */
  center: Vec2D
  /**
   * In rad
   */
  angle: number
}

/**
 * All shapes must be convex !
 */
export abstract class BaseRigidShape {
  /**
   * The distance between the centroid of the shape and the origin.
   * In m
   */
  public center: Vec2D

  /**
   * In rad
   */
  public angle: number

  /**
   * The boundAABB vector hold the width of the AABB in the x component and its height in the y component.
   */
  public abstract boundAABB: Vec2D

  public abstract type: string

  constructor(ops: BaseRigidShapeProps) {
    this.center = ops.center
    this.angle = ops.angle
  }

  /**
   * @param direction In m
   */
  public abstract move(direction: Vec2D): void

  /**
   * @param angle In rad
   */
  public abstract rotate(angle: number): void

  /**
   * @param mass In kg
   * @returns The moment of inertia in kg*m^2
   */
  public abstract getInertia(mass: number): number

  /**
   * @returns The area in m^2
   */
  public abstract getArea(): number

  // TODO: maybe a better handling of this
  public abstract copy(): BaseRigidShape

  /**
   * Used in GJK
   */
  public abstract furthestPoint(direction: Vec2D): Vec2D
}

export * from "./Rectangle"
export * from "./Circle"
export * from "./Polygon"

export type RigidShape = CircleRigidShape | RectangleRigidShape | PolygonRigidShape
