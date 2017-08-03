import { getAttachmentAsDataUrl } from 'src/pouchdb'
import { remoteFunction } from 'src/util/webextensionRPC'
import { hrefForLocalPage } from 'src/local-page'


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
        const errorMessageContent = document.getElementById('errorMessageContent')
        const errorMessageDimmer = document.getElementById('errorMessageDimmer')
        errorMessageContent.innerText = `Error: ${err && err.message}`
        errorMessageDimmer.classList.add('active')
        return
    } finally {
        screenshotDimmer.classList.remove('active')
    }
    const imgData = await getAttachmentAsDataUrl({doc: page, attachmentId: 'screenshot'})
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
        url: '/overview.html',
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
