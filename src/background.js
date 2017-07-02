import { logActivePageVisit } from 'src/activity-logger/background/log-page-visit'


function openOverview() {
    browser.tabs.create({
        url: '/overview/overview.html',
    })
}

// Listen to keyboard shortcut commands declared in the manifest.
browser.commands.onCommand.addListener(command => {
    if (command === 'openOverview') {
        openOverview()
    }
    if (command === 'storeActivePage') {
        logActivePageVisit()
    }
})

// Run scripts that set their own event listeners.
import 'src/activity-logger/background'
import 'src/omnibar'
