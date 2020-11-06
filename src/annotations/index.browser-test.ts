import * as webdriver from 'selenium-webdriver'
import expect from 'expect'

import { makeTestFactory } from 'src/tests/selenium/setup'
import {
    locateShadowDomElement,
    triggerRibbonShow,
} from 'src/tests/selenium/helpers'
import * as sidebarSelectors from 'src/tests/selenium/selectors/sidebar'

describe('Annotation browser tests', function () {
    this.timeout(60000) // Needed to bypass 2s mocha timeuot

    const it = makeTestFactory()

    it('should add a note to a page from the ribbon, and that note be present in search results for notes', async function ({
        driver,
    }) {
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
})
