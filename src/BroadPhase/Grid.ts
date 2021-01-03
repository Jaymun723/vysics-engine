import { Vec2D } from "maabm"
import { PhysicalObject } from "../Objects"
import { AABBox, intersectAABB, shapeToBox } from "."
import { Vancas } from "vancas"

export interface SpatialGridProps {
  min: Vec2D
  max: Vec2D
  pxPerCell: number
}

export class SpatialGrid {
  public min: Vec2D
  public max: Vec2D
  public pxPerCell: number

  public width: number
  public height: number
  public totalCells: number
  public allocatedCells = 0

  public checked: { [hash: string]: true } = {}
  public hashChecked = 0

  public grid: PhysicalObject[][][]

  constructor(ops: SpatialGridProps) {
    this.min = ops.min
    this.max = ops.max
    this.pxPerCell = ops.pxPerCell

    const size = this.max.sub(this.min)
    this.width = Math.floor(size.x / this.pxPerCell)
    this.height = Math.floor(size.y / this.pxPerCell)
    this.totalCells = this.width * this.height

    this.grid = Array(this.width)
  }

  public insert(obj: PhysicalObject) {
    const box = shapeToBox(obj.shape)

    const cellBox: AABBox = {
      min: box.min.div(this.pxPerCell).map(Math.floor),
      max: box.max.div(this.pxPerCell).map(Math.floor),
    }

    const xMax = Math.min(cellBox.max.x, this.width - 1)
    const yMax = Math.min(cellBox.max.y, this.height - 1)

    for (let x = cellBox.min.x; x <= xMax; x++) {
      if (!this.grid[x]) {
        this.grid[x] = Array(this.height)
      }
      for (let y = cellBox.min.y; y <= yMax; y++) {
        if (!this.grid[x][y]) {
          this.grid[x][y] = []
          this.allocatedCells++
        }
        this.grid[x][y].push(obj)
      }
    }
  }

  public checkCollision() {
    const couples: PhysicalObject[][] = []

    for (let x = 0; x < this.width; x++) {
      if (!this.grid[x]) continue

      for (let y = 0; y < this.height; y++) {
        if (!this.grid[x][y]) continue

        const cell = this.grid[x][y]

        for (let i = 0; i < cell.length; i++) {
          for (let j = i + 1; j < cell.length; j++) {
            const a = cell[i]
            const b = cell[j]

            const hashAtoB = `${a.id}:${b.id}`
            const hashBtoA = `${b.id}:${a.id}`

            this.hashChecked += 2

            if (!this.checked[hashAtoB] && !this.checked[hashBtoA]) {
              this.checked[hashAtoB] = true
              this.checked[hashBtoA] = true

              const aBox = shapeToBox(a.shape)
              const bBox = shapeToBox(b.shape)

              if (intersectAABB(aBox, bBox)) {
                if (!(a.mass === 0 && b.mass === 0)) {
                  couples.push([a, b])
                }
              }
            }
          }
        }
      }
    }

    return couples
  }
}
