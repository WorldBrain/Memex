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
    const selectorSidebarResultsContainer =
        'div > div:nth-child(2) > div.bm-menu-wrap > div.bm-menu > nav > div > div.src-sidebar-overlay-sidebar-components-__resultsContainer--3Z_17 > div'
    const selectorRibbonGeneralActions =
        'div > div > div > div > div.src-sidebar-overlay-ribbon-components-__generalActions--1YrZ4'
    const selectorToggleSidebarBtn = `${selectorRibbonGeneralActions} > div:nth-child(2) > div`
    const selectorRibbonPageActions =
        'div > div > div > div > div.src-sidebar-overlay-ribbon-components-__pageActions--HxmKI'
    const selectorRibbonBookmarkBtn = `${selectorRibbonPageActions} > div:nth-child(1) > div`
    const selectorRibbonAddNotetn = `${selectorRibbonPageActions} > div:nth-child(2) > div`
    const selectorPageResultsUl =
        '#app > div:nth-child(1) > div.src-overview-results-components-__main--dzcJi > ul'
    const selectorFirstPageTitle = `${selectorPageResultsUl} > li:nth-child(1) > div > a > div > div > div > div:nth-child(2)`

    it('should add a note to a page from the ribbon, and that note be present in search results for notes', async function() {
        const TEST_NOTE = 'this is a test'
        const url = EXT_URL + OVERVIEW_PATH
        await driver.get(url)
        const currentUrl = await driver.getCurrentUrl()
        expect(currentUrl).toContain(url)

        // The new installation tab often pops up and steals focus
        // Make sure focus is set to the tab we set
        await driver.switchTo().window((await driver.getAllWindowHandles())[0])

        // Navigate to a new page
        await driver.get('https://en.wikipedia.org/wiki/Memex')

        const ribbonSidebar = await waitUntilShadowDomElementLocated(
            webdriver.By.id('memex-ribbon-sidebar'),
        )

        await triggerRibbonShow(ribbonSidebar)

        await driver.sleep(1000)

        // Click on the add note button
        const addNoteBtn = await ribbonSidebar.findElement(
            webdriver.By.css(selectorRibbonAddNotetn),
        )
        await addNoteBtn.click()

        // Write note text and save via keyboard
        const noteInput = driver.switchTo().activeElement()
        noteInput.sendKeys(
            TEST_NOTE,
            webdriver.Key.COMMAND,
            webdriver.Key.ENTER,
        )

        // Open the sidebar
        const toggleSidebarBtn = await ribbonSidebar.findElement(
            webdriver.By.css(selectorToggleSidebarBtn),
        )
        await toggleSidebarBtn.click()
        await driver.sleep(500)

        // Test that there should only be a single note result
        const noteResults = await ribbonSidebar.findElements(
            webdriver.By.css(selectorSidebarResultsContainer + ' > div'),
        )
        expect(noteResults).toHaveLength(1)

        // Test that the result contains the same text as entered
        const noteResultTitle = await ribbonSidebar.findElement(
            webdriver.By.css(selectorSidebarResultsContainer + ' > div > div'),
        )
        expect(await noteResultTitle.getText()).toEqual(TEST_NOTE)
    })

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

        const ribbonSidebar = await waitUntilShadowDomElementLocated(
            webdriver.By.id('memex-ribbon-sidebar'),
        )

        await triggerRibbonShow(ribbonSidebar)

        await driver.sleep(1000) // TODO: Why does this need to be here? (following selector fails if removed)

        // Click on the bookmark button
        const bookmarkBtn = await ribbonSidebar.findElement(
            webdriver.By.css(selectorRibbonBookmarkBtn),
        )

        await bookmarkBtn.click()
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
