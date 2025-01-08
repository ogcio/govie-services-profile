import puppeteer from 'puppeteer';
import { runLighthouseForURL } from './runLighthouse.mjs';
import { runA11yForURL } from './runA11y.mjs';
import { loginSpecificUser } from './login.mjs'
import * as chromeLauncher from 'chrome-launcher';
import  util from 'util'
import request from 'request'

const environment = process.env.environment || 'https://profile.dev.blocks.gov.ie';

async function main () {

const loginURL = environment
const profileLandingPage = loginURL + '/en'

const opts = {
  output: 'json',
  disableDeviceEmulation: true,
  defaultViewport: {
    width: 1200,
    height: 900
  },
  //chromeFlags: ['--disable-mobile-emulation'],
  chromeFlags: ['--headless', '--disable-mobile-emulation'],
}

  // Launch chrome using chrome-launcher
  console.log(chromeLauncher.getChromePath())
  const chrome = await chromeLauncher.launch(opts)
  opts.port = chrome.port

  // Connect to it using puppeteer.connect().
  const resp = await util.promisify(request)(`http://localhost:${opts.port}/json/version`)
  const { webSocketDebuggerUrl } = JSON.parse(resp.body)
  const browser = await puppeteer.connect({ browserWSEndpoint: webSocketDebuggerUrl })

  // Puppeteer
  const page = (await browser.pages())[0]
  await page.setViewport({ width: 1200, height: 900 })

  // A11y Run
  
  await loginSpecificUser(loginURL, 'Peter Parker', page, true)

  // Run A11y.
  await runA11yForURL(browser, profileLandingPage, opts, 'profile-landing-page')

  // logout
  /*await page.evaluate(() => {
    document.querySelector('body > header > div > div.Header_headerRightContainer__Dt9aV > a > span').click()
  })

  await page.waitForNavigation()*/

  // Lighthouse Run

  await loginSpecificUser(loginURL, 'Peter Parker', page, true)

  // Run Lighthouse.
  await runLighthouseForURL(profileLandingPage, opts, 'profile-landing-page').then(results => {
    return results
  })

  // logout
  /*await page.evaluate(() => {
    document.querySelector('body > header > div > div.Header_headerRightContainer__Dt9aV > a > span').click()
  })

  await page.waitForNavigation()*/

  // Close Browser
  
  await browser.disconnect()
  await chrome.kill()

}

await main ()