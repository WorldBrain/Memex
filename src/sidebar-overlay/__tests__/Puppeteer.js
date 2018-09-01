import puppeteer from 'puppeteer'
import * as constants from './constants'

let browser = null
let page = null

const initBrowser = async () => {
    if (!browser) {
        browser = await puppeteer.launch({
            headless: false,
            args: [
                `--disable-extensions-except=${constants.EXT_PATH}`,
                `--load-extension=${constants.EXT_PATH}`,
                '--user-agent=PuppeteerAgent',
            ],
        })
    }
}

export const getMemexPage = async () => {
    if (page) {
        return page
    }
    if (!browser) {
        await initBrowser()
    }

    page = await browser.newPage()
    await page.goto(
        'chrome-extension://' + constants.EXT_ID + '/options.html#/overview',
        {
            waitUntil: 'domcontentloaded',
        },
    )
    return page
}

export const killBrowser = async () => {
    await browser.close()
}
