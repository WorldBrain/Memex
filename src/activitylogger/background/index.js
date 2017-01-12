import { logPageVisit } from './log-page-visit'

browser.runtime.onMessage.addListener((message, sender) => {
    if (message.type === 'logPageVisit') {
        return logPageVisit({
            data: message.data,
            tab: sender.tab
        }).then(
            () => ({status: "success"})
        ).catch(
            err => ({status: `failed: ${err}`})
        )
    }
})
