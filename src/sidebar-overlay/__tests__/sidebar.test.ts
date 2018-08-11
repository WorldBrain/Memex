import puppeteer from 'puppeteer'
import * as testConstants from './constants'
import * as constants from '../constants'

// TODO: Find a way to import styles.
// import styles from 'src/overview/components/PageResultItem.css'

jest.setTimeout(100000)
jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000

describe('Memex overview test', async () => {
    let page
    let browser
    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: false,
            args: [
                `--disable-extensions-except=${testConstants.EXT_PATH}`,
                `--load-extension=${testConstants.EXT_PATH}`,
                '--user-agent=PuppeteerAgent',
            ],
        })
        page = await browser.newPage()
        await page.goto(
            'chrome-extension://' +
                testConstants.EXT_ID +
                '/options.html#/overview',
            {
                waitUntil: 'domcontentloaded',
            },
        )
    })

    test('Verify title of overview', async () => {
        const title = await page.title()
        expect(title).toBe('🔍 Results')
    })

    test('Check if inserted page entry exists', async () => {
        await page.reload(10000, {
            waitUntil: 'networkidle0',
        })
        await page.waitForSelector('#app a[draggable=true]')
        const listCount = await page.$$eval(
            '#app a[draggable=true]',
            items => items.length,
        )
        expect(listCount).toBe(1)
        expect(listCount).not.toBeNull()
    })

    test('Check if sidebar opens', async () => {
        page.waitForSelector('#app a[draggable=true]')
        const $commentButton = (await page.$$(
            '#app a[draggable=true] button',
        ))[1]
        $commentButton.click()
        const $menu = await page.waitForSelector('.bm-menu')
        expect($menu).toBeDefined()
        expect($menu).not.toBeNull()
    })

    test('Check if empty annotation message is present', async () => {
        const URL = 'https://worldbrain.helprace.com/i66-annotations-comments'
        const $emptyMessage = await page.waitForSelector(
            `.bm-menu a[href="${URL}"]`,
        )
        expect($emptyMessage).toBeDefined()
        expect($emptyMessage).not.toBeNull()
    })

    test('Check if commentbox is focussed', async () => {
        const isActive = await page.$eval('.bm-menu textarea', textarea => {
            return document.activeElement === textarea
        })
        expect(isActive).toBeTruthy()
    })

    test('Write a new comment and test rows', async () => {
        const getRows = async () => {
            const rows = await page.$eval('.bm-menu textarea', textarea => {
                return textarea.rows
            })
            return rows
        }
        const rowsBefore = await getRows()
        await page.type('.bm-menu textarea', 'Comment from puppeteer')
        const rowsAfter = await getRows()

        // Test the row size
        expect(rowsBefore).toBe(constants.DEFAULT_ROWS)
        expect(rowsAfter).toBe(constants.MAXED_ROWS)
    })

    const getBgColor = async () => {
        const color = await page.$eval(
            '#add_comment_btn',
            btn => getComputedStyle(btn).backgroundColor,
        )
        return color
    }

    test('Check saving comment behaviour', async () => {
        const bgColorBefore = await getBgColor()

        const saveButton = await page.$('.bm-menu button')
        saveButton.click()
        // Query fetches div having an id, which at the moment is just the annotation
        const savedComment = await page.waitForSelector(
            '#memex_sidebar_panel div[id]:not(#add_comment_btn):not(#tags_container)',
        )
        const text = await savedComment.$eval(
            'div:nth-child(3)',
            div => div.textContent,
        )

        expect(savedComment).toBeDefined()
        expect(text).toBe('Comment from puppeteer')

        // checks if comment box gets hidden
        const display = await page.$eval('.bm-menu textarea', commentbox => {
            const container = commentbox.parentElement
            return getComputedStyle(container).display
        })
        expect(display).toBe('none')

        const bgColorAfter = await getBgColor()
        expect(bgColorBefore).toBe(testConstants.grayColor)
        expect(bgColorAfter).toBe(testConstants.greenColor)
    })

    test('Check actions of Add Comment button', async () => {
        await page.click('#add_comment_btn')
        const bgColor = await page.$eval('#add_comment_btn', btn => {
            const styles = getComputedStyle(btn)
            return styles.backgroundColor
        })
        expect(bgColor).toBe(testConstants.grayColor)

        const isShown = await page.$eval('.bm-menu textarea', textarea => {
            const containerDisplay = getComputedStyle(textarea.parentElement)
                .display
            return containerDisplay === 'block'
        })
        expect(isShown).toBeTruthy()
    })

    test('Write comment with tags', async () => {
        await page.type('.bm-menu textarea', 'Writing a comment with tags')
        const tagsContainer = await page.$('.bm-menu #tags_container')
        const tagsHolder = await tagsContainer.$('div')
        expect(tagsHolder).toBeDefined()

        tagsHolder.click()

        const tagsDropdown = await page.waitForSelector(
            '#tags_container div form input',
        )
        expect(tagsDropdown).toBeDefined()

        // Add 3 tags
        await tagsDropdown.type('tag1')
        const addTag = await page.waitForSelector('#tags_container div div>div')
        addTag.click()
        await page.waitFor(300)
        await tagsDropdown.type('tag2')
        await page.waitFor(300)
        await tagsDropdown.press('Enter')
        await page.waitFor(300)
        await tagsDropdown.type('tag3')
        await page.waitFor(300)
        await tagsDropdown.press('Enter')
        // Check if tags have been updated in tagHolder
        await page.click('.bm-menu textarea')
        const tagHolderList = async () => {
            const length = await tagsContainer.$$eval(
                'div>span',
                list => list.length,
            )
            return length
        }
        // one for the '+' span
        expect(await tagHolderList()).toBe(4)
        await tagsContainer.click()
        // write more tags again
        await tagsDropdown.type('tag4')
        await page.waitFor(300)
        await tagsDropdown.press('Enter')
        // write more tags again
        await tagsDropdown.type('tag5')
        await page.waitFor(300)
        await tagsDropdown.press('Enter')

        await page.click('.bm-menu textarea')
        expect(await tagHolderList()).toBe(5)

        // Save comment
        await page.click('.bm-menu button')
        await page.waitFor(300)
        const savedComments = await page.$$(
            '#memex_sidebar_panel div[id]:not(#add_comment_btn):not(#tags_container)',
        )
        expect(savedComments.length).toBe(2)
    })

    afterAll(async () => {
        await browser.close()
    })
})
