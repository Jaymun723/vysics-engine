import { Vec2D } from "maabm"
import { AABBox, intersectAABB } from "./AABB"

export const containsAABB = (a: AABBox, b: AABBox) => {
  return a.min.x <= b.min.x && a.min.y <= b.min.y && b.max.x <= a.max.x && b.max.y <= a.max.y
}

interface RTreeOptions {
  maxEntries: number
}

interface BoxNode {
  coordinates: AABBox
  children: BoxNode[]
  height: number
  leaf: boolean
}

export class RTree {
  private maxEntries: number
  private minEntries: number

  private data: BoxNode

  constructor(ops: RTreeOptions) {
    this.maxEntries = ops.maxEntries
    this.minEntries = Math.max(2, Math.floor(this.maxEntries * 0.4))

    this.data = {
      coordinates: { max: new Vec2D(Infinity, Infinity), min: new Vec2D(-Infinity, -Infinity) },
      children: [],
      height: 1,
      leaf: true,
    }
  }

  search(box: AABBox) {
    let node = this.data as BoxNode | undefined
    let result: AABBox[] = []

    if (!intersectAABB(node!.coordinates, box)) return result

    const nodesToSearch: BoxNode[] = []

    while (node) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i]

        if (intersectAABB(box, child.coordinates)) {
          if (node.leaf) {
            result.push(child.coordinates)
          } else if (containsAABB(box, child.coordinates)) {
            const children = this.all(child)
            result = result.concat(children)
          } else {
            nodesToSearch.push(child)
          }
        }
      }
      node = nodesToSearch.pop()
    }

    return result
  }

  public insert(item: AABBox, level: number, isNode?: boolean) {
    const box = item
    const insertPath = []

    // find the best node for accommodating the item, saving all nodes along the path too
    const node = this._chooseSubtree(bbox, this.data, level, insertPath)

    // put the item into the node
    node.children.push(item)
    extend(node, bbox)

    // split on node overflow; propagate upwards if necessary
    while (level >= 0) {
      if (insertPath[level].children.length > this._maxEntries) {
        this._split(insertPath, level)
        level--
      } else break
    }

    // adjust bboxes along the insertion path
    this._adjustParentBBoxes(bbox, insertPath, level)
  }

  private all(startNode: BoxNode) {
    let node = startNode as BoxNode | undefined
    const nodesToSearch: BoxNode[] = []
    const result: AABBox[] = []

    while (node) {
      if (node.leaf) {
        result.push(...node.children.map((n) => n.coordinates))
      } else {
        nodesToSearch.push(...node.children)
      }

      node = nodesToSearch.pop()
    }

    return result
  }
}
