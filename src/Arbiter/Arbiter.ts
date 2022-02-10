import { polygonPolygonCollision } from "../Collision"
import { Contact } from "../Constraints/_Contacts"
import { PhysicalObject } from "../Objects"
import { PolygonRigidShape } from "../Shapes"

export class Arbiter {
  public key: number
  public a: PhysicalObject<PolygonRigidShape>
  public b: PhysicalObject<PolygonRigidShape>
  public contact?: Contact
  public friction?: number

  constructor(a: PhysicalObject<PolygonRigidShape>, b: PhysicalObject<PolygonRigidShape>) {
    this.key = a.id + b.id
    this.a = a
    this.b = b

    if (a.shape.type === "polygon" && b.shape.type === "polygon") {
      const result = polygonPolygonCollision(a.shape, b.shape)

      if (result) {
        this.friction = Math.sqrt(a.friction * b.friction)
        this.contact = new Contact({
          collisionInfo: { ...result, a: this.a, b: this.b },
        })
      }
    } else {
      throw new Error("Not implemented yet.")
    }
  }
}
