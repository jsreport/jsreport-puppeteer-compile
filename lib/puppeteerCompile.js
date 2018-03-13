const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')
const { compress, decompress } = require('./utils')

module.exports = function (reporter, definition) {
  if (reporter.compilation) {
    const fileToPatch = path.join(require.resolve('puppeteer'), '..', 'lib', 'Downloader.js')
    const contentToPatch = fs.readFileSync(fileToPatch).toString()
    fs.writeFileSync(fileToPatch, contentToPatch.replace(
      `require(path.join(PROJECT_ROOT, 'package.json')).puppeteer.chromium_revision;`,
      `"${require(path.join(require.resolve('puppeteer'), '..', 'package.json')).puppeteer.chromium_revision}"`))

    const chromePath = path.dirname(puppeteer.executablePath())
    const localesPath = path.join(chromePath, 'locales')

    fs.readdirSync(localesPath).forEach((f) => {
      fs.unlinkSync(path.join(localesPath, f))
    })
    if (fs.existsSync(path.join(chromePath, 'interactive_ui_tests.exe'))) {
      fs.unlinkSync(path.join(chromePath, 'interactive_ui_tests.exe'))
    }

    reporter.compilation.resourceInTemp('chrome.zip', path.join(reporter.options.tempDirectory, 'chrome.zip'))

    return compress(path.dirname(puppeteer.executablePath()), path.join(reporter.options.tempDirectory, 'chrome.zip'))
  }

  if (reporter.execution) {
    const zipPath = reporter.execution.resourceTempPath('chrome.zip')

    if (reporter.options['chrome-pdf']) {
      reporter.options['chrome-pdf'].launchOptions = Object.assign({
        executablePath: path.join(path.dirname(zipPath), 'chrome', 'chrome')
      }, definition.options.launchOptions)
    }

    if (fs.existsSync(definition.options.launchOptions.executablePath)) {
      return
    }

    reporter.initializeListeners.add('chrome exe', () => decompress(zipPath))
  }
}
