const util = require('util')
const fs = require('fs')
const path = require('path')
const shortid = require('shortid')
const archiver = require('archiver')
const extract = require('extract-zip')
const renameAsync = util.promisify(fs.rename)

module.exports.compress = async (dir, out) => {
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

module.exports.decompress = async (zipPath) => {
  const chromePath = path.join(path.dirname(zipPath), 'chrome')

  if (!fs.existsSync(chromePath)) {
    fs.mkdirSync(chromePath)
  }

  // we will write everything to a extract temp directory first
  // to ensure that parallel execution of the exe works
  const extractTmpPath = path.join(path.dirname(chromePath), `~chrome-${shortid()}`)

  if (fs.existsSync(extractTmpPath)) {
    throw new Error(`Temporary extract directory "${extractTmpPath}" exists`)
  }

  await new Promise((resolve, reject) => {
    extract(zipPath, { dir: chromePath, defaultFileMode: 0o777 }, (err) => {
      if (err) {
        return reject(err)
      }

      resolve()
    })
  })

  // when everything is saved into the extract temp directory we check the original directory
  // if it is empty then we rename the extract temp directory to the path
  await checkAndHandleRename(extractTmpPath, chromePath)
}

async function checkAndHandleRename (sourcePath, targetPath, tryCount = 0) {
  const maxRetries = 10

  if (fs.existsSync(targetPath)) {
    return
  }

  try {
    await renameAsync(sourcePath, targetPath)
  } catch (e) {
    if (tryCount < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      await checkAndHandleRename(sourcePath, targetPath, tryCount + 1)
    } else {
      throw e
    }
  }
}
