import { browser } from 'webextension-polyfill-ts'

import * as utils from './utils'
import { UNINSTALL_URL } from './constants'
import NotifsBackground from '../notifications/background'
import { onInstall, onUpdate } from './on-install-hooks'
import { makeRemotelyCallable } from '../util/webextensionRPC'
import { USER_ID } from '../util/generate-token'
import {
    storageChangesManager,
    StorageChangesManager,
} from '../util/storage-changes'

class BackgroundScript {
    private utils: typeof utils
    private notifsBackground: NotifsBackground
    private storageChangesMan: StorageChangesManager

    constructor({
        notifsBackground,
        utilFns = utils,
        storageChangesMan = storageChangesManager,
    }: {
        notifsBackground: NotifsBackground
        utilFns?: typeof utils
        storageChangesMan?: StorageChangesManager
    }) {
        this.notifsBackground = notifsBackground
        this.utils = utilFns
        this.storageChangesMan = storageChangesMan
    }

    /**
     * Set up custom commands defined in the manifest.
     * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/commands
     */
    private setupCommands() {
        browser.commands.onCommand.addListener(command => {
            switch (command) {
                case 'openOverview':
                    return this.utils.openOverview()
                default:
            }
        })
    }

    /**
     * Set up logic that will get run on ext install, update, browser update.
     * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onInstalled
     */
    private setupInstallHooks() {
        browser.runtime.onInstalled.addListener(details => {
            switch (details.reason) {
                case 'install':
                    this.notifsBackground.deliverStaticNotifications()
                    return onInstall()
                case 'update':
                    this.notifsBackground.deliverStaticNotifications()
                    return onUpdate()
                default:
            }
        })
    }

    /**
     * Set up URL to open on extension uninstall.
     * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/setUninstallURL
     */
    private setupUninstallURL() {
        this.storageChangesMan.addListener('local', USER_ID, ({ newValue }) =>
            browser.runtime.setUninstallURL(
                `${UNINSTALL_URL}?user=${newValue}`,
            ),
        )
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            openOverviewTab: this.utils.openOverviewURL,
            openOptionsTab: this.utils.openOptionsURL,
        })
    }

    setupWebExtAPIHandlers() {
        this.setupInstallHooks()
        this.setupCommands()
        this.setupUninstallURL()
    }
}

export { utils }
export default BackgroundScript
