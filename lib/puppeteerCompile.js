const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')
const { compress, decompress } = require('./utils')

module.exports = function (reporter, definition) {
  if (reporter.compilation) {
    const fileToPatch = path.join(require.resolve('puppeteer'), '..', 'lib', 'Launcher.js')
    const contentToPatch = fs.readFileSync(fileToPatch).toString()
    fs.writeFileSync(fileToPatch, contentToPatch.replace(
      `require(path.join(helper.projectRoot(), 'package.json')).puppeteer.chromium_revision;`,
      `"${require(path.join(require.resolve('puppeteer'), '..', 'package.json')).puppeteer.chromium_revision}"`))

    const chromePath = path.dirname(puppeteer.executablePath())
    const localesPath = path.join(chromePath, 'locales')

    if (fs.existsSync(localesPath)) {
      fs.readdirSync(localesPath).forEach((f) => {
        fs.unlinkSync(path.join(localesPath, f))
      })
    }

    if (fs.existsSync(path.join(chromePath, 'interactive_ui_tests.exe'))) {
      fs.unlinkSync(path.join(chromePath, 'interactive_ui_tests.exe'))
    }

    reporter.compilation.resourceInTemp('chrome.zip', path.join(reporter.options.tempDirectory, 'chrome.zip'))

    return compress(path.dirname(puppeteer.executablePath()), path.join(reporter.options.tempDirectory, 'chrome.zip'))
  }

  if (reporter.execution) {
    const zipPath = reporter.execution.resourceTempPath('chrome.zip')

    reporter.options.chrome = reporter.options.chrome || {}
    reporter.options.chrome.launchOptions = reporter.options.chrome.launchOptions || {}
    reporter.options.chrome.launchOptions.executablePath = path.join(
      path.dirname(zipPath),
      'chrome',
      process.platform === 'darwin' ? 'Chromium' : 'chrome'
    )

    if (fs.existsSync(reporter.options.chrome.launchOptions.executablePath)) {
      return
    }

    reporter.initializeListeners.add('chrome exe', () => decompress(zipPath))
  }
}
