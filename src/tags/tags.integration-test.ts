import * as webdriver from 'selenium-webdriver'
import expect from 'expect'
import * as mocha from 'mocha'

import {
    setupChromeDriverWithExtension,
    setupTest,
} from 'src/tests/selenium/setup'
import {
    locateShadowDomElement,
    triggerRibbonShow,
} from 'src/tests/selenium/helpers'
import { EXT_OVERVIEW_URL } from 'src/tests/selenium/constants'
import * as overviewSelectors from 'src/tests/selenium/selectors/overview'
import * as sidebarSelectors from 'src/tests/selenium/selectors/sidebar'

describe('Selenium Demo Test Suite', function() {
    let driver: webdriver.WebDriver
    this.timeout(60000)

    mocha.before(function() {
        driver = setupChromeDriverWithExtension({ maximizeWindow: true })
    })

    mocha.after(function() {
        driver.quit()
    })

    it('should add a note to a page from the ribbon, and that note be present in search results for notes', async function() {
        await setupTest({ driver })
        const TEST_NOTE = 'this is a test'

        // Navigate to a new page
        await driver.get('https://en.wikipedia.org/wiki/Memex')

        const ribbonSidebar = await locateShadowDomElement({
            elementLocator: webdriver.By.id('memex-ribbon-sidebar'),
            driver,
        })

        await triggerRibbonShow({ driver, ribbonSidebar })

        // Click on the add note button
        const addNoteBtn = await ribbonSidebar.findElement(
            webdriver.By.css(
                sidebarSelectors.ribbonPageActionBtn({ btnIndex: 1 }),
            ),
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
            webdriver.By.css(
                sidebarSelectors.ribbonGeneralActionBtn({ btnIndex: 1 }),
            ),
        )
        await toggleSidebarBtn.click()
        await driver.sleep(500)

        // Test that there should only be a single note result
        const noteResults = await ribbonSidebar.findElements(
            webdriver.By.css(
                sidebarSelectors.sidebarSearchResults() + ' > div',
            ),
        )
        expect(noteResults).toHaveLength(1)

        // Test that the result contains the same text as entered
        const noteResultTitle = await ribbonSidebar.findElement(
            webdriver.By.css(
                sidebarSelectors.sidebarSearchResults() + ' > div > div',
            ),
        )
        expect(await noteResultTitle.getText()).toEqual(TEST_NOTE)
    })

    it('should bookmark a page from the ribbon, and that bookmark be present in search results for bookmarks', async function() {
        await setupTest({ driver })

        // Navigate to a new page
        await driver.get('https://en.wikipedia.org/wiki/Memex')

        const ribbonSidebar = await locateShadowDomElement({
            elementLocator: webdriver.By.id('memex-ribbon-sidebar'),
            driver,
        })

        await triggerRibbonShow({ driver, ribbonSidebar })

        // Click on the bookmark button
        const bookmarkBtn = await ribbonSidebar.findElement(
            webdriver.By.css(
                sidebarSelectors.ribbonPageActionBtn({ btnIndex: 0 }),
            ),
        )

        await bookmarkBtn.click()
        await driver.sleep(500)

        // Do a bookmarks filtered page search
        const bookmarksUrl = EXT_OVERVIEW_URL + '?showOnlyBookmarks=true'
        await driver.get(bookmarksUrl)
        await driver.sleep(500)

        // Test that there should be only one bookmarked page
        const pageResults = await driver.wait(
            webdriver.until.elementsLocated(
                webdriver.By.css(
                    overviewSelectors.searchResultsList() + ' > li',
                ),
            ),
            5000,
        )

        expect(pageResults).toHaveLength(1)

        // Test that the result should be the bookmarked page
        const pageTitle = await driver.wait(
            webdriver.until.elementLocated(
                webdriver.By.css(
                    overviewSelectors.pageResultTitle({ resultIndex: 0 }),
                ),
            ),
            2000,
        )
        const titleText = await pageTitle.getText()

        expect(titleText).toEqual('Memex - Wikipedia')
    })
})
