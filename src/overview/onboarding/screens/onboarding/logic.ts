import {
    UILogic,
    loadInitial,
    executeUITask,
    UIEventHandler,
} from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import type { Dependencies, State, Event } from './types'
import delay from 'src/util/delay'
import { browser } from 'webextension-polyfill-ts'

type EventHandler<EventName extends keyof Event> = UIEventHandler<
    State,
    Event,
    EventName
>

export default class Logic extends UILogic<State, Event> {
    syncPromise: Promise<any>
    isExistingUser = false
    action?: 'login' | 'register'
    hasLinkToOpen = false
    hasAccountSynced = false

    constructor(private dependencies: Dependencies) {
        super()
    }

    getInitialState = (): State => ({
        step: 'tutorial',
        loadState: 'running',
        syncState: 'pristine',
        shouldShowLogin: true,
        newSignUp: false,
        mode: 'signup',
        email: '',
        password: '',
        displayName: '',
        passwordMatch: false,
        passwordConfirm: '',
        preventOnboardingFlow: false,
        autoLoginState: 'pristine',
    })

    async init() {
        const { authBG } = this.dependencies
        this.emitMutation({
            mode: { $set: 'signup' },
            loadState: { $set: 'running' },
        })

        if (await this.checkIfMemexSocialTabOpen()) {
            this.emitMutation({
                autoLoginState: { $set: 'running' },
            })
            await this.autoLoginAvailable()

            if (this.hasAccountSynced) {
                await this.checkIfAutoOpenLinkAvailable()
                await this._onUserLogIn(false)
            } else {
                this.emitMutation({
                    loadState: { $set: 'pristine' },
                    autoLoginState: { $set: 'pristine' },
                })
            }
        } else {
            await loadInitial(this, async () => {
                const user = await authBG.getCurrentUser()
                if (user != null) {
                    this.isExistingUser = true
                    await this._onUserLogIn(false)
                }
            })
        }
    }

    private autoLoginAvailable = async () => {
        let user = undefined
        let retries = 0
        let maxRetries = 30
        while (user == null && retries !== maxRetries + 1) {
            user = await this.dependencies.authBG.getCurrentUser()

            if (user != null) {
                this.hasAccountSynced = true
                this.isExistingUser = true
                return true
            } else {
                retries++
                if (retries === maxRetries) {
                    return false
                }
                await delay(500)
            }
        }
    }

    private openLinkIfAvailable = async () => {
        let linkAvailable = false
        let payLoad
        let retries = 0
        let maxRetries = 20

        while (!linkAvailable && retries !== maxRetries + 1) {
            const linkToOpen = await browser.storage.local.get('@URL_TO_OPEN')
            if (linkToOpen['@URL_TO_OPEN'] != null) {
                payLoad = linkToOpen['@URL_TO_OPEN']
                await browser.storage.local.remove('@URL_TO_OPEN')
                if (payLoad.type === 'pageToOpen') {
                    await this.dependencies.contentScriptsBG.openPageWithSidebarInSelectedListMode(
                        {
                            fullPageUrl: payLoad.originalPageUrl,
                            sharedListId: payLoad.sharedListId,
                        },
                    )
                }
                if (payLoad.type === 'returnToFollowedSpace') {
                    browser.tabs
                        .query({
                            url: payLoad.originalPageUrl,
                            currentWindow: true,
                        })
                        .then((tab) =>
                            browser.tabs.update(tab[0].id, { active: true }),
                        )
                    console.log('return to followed space', payLoad.fullPageUrl)
                }
                return true
            } else {
                retries++
                if (retries === maxRetries) {
                    return false
                }
                await delay(500)
            }
        }
    }

    private checkIfAutoOpenLinkAvailable = async () => {
        let linkAvailable = false
        let retries = 0
        let maxRetries = 8

        while (!linkAvailable && retries !== maxRetries + 1) {
            const linkToOpen = await browser.storage.local.get('@URL_TO_OPEN')
            if (linkToOpen['@URL_TO_OPEN'] != null) {
                this.hasLinkToOpen = true
                this.emitMutation({
                    preventOnboardingFlow: { $set: true },
                })
                return true
            } else {
                retries++
                if (retries === maxRetries) {
                    return false
                }
                await delay(500)
            }
        }
    }

    private checkIfMemexSocialTabOpen = async () => {
        const tabsFromExtApi = browser.tabs
        const tabs = await tabsFromExtApi.query({
            url: ['https://*.memex.social/*', 'http://localhost:3000/*'],
        })
        if (tabs.length > 0) {
            return true
        }
    }

    private async _onUserLogIn(newSignUp: boolean) {
        this.emitMutation({
            newSignUp: { $set: newSignUp },
            loadState: { $set: 'running' },
        })

        this.syncPromise = executeUITask(this, 'syncState', async () =>
            this.dependencies.personalCloudBG.enableCloudSyncForNewInstall(),
        )

        if (this.hasLinkToOpen) {
            await this.openLinkIfAvailable()
            window.close()
        } else {
            this.dependencies.navToDashboard()
            if (newSignUp) {
                this.dependencies.navToGuidedTutorial()
            }
        }
    }

    onUserLogIn: EventHandler<'onUserLogIn'> = async ({ event }) => {
        this.emitMutation({
            loadState: { $set: 'running' },
        })
        await this.checkIfAutoOpenLinkAvailable()
        await this._onUserLogIn(!!event.newSignUp)
    }

    goToSyncStep: EventHandler<'goToSyncStep'> = async ({ previousState }) => {
        if (!this.isExistingUser && !previousState.newSignUp) {
            this.emitMutation({ step: { $set: 'sync' } })

            await (previousState.syncState === 'success'
                ? delay(3000)
                : this.syncPromise)
        }
        this.dependencies.navToDashboard()
    }

    setAuthDialogMode: EventHandler<'setAuthDialogMode'> = ({ event }) => {
        return { authDialogMode: { $set: event.mode } }
    }
}
