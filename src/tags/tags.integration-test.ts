import * as fs from 'fs'
import * as webdriver from 'selenium-webdriver'
import { Options } from 'selenium-webdriver/chrome'
import * as expect from 'expect'
import * as mocha from 'mocha'

const basePath = process.env.PWD
const unpackedExtensionPath = `${basePath}/extension`
const extUrl = 'chrome-extension://pocnpohonndlmnkogjbmjamponfhmoko/'

describe('Selenium Demo Test Suite', function() {
    let driver: webdriver.ThenableWebDriver
    this.timeout(60000)

    mocha.before(function() {
        // initializing chrome driver
        const options = new Options()
        options.addArguments('--load-extension=' + unpackedExtensionPath)
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

    afterEach(function() {
        let testCaseName: string = this.currentTest.title
        let testCaseStatus: string = this.currentTest.state
        if (testCaseStatus === 'failed') {
            console.log(`Test: ${testCaseName}, Status: Failed!`)
            // Might be useful to capture a screenshot if test fails:
            /*
            driver.takeScreenshot().then((data) => {
                let screenshotPath = `TestResults/Screenshots/${testCaseName}.png`;
                console.log(`Saving Screenshot as: ${screenshotPath}`);
                fs.writeFileSync(screenshotPath, data, 'base64');
            });*/
        } else if (testCaseStatus === 'passed') {
            console.log(`Test: ${testCaseName}, Status: Passed!`)
        } else {
            console.log(`Test: ${testCaseName}, Status: Unknown!`)
        }
    })

    mocha.after(function() {
        driver.quit()
    })

    async function getExtShadowRoot() {
        let shadowHost
        shadowHost = await driver.findElement(
            webdriver.By.id('memex-ribbon-sidebar-container'),
        )
        return driver.executeScript(
            'return arguments[0].shadowRoot',
            shadowHost,
        )
    }

    async function waitUntilShadowDomElementLocated(element) {
        let shadowRoot
        shadowRoot = await getExtShadowRoot()
        const result = await shadowRoot
        return await driver.wait(async () => result.findElement(element), 5000)
    }

    // todo: Give HTML elements in question an id so we can find them more robustly
    const selectorSidebarBookmarkButton =
        'div > div:nth-child(1) > div > div.src-sidebar-overlay-ribbon-components-__pageActions--HxmKI > div.src-common-ui-components-__tooltipContainer--1AXOQ > button'
    const selectorBookmarksUl =
        '#app > div:nth-child(1) > div.src-overview-results-components-__main--dzcJi > ul'
    const selectorFirstBookmark = `${selectorBookmarksUl} > li:nth-child(1) > div > a > div:nth-child(2) > div > div > span`

    it('should bookmark a page from the ribbon, and that bookmark be present in search results for bookmarks', async function() {
        const url = extUrl + '/options.html#/overview'
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
        await driver.sleep(1000)
        const button = await ribbonSidebar.findElement(
            webdriver.By.css(selectorSidebarBookmarkButton),
        )

        await button.click()
        await driver.sleep(500)

        // Visit the bookmarks page
        const bookmarksUrl =
            extUrl + 'options.html#/overview?showOnlyBookmarks=true'
        await driver.get(bookmarksUrl)
        await driver.sleep(500)

        // Test that there should be only one bookmarked page
        const bookmarks = await driver.wait(
            webdriver.until.elementsLocated(
                webdriver.By.css(selectorBookmarksUl + '> li'),
            ),
            5000,
        )

        expect(bookmarks).toHaveLength(1)

        // Test that the result should be the bookmarked page
        const bookmark = await driver.wait(
            webdriver.until.elementLocated(
                webdriver.By.css(selectorFirstBookmark),
            ),
            2000,
        )
        const titleText = await bookmark.getText()

        expect(titleText).toEqual('Memex - Wikipedia')
    })
})
