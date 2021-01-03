import { Polygon, Vec2D } from "maabm"
import { createVancas } from "vancas"
import { RectangleRigidShape } from "../src/Shapes"
import { PolygonRigidShape } from "../src/Shapes/Polygon"

const vancas = createVancas({
  height: 500,
  width: 500,
})

const root = document.getElementById("root")
if (root) {
  root.innerHTML = ""
  root.appendChild(vancas.canvasEl)
}

// const polygon = [new Vec2D(3, 4), new Vec2D(5, 3), new Vec2D(4, 1), new Vec2D(2, 1), new Vec2D(1, 3)].map((v) =>
//   v.mul(50)
// )

const pol = new PolygonRigidShape({
  angle: 0,
  vertices: [new Vec2D(3, 4), new Vec2D(5, 3), new Vec2D(4, 1), new Vec2D(2, 1), new Vec2D(1, 3)].map((v) => v.mul(50)),
})

const polygon = pol.vertices
const mass = 1

const computeEdges = (polygon: Vec2D[]) => {
  const edges: Vec2D[] = []
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length
    const edge = polygon[j].sub(polygon[i])
    edges.push(edge)
  }
  return edges
}

const pointInPolygon = (polygon: Vec2D[], point: Vec2D) => {
  const substitutePointInLine = (pt1: Vec2D, pt2: Vec2D, queryPoint: Vec2D) => {
    return (queryPoint.y - pt1.y) * (pt2.x - pt1.x) - (queryPoint.x - pt1.x) * (pt2.y - pt1.y)
  }

  const numSidesOfPolygon = polygon.length
  let countSameSideResults = 0
  for (let i = 0; i < numSidesOfPolygon; i++) {
    const pointInLine = substitutePointInLine(polygon[i], polygon[(i + 1) % numSidesOfPolygon], point)
    if (pointInLine == 0) {
      return pointInLine
    }

    countSameSideResults += pointInLine > 0 ? 0 : 1
  }
  return Math.abs(countSameSideResults) == numSidesOfPolygon ? 1 : -1
}

const computesAngles = (polygon: Vec2D[]) => {
  const angles: number[] = []

  for (let i = 0; i < polygon.length; i++) {
    const h = (i + polygon.length - 1) % polygon.length
    const j = (i + 1) % polygon.length

    const a = polygon[h].sub(polygon[i])
    const b = polygon[j].sub(polygon[i])

    let angle = Math.atan2(a.cross(b), a.dot(b))

    if (angle < 0) {
      angle *= -1
      angle += Math.PI
    }

    angles.push(angle)
  }

  return angles
}

const computeCentroid = (polygon: Vec2D[]) => {
  const sum = polygon.reduce((prev, cur) => prev.add(cur))
  return sum.div(polygon.length)
}

const computeBoundRadius = (polygon: Vec2D[]) => {
  const centroid = computeCentroid(polygon)

  let bestDistance = 0
  for (let i = 0; i < polygon.length; i++) {
    const dist = polygon[i].sub(centroid).norm()

    if (dist > bestDistance) {
      bestDistance = dist
    }
  }

  return bestDistance
}

const computeInertia = (polygon: Vec2D[], mass: number) => {
  let area = 0
  let center = new Vec2D(0, 0)
  let moment = 0
  let prev = polygon.length - 1
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[prev]
    const b = polygon[i]
    const area_step = a.cross(b) / 2
    const center_step = a.add(b).div(3)
    const moment_step = (area_step * (a.dot(a) + b.dot(b) + a.dot(b))) / 6
    center = center
      .mul(area)
      .add(center_step.mul(area_step))
      .div(area + area_step)
    area += area_step
    moment += moment_step
    prev = i
  }
  const density = mass / area
  moment *= density
  moment -= mass * center.dot(center)
  return moment
}

const computeNormals = (polygon: Vec2D[]) => {
  const edges = computeEdges(polygon)
  return edges.map((e) => new Vec2D(-e.y, e.x).normalize())
}

const hit = (click: Vec2D, vertex: Vec2D) => {
  const dist = vertex.sub(click).norm()
  if (dist < 25) {
    return true
  }
  return false
}

