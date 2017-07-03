import get from 'lodash/fp/get'

import manifest from '../extension/manifest.json'


function openOverview() {
    browser.tabs.create({
        url: '/overview/overview.html',
    })
}

// Functions to call for commands declared in the manifest.
const commandActions = {
    openOverview,
}

const commands = manifest.commands

async function updateOrCreateContextMenuItem(id, options) {
    try {
        await browser.contextMenus.update(id, options)
    } catch (err) {
        await browser.contextMenus.create({id, ...options})
    }
}

// Add all commands to the browser action button's context menu
for (let commandId in commands) {
    const options = commands[commandId]
    // Ignore _execute_browser_action, etcetera.
    if (commandId.startsWith('_')) continue

    // XXX This always shows the default key, no OS-specific variants nor user's settings.
    const shortcutKey = get('suggested_key.default')(options)
    const shortcutInfo = shortcutKey ? ` (${shortcutKey})` : ''
    const title = options.description + shortcutInfo
    updateOrCreateContextMenuItem(commandId, {
        title,
        contexts: ['browser_action'],
    })
}

// Listen to context menu actions.
browser.contextMenus.onClicked.addListener((info, tab) => {
    const commandId = info.menuItemId
    commandActions[commandId]()
})

// Listen to keyboard shortcut commands.
browser.commands.onCommand.addListener(command => {
    commandActions[command]()
})

// Run scripts that set their own event listeners.
/* eslint-disable import/first */
import 'src/activity-logger/background'
import 'src/omnibar'
