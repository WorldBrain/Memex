import get from 'lodash/fp/get'

import manifest from '../extension/manifest.json'


function openOverview() {
    browser.tabs.create({
        url: '/overview.html',
    })
}

// Functions to call for commands declared in the manifest, via context menu or keyboard shortcut.
const commandActions = {
    openOverview,
}

// Checkbox settings to be shown in the context menu.
const settings = {
    'loggingEnabled': {title: 'Store every visited page'},
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
    const itemId = `command_${commandId}`
    updateOrCreateContextMenuItem(itemId, {
        title,
        contexts: ['browser_action'],
    })
}

// Show checkboxes in the context menu for each of the settings.
async function updateSettingsInContextMenu() {
    const settingValues = await browser.storage.local.get(...Object.keys(settings))
    for (let settingId in settings) {
        const itemId = `setting_${settingId}`
        const options = {
            ...settings[settingId],
            type: 'checkbox',
            checked: settingValues[settingId],
            contexts: ['browser_action'],
        }
        await updateOrCreateContextMenuItem(itemId, options)
    }
}
// Update the context menu values when storage was touched.
browser.storage.onChanged.addListener(updateSettingsInContextMenu)
updateSettingsInContextMenu()

// Listen to context menu actions.
browser.contextMenus.onClicked.addListener(async (info, tab) => {
    const [type, id] = info.menuItemId.split('_')
    if (type === 'command') {
        commandActions[id]()
    } else if (type === 'setting') {
        await browser.storage.local.set({[id]: info.checked})
    }
})

// Listen to keyboard shortcut commands.
browser.commands.onCommand.addListener(command => {
    commandActions[command]()
})

// Run scripts that set their own event listeners.
/* eslint-disable import/first */
import 'src/activity-logger/background'
import 'src/omnibar'