let selectedVertexIndex: undefined | number = undefined

window.addEventListener("mousedown", (e) => {
  const click = Vec2D.from(vancas.mouse)

  if (selectedVertexIndex !== undefined) {
    const vertex = polygon[selectedVertexIndex]
    if (hit(click, vertex)) {
      selectedVertexIndex = undefined
    }
  } else {
    for (let i = 0; i < polygon.length; i++) {
      const vertex = polygon[i]
      if (hit(click, vertex)) {
        selectedVertexIndex = i
      }
    }
  }
})

{
  const c = computeCentroid(polygon)
  console.log(pointInPolygon(polygon, c))
}

vancas.mouse.contextmenu = false
vancas.mouse.preventDefault = true

vancas.update = (dt) => {
  const mouse = Vec2D.from(vancas.mouse)
  if (selectedVertexIndex !== undefined) {
    polygon[selectedVertexIndex] = mouse
  }

  if (vancas.mouse.button === 2) {
    pol.rotate((Math.PI / 6) * dt)

    const dist = mouse.sub(pol.center)

    pol.move(dist)
  }
}

vancas.render = () => {
  vancas.background("grey")

  const angles = computesAngles(polygon)
  const isNotValid = angles.some((a) => a > Math.PI)

  const mouse = Vec2D.from(vancas.mouse)

  const mousIn = Polygon.isPointIn(polygon, mouse) > -1

  const shaper = vancas.getShaper({ color: isNotValid ? "red" : mousIn ? "lightgrey" : "white" })
  shaper.start().go(polygon[0].x, polygon[0].y)
  for (let i = 1; i < polygon.length; i++) {
    shaper.line(polygon[i].x, polygon[i].y)
  }
  shaper.done()

  const edges = computeEdges(polygon)
  const normals = computeNormals(polygon)
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length

    const vertex = polygon[i]
    const angle = angles[i]
    vancas.circle({
      radius: 5,
      x: vertex.x,
      y: vertex.y,
      color: i === selectedVertexIndex ? "red" : "black",
    })
    vancas.text({
      text: `Vertex ${i}, ${angle.toFixed(4)}`,
      x: vertex.x,
      y: vertex.y + 10,
    })

    const endPoint = vertex.add(edges[i])

    vancas.line({
      x1: vertex.x,
      y1: vertex.y,
      x2: endPoint.x,
      y2: endPoint.y,
    })

    const center = vertex.add(polygon[j]).div(2)
    vancas.text({
      text: `Edge ${i}, ${edges[i].norm().toFixed(0)}`,
      x: center.x,
      y: center.y,
    })

    const normal = normals[i]
    const normalEndPoint = center.add(normal.mul(20))

    vancas.line({
      x1: center.x,
      y1: center.y,
      x2: normalEndPoint.x,
      y2: normalEndPoint.y,
    })
  }

  const centroid = computeCentroid(polygon)

  vancas.circle({
    x: centroid.x,
    y: centroid.y,
    radius: 5,
  })

  const radius = computeBoundRadius(polygon)

  vancas.circle({
    x: centroid.x,
    y: centroid.y,
    radius,
    stroke: true,
  })

  // {
  //   const vertex = polygon[1]
  //   const a = vertex.sub(polygon[0]).mul(-1)
  //   vancas.line({
  //     x1: vertex.x,
  //     y1: vertex.y,
  //     x2: vertex.add(a).x,
  //     y2: vertex.add(a).y,
  //     color: "red",
  //   })

  //   const b = polygon[2].sub(vertex)
  //   vancas.line({
  //     x1: vertex.x,
  //     y1: vertex.y,
  //     x2: vertex.add(b).x,
  //     y2: vertex.add(b).y,
  //     color: "green",
  //   })

  //   const dot = b.dot(a)
  //   const lengths = a.norm() * b.norm()

  //   let angle = (Math.atan2(a.cross(b), a.dot(b)) * 180) / Math.PI

  //   vancas.text({
  //     text: `${angle.toFixed(0)}`,
  //     x: vertex.x + 10,
  //     y: vertex.y,
  //   })
  // }
}

vancas.start()
