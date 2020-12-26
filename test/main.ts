import { Vec2D } from 'maabm'
import { createVancas } from 'vancas'
import { RectangleRigidShape, CircleRigidShape, RigidShape } from '../src/'
import { PhysicsEngine } from '../src/Engine'
import { PhysicalObject } from '../src/Objects'

// const shapes = [
//   new RectangleRigidShape({
//     angle: 0,
//     center: new Vec2D(250, 475),
//     height: 50,
//     width: 400,
//   }),
//   new CircleRigidShape({
//     angle: 0,
//     center: new Vec2D(250, 0),
//     radius: 75,
//   }),
//   new RectangleRigidShape({
//     angle: 0,
//     center: new Vec2D(250, 400),
//     width: 100,
//     height: 100,
//   }),
//   // new CircleRigidShape({
//   //   angle: 0,
//   //   center: new Vec2D(200, 200),
//   //   radius: 100,
//   // }),
//   // new RectangleRigidShape({
//   //   angle: Math.PI / 2,
//   //   center: new Vec2D(400, 400),
//   //   height: 100,
//   //   width: 100,
//   // }),
// ] as RigidShape[]

const physicalObjects = [
  new PhysicalObject({
    shape: new CircleRigidShape({
      angle: 0,
      center: new Vec2D(150, 250),
      radius: 20,
    }),
    // shape: new RectangleRigidShape({
    //   angle: 0,
    //   center: new Vec2D(150, 250),
    //   width: 100,
    //   height: 100,
    // }),
    mass: 1,
    initialVelocity: new Vec2D(50, -50),
  }),
  new PhysicalObject({
    shape: new RectangleRigidShape({
      angle: 0,
      center: new Vec2D(250, 475),
      height: 50,
      width: 400,
    }),
    mass: 0,
    friction: 0.1,
  }),
  new PhysicalObject({
    shape: new CircleRigidShape({
      angle: 0,
      center: new Vec2D(500 - 150, 250),
      radius: 20,
    }),
    // shape: new RectangleRigidShape({
    //   angle: 0,
    //   center: new Vec2D(500 - 150, 250),
    //   width: 100,
    //   height: 100,
    // }),
    mass: 2,
    initialVelocity: new Vec2D(-50, -50),
  }),
  // new PhysicalObject({
  //   shape: new CircleRigidShape({
  //     angle: 0,
  //     center: new Vec2D(250, 0),
  //     radius: 75,
  //   }),
  //   mass: 1,
  // }),
  // new PhysicalObject({
  //   shape: new RectangleRigidShape({
  //     angle: 0,
  //     center: new Vec2D(250, 400),
  //     width: 100,
  //     height: 100,
  //   }),
  //   mass: 1,
  // }),
]

const engine = new PhysicsEngine({
  objects: physicalObjects,
  positionalCorrection: { iterations: 15, rate: 0.8 },
})

const vancas = createVancas({ height: 500, width: 500 })

// @ts-ignore
global.vancas = vancas

vancas.mouse.contextmenu = false
vancas.mouse.preventDefault = true

let objectSelector = 0
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') {
    objectSelector = (objectSelector + 1) % (physicalObjects.length + 1)
  }
})

vancas.update = (dt) => {
  const selectedObject = physicalObjects[objectSelector]
  if (selectedObject) {
    if (vancas.mouse.button === 1) {
      selectedObject.rotate((Math.PI / 6) * dt)
    } else if (vancas.mouse.button === 2) {
      // selectedShape.move(new Vec2D(0, -10 * dt))
      selectedObject.rotate((-Math.PI / 6) * dt)
    }
    // const mouse = Vec2D.from(vancas.mouse)
    // selectedShape.move(mouse.sub(selectedShape.position))
  }

  // collisions = broadPhase(shapes)
  engine.computeCollisions(vancas)
  engine.update(dt)
}

const debugObj = (obj: PhysicalObject, color: string) => {
  if (obj.shape.type === 'rectangle') {
    debugRect(obj.shape, color)
  } else if (obj.shape.type === 'circle') {
    debugCircle(obj.shape, color)
  }

  vancas.circle({
    x: obj.position.x,
    y: obj.position.y,
    stroke: true,
    color: 'orange',
    radius: 5,
  })
  const velocityPoint = obj.position.add(obj.velocity.mul(1))
  vancas.line({
    x1: obj.position.x,
    y1: obj.position.y,
    x2: velocityPoint.x,
    y2: velocityPoint.y,
    color: 'orange',
  })
}

const debugRect = (rect: RectangleRigidShape, color: string) => {
  const shaper = vancas.getShaper({ color })
  shaper
    .start()
    .go(rect.vertices[0].x, rect.vertices[0].y)
    .line(rect.vertices[1].x, rect.vertices[1].y)
    .line(rect.vertices[2].x, rect.vertices[2].y)
    .line(rect.vertices[3].x, rect.vertices[3].y)
    .done()
  vancas.circle({ x: rect.center.x, y: rect.center.y, radius: 2 })
  for (let i = 0; i < 4; i++) {
    const vertex = rect.vertices[i]
    vancas.circle({
      radius: 2,
      x: vertex.x,
      y: vertex.y,
    })

    const j = i === 3 ? 0 : i + 1
    const secondVertex = rect.vertices[j]
    const middle = vertex.add(secondVertex).div(2)
    vancas.circle({ radius: 2, x: middle.x, y: middle.y })
    const normal = rect.normals[i]
    const end = middle.add(normal.mul(20))
    vancas.line({ x1: middle.x, y1: middle.y, x2: end.x, y2: end.y })
  }

  vancas.circle({
    x: rect.center.x,
    y: rect.center.y,
    radius: rect.boundRadius,
    stroke: true,
  })
}

const debugCircle = (circle: CircleRigidShape, color: string) => {
  vancas.circle({
    radius: circle.radius,
    x: circle.center.x,
    y: circle.center.y,
    color,
  })
  vancas.circle({ radius: 2, x: circle.center.x, y: circle.center.y })
  vancas.line({
    x1: circle.center.x,
    y1: circle.center.y,
    x2: circle.linePoint.x,
    y2: circle.linePoint.y,
  })
  vancas.circle({
    radius: circle.boundRadius,
    x: circle.center.x,
    y: circle.center.y,
    stroke: true,
  })
}

vancas.render = () => {
  vancas.background('grey')

  for (let i = 0; i < physicalObjects.length; i++) {
    debugObj(physicalObjects[i], i === objectSelector ? 'red' : 'white')
  }

  // for (const collision of collisions) {
  //   vancas.circle({
  //     x: collision.start.x,
  //     y: collision.start.y,
  //     radius: 2,
  //     color: "purple",
  //   })
  //   vancas.line({
  //     x1: collision.start.x,
  //     y1: collision.start.y,
  //     x2: collision.end.x,
  //     y2: collision.end.y,
  //     color: "purple",
  //   })
  // }

  // for (const [a, b] of couples) {
  //   vancas.line({
  //     x1: a.center.x,
  //     y1: a.center.y,
  //     x2: b.center.x,
  //     y2: b.center.y,
  //   })
  // }
}

vancas.start()

const root = document.getElementById('root')
if (root) {
  root.innerHTML = ''
  root.appendChild(vancas.canvasEl)
}
