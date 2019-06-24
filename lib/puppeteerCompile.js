const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')
const { compress, decompress } = require('./utils')

module.exports = async function (reporter, definition) {
  if (reporter.compilation2) {
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

    const pathToChromeZip = path.join(reporter.options.tempDirectory, 'chrome.zip')

    let chromeDirectory

    if (process.platform === 'darwin') {
      chromeDirectory = path.join(path.dirname(puppeteer.executablePath()), '../../../')
    } else {
      chromeDirectory = path.dirname(puppeteer.executablePath())
    }

    await compress(chromeDirectory, pathToChromeZip)

    reporter.compilation2.resourceInTemp('chrome.zip', pathToChromeZip)
  }

  if (reporter.execution2) {
    const zipPath = reporter.execution2.resourceTempPath('chrome.zip')

    reporter.options.chrome = reporter.options.chrome || {}
    reporter.options.chrome.launchOptions = reporter.options.chrome.launchOptions || {}

    reporter.options.chrome.launchOptions.executablePath = path.join(
      path.dirname(zipPath),
      'chrome',
      process.platform === 'darwin' ? 'Chromium.app/Contents/MacOS/Chromium' : 'chrome'
    )

    if (fs.existsSync(reporter.options.chrome.launchOptions.executablePath)) {
      return
    }

    reporter.initializeListeners.add('chrome exe', () => decompress(zipPath))
  }
}
