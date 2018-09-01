import { getMemexPage, killBrowser } from './Puppeteer'
import { getClassName } from './utils'

jest.setTimeout(100000)
jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000

describe('Memex Sidebar Test Suite', async () => {
    let page
    const cx = classname => getClassName('Annotation', classname)
    const annotationContainerClass = cx('container')

    const getTextContent = async classname => {
        const text = await page.$eval(cx(classname), div => div.textContent)
        return text
    }

    beforeAll(async () => {
        page = await getMemexPage()
        await page.waitFor(2000)
        const navPromise = page.waitForNavigation()
        await page.reload(10000, { waitUntil: 'domcontentloaded' })
        await navPromise
        await page.waitForSelector('#app a[draggable=true]')
        const $commentButton = (await page.$$(
            '#app a[draggable=true] button',
        ))[1]
        $commentButton.click()
        await page.waitForSelector('.bm-menu textarea')
    })

    test('check for empty annotations', async () => {
        const annotations = await page.$$(annotationContainerClass)
        expect(annotations.length).toBe(0)
    })

    const comment = 'Testing annotation container'
    test('check for added  annotations', async () => {
        await page.type('.bm-menu textarea', comment)
        await page.click('.bm-menu button')
        await page.waitFor(1000)

        const annotations = await page.$$(annotationContainerClass)
        expect(annotations.length).toBe(1)

        const text = await getTextContent('annotationText')
        expect(text).toEqual(comment)
    })

    test('Edit button actions', async () => {
        await page.click(cx('editIcon'))

        const textarea = await page.$(cx('annotationTextarea'))
        const tagsInput = await page.$(getClassName('TagHolder', 'tagHolder'))
        const saveBtn = await page.$(cx('footerBoldText'))
        const cancelBtn = await page.$(cx('footerText'))

        expect(textarea).toBeDefined()
        expect(tagsInput).toBeDefined()
        expect(saveBtn).toBeDefined()
        expect(cancelBtn).toBeDefined()

        const text = await getTextContent('annotationTextarea')
        expect(text).toEqual(comment)
    })

    const editText = ' edited'

    test('test edit save behavior', async () => {
        expect(await page.$(cx('lastEdit'))).toBeNull()

        await page.type(cx('annotationTextarea'), editText)
        await page.click(cx('footerBoldText'))
        await page.waitFor(1000)

        const text = await getTextContent('annotationText')
        expect(text).toEqual(comment + editText)
        expect(await page.$(cx('lastEdit'))).toBeDefined()
    })

    test('test edit cancel behavior', async () => {
        await page.click(cx('editIcon'))
        await page.waitFor(500)
        expect(await page.$(cx('annotationTextarea'))).toBeDefined()
        await page.type(cx('annotationTextarea'), ' more random text')

        await page.click(cx('footerText'))
        await page.waitFor(500)
        expect(await page.$(cx('annotationTextarea'))).toBeNull()
        const text = await getTextContent('annotationText')
        expect(text).toEqual(comment + editText)
    })

    test('test delete button behavior', async () => {
        await page.click(cx('trashIcon'))
        expect(await page.$(cx('deleteReally'))).toBeDefined()

        await page.click(cx('footerText'))
        await page.waitFor(500)
        const delBtn = await page.$(cx('trashIcon'))
        expect(delBtn).toBeDefined()
        delBtn.click()
        await page.waitFor(500)
        // Delete the annotation
        await page.click(cx('footerBoldText'))
        await page.waitFor(500)

        const annotations = await page.$$(annotationContainerClass)
        expect(annotations.length).toBe(0)
    })

    afterAll(async () => {
        await killBrowser()
    })
})

// TODO: Add tests for TagHolder
// Since it's an independent component, it's not added here
