import { spawn } from "child_process"
import * as fse from "fs-extra"
import * as path from "path"

if (fse.existsSync(path.join(__dirname, "../publish"))) {
  fse.removeSync("publish")
}

const tsc = spawn(path.join(__dirname, "../node_modules/.bin/tsc"), ["-p", "tsconfig.build.json"])

tsc.stdout.on("data", (d) => console.log(`${d}`))
tsc.stderr.on("data", (d) => console.error(`${d}`))
tsc.on("error", console.error)

tsc.on("close", (code) => {
  if (code === 0) {
    fse.moveSync(path.join(__dirname, "../out/"), path.join(__dirname, "../publish/"))

    const files = ["package-lock.json", "package.json", "README.md"]
    for (const file of files) {
      fse.copyFileSync(path.join(__dirname, `../${file}`), path.join(__dirname, `../publish/${file}`))
    }
  }
})
