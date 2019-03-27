import { browser, Runtime, Commands, Storage } from 'webextension-polyfill-ts'

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
import { StorageManager } from 'src/search/types'
import { migrations } from './quick-and-dirty-migrations'

class BackgroundScript {
    private utils: typeof utils
    private notifsBackground: NotifsBackground
    private storageChangesMan: StorageChangesManager
    private storageManager: StorageManager
    private storageAPI: Storage.Static
    private runtimeAPI: Runtime.Static
    private commandsAPI: Commands.Static

    constructor({
        storageManager,
        notifsBackground,
        utilFns = utils,
        storageChangesMan = storageChangesManager,
        storageAPI = browser.storage,
        runtimeAPI = browser.runtime,
        commandsAPI = browser.commands,
    }: {
        storageManager: StorageManager
        notifsBackground: NotifsBackground
        utilFns?: typeof utils
        storageChangesMan?: StorageChangesManager
        storageAPI?: Storage.Static
        runtimeAPI?: Runtime.Static
        commandsAPI?: Commands.Static
    }) {
        this.storageManager = storageManager
        this.notifsBackground = notifsBackground
        this.utils = utilFns
        this.storageChangesMan = storageChangesMan
        this.storageAPI = storageAPI
        this.runtimeAPI = runtimeAPI
        this.commandsAPI = commandsAPI
    }

    get defaultUninstallURL() {
        return process.env.NODE_ENV === 'production'
            ? 'http://worldbrain.io/uninstall'
            : ''
    }

    /**
     * Set up custom commands defined in the manifest.
     * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/commands
     */
    private setupCommands() {
        this.commandsAPI.onCommand.addListener(command => {
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
        this.runtimeAPI.onInstalled.addListener(details => {
            switch (details.reason) {
                case 'install':
                    this.notifsBackground.deliverStaticNotifications()
                    return onInstall()
                case 'update':
                    this.notifsBackground.deliverStaticNotifications()
                    this.runQuickAndDirtyMigrations()
                    return onUpdate()
                default:
            }
        })
    }

    /**
     * Run all the quick and dirty migrations we have set up to run directly on Dexie.
     */
    private async runQuickAndDirtyMigrations() {
        for (const [storageKey, migration] of Object.entries(migrations)) {
            const storage = await this.storageAPI.local.get(storageKey)

            if (storage[storageKey]) {
                continue
            }

            await migration(this.storageManager.backend['dexieInstance'])
            await this.storageAPI.local.set({ [storageKey]: true })
        }
    }

    /**
     * Set up URL to open on extension uninstall.
     * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/setUninstallURL
     */
    private setupUninstallURL() {
        this.runtimeAPI.setUninstallURL(this.defaultUninstallURL)

        this.storageChangesMan.addListener('local', USER_ID, ({ newValue }) =>
            this.runtimeAPI.setUninstallURL(
                `${UNINSTALL_URL}?user=${newValue}`,
            ),
        )
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            openOverviewTab: this.utils.openOverviewURL,
            openOptionsTab: this.utils.openOptionsURL,
            openLearnMoreTab: this.utils.openLearnMoreURL,
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
