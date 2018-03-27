const archiver = require('archiver')
const extract = require('extract-zip')
const fs = require('fs')
const path = require('path')

module.exports.compress = (dir, out) => {
  const ws = fs.createWriteStream(out)

  return new Promise((resolve, reject) => {
    const archive = archiver('zip')
    archive.on('error', reject)
    archive.on('end', resolve)
    archive.pipe(ws)
    archive.directory(dir, false)
    archive.finalize()
  })
}

module.exports.decompress = (zipPath) => {
  const chromePath = path.join(path.dirname(zipPath), 'chrome')

  if (!fs.existsSync(chromePath)) {
    fs.mkdirSync(chromePath)
  }

  return new Promise((resolve, reject) => {
    extract(zipPath, { dir: chromePath, defaultFileMode: 0o777 }, (err) => {
      if (err) {
        return reject(err)
      }

      resolve()
    })
  })
}
