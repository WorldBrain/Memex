import * as webdriver from 'selenium-webdriver'
import { Options } from 'selenium-webdriver/chrome'
import 'chromedriver'
import expect from 'expect'
import * as mocha from 'mocha'

const BASE_PATH = process.env.PWD
const EXT_PATH_UNPACKED = BASE_PATH + '/extension'
const EXT_URL = 'chrome-extension://bchcdcdmibkfclblifbckgodmbbdjfff/'
const OVERVIEW_PATH = '/options.html#/overview'

describe('Selenium Demo Test Suite', function() {
    let driver: webdriver.ThenableWebDriver
    this.timeout(60000)

    mocha.before(function() {
        // initializing chrome driver
        const options = new Options()
        options.addArguments('--load-extension=' + EXT_PATH_UNPACKED)
        driver = new webdriver.Builder()
            .withCapabilities(webdriver.Capabilities.chrome())
            .setChromeOptions(options)
            .build()
        // maximizing chrome browser
        driver
            .manage()
            .window()
            .maximize()
    })

    mocha.after(function() {
        driver.quit()
    })

    async function getExtShadowRoot(): Promise<webdriver.WebElement> {
        const shadowHost = await driver.findElement(
            webdriver.By.id('memex-ribbon-sidebar-container'),
        )
        return driver.executeScript(
            'return arguments[0].shadowRoot',
            shadowHost,
        )
    }

    async function waitUntilShadowDomElementLocated(
        element,
    ): Promise<webdriver.WebElement> {
        const shadowRoot = await getExtShadowRoot()
        return driver.wait(async () => shadowRoot.findElement(element), 5000)
    }

    async function triggerRibbonShow(ribbonSidebar: webdriver.WebElement) {
        const selectorRibbonTrigger =
            'div > div > div.src-sidebar-overlay-ribbon-components-__ribbon--1eodv'

        const ribbonTrigger = await ribbonSidebar.findElement(
            webdriver.By.css(selectorRibbonTrigger),
        )

        await driver
            .actions({ bridge: true })
            .move({ x: 0, y: 0, origin: ribbonTrigger })
            .perform()
    }

    // todo: Give HTML elements in question an id so we can find them more robustly
    const selectorSidebarBookmarkButton =
        'div > div > div > div > div.src-sidebar-overlay-ribbon-components-__pageActions--HxmKI > div:nth-child(1) > div'
    const selectorPageResultsUl =
        '#app > div:nth-child(1) > div.src-overview-results-components-__main--dzcJi > ul'
    const selectorFirstPageTitle = `${selectorPageResultsUl} > li:nth-child(1) > div > a > div > div > div > div:nth-child(2)`

    it('should bookmark a page from the ribbon, and that bookmark be present in search results for bookmarks', async function() {
        const url = EXT_URL + OVERVIEW_PATH
        await driver.get(url)
        const currentUrl = await driver.getCurrentUrl()
        expect(currentUrl).toContain(url)

        // The new installation tab often pops up and steals focus
        // Make sure focus is set to the tab we set
        await driver.switchTo().window((await driver.getAllWindowHandles())[0])

        // Navigate to a new page
        await driver.get('https://en.wikipedia.org/wiki/Memex')

        // Open the sidebar
        // todo: this relies on the 'r' key, need a more programmatic way of opening the sidebar here
        const page = await driver.findElement(webdriver.By.css('body'))
        await page.sendKeys('r')

        // Click on the bookmark button
        const ribbonSidebar = await waitUntilShadowDomElementLocated(
            webdriver.By.id('memex-ribbon-sidebar'),
        )

        await triggerRibbonShow(ribbonSidebar)

        await driver.sleep(1000) // TODO: Why does this need to be here? (following selector fails if removed)

        const button = await ribbonSidebar.findElement(
            webdriver.By.css(selectorSidebarBookmarkButton),
        )

        await button.click()
        await driver.sleep(500)

        // Do a bookmarks filtered page search
        const bookmarksUrl = url + '?showOnlyBookmarks=true'
        await driver.get(bookmarksUrl)
        await driver.sleep(500)

        // Test that there should be only one bookmarked page
        const pageResults = await driver.wait(
            webdriver.until.elementsLocated(
                webdriver.By.css(selectorPageResultsUl + '> li'),
            ),
            5000,
        )

        expect(pageResults).toHaveLength(1)

        // Test that the result should be the bookmarked page
        const pageTitle = await driver.wait(
            webdriver.until.elementLocated(
                webdriver.By.css(selectorFirstPageTitle),
            ),
            2000,
        )
        const titleText = await pageTitle.getText()

        expect(titleText).toEqual('Memex - Wikipedia')
    })
})
