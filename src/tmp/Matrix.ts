export namespace Matrix {
  export function mult(a: number[][], b: number[][]): number[][] {
    if (!Array.isArray(a) || !Array.isArray(b) || !a.length || !b.length) {
      throw new Error("arguments should be in 2-dimensional array format")
    }
    const x = a.length
    const z = a[0].length
    const y = b[0].length
    if (b.length !== z) {
      throw new Error("number of columns in the first matrix should be the same as the number of rows in the second")
    }
    const productRow = Array.apply(null, new Array(y)).map(Number.prototype.valueOf, 0)
    const product = new Array(x)
    for (let p = 0; p < x; p++) {
      product[p] = productRow.slice()
    }
    for (let i = 0; i < x; i++) {
      for (let j = 0; j < y; j++) {
        for (let k = 0; k < z; k++) {
          product[i][j] += a[i][k] * b[k][j]
        }
      }
    }
    return product
  }

  export function transpose(m: number[][]) {
    return m[0].map((x, i) => m.map((x) => x[i]))
  }

  export function scale(m: number[][], scalar: number) {
    return m.map((x) => x.map((v) => v * scalar))
  }

  export function add(a: number[][], b: number[][]) {
    return a.map((x, i) => x.map((v, j) => v + b[i][j]))
  }

  export function sub(a: number[][], b: number[][]) {
    return a.map((x, i) => x.map((v, j) => v - b[i][j]))
  }

  export function empty(row: number, col: number) {
    return Array.from({ length: row }).map(() => Array.from({ length: col }).map(() => 0))
  }
}
