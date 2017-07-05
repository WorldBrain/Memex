import { getAttachmentAsDataUri } from 'src/pouchdb'
import { remoteFunction } from 'src/util/webextensionRPC'
import { hrefForLocalPage } from 'src/page-viewer'


const logActivePageVisit = remoteFunction('logActivePageVisit')

const screenshotImg = document.getElementById('screenshotImg')
const screenshotLink = document.getElementById('screenshotLink')
const screenshotDimmer = document.getElementById('screenshotDimmer')

async function storeThisPage() {
    screenshotDimmer.classList.add('active')
    let page
    try {
        const { page: page_ } = await logActivePageVisit()
        page = page_
    } catch (err) {
        // TODO Make clear to the user that storing the page failed.
        console.error(err)
        return
    } finally {
        screenshotDimmer.classList.remove('active')
    }
    const imgData = await getAttachmentAsDataUri({doc: page, attachmentId: 'screenshot'})
    screenshotImg.src = imgData
    const href = hrefForLocalPage({page})
    if (href) {
        screenshotLink.setAttribute('href', href)
    }
}
// Store this page directly.
storeThisPage()

const overviewButton = document.getElementById('overviewButton')
overviewButton.onclick = async () => {
    await browser.tabs.create({
        url: '/overview/overview.html',
    })
    window.close()
}

const loggingEnabledCheckbox = document.getElementById('loggingEnabled')
// Load initial checkbox value from storage
// (note that we do not keep this value in sync bidirectionally; should be okay for a popup).
;(async () => {
    const { loggingEnabled } = await browser.storage.local.get('loggingEnabled')
    loggingEnabledCheckbox.checked = loggingEnabled
})()
// Update the storage when loggingEnabledCheckbox value changes.
loggingEnabledCheckbox.onchange = async () => {
    browser.storage.local.set({loggingEnabled: loggingEnabledCheckbox.checked})
}
