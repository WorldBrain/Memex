import 'src/activity-logger/background'
import 'src/omnibar'


function openOverview() {
    browser.tabs.create({
        url: '/overview/overview.html',
    })
}

browser.commands.onCommand.addListener(command => {
    if (command === 'openOverview') {
        openOverview()
    }
})
