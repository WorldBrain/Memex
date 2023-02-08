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
        saveState: 'running',
        passwordMatch: false,
        passwordConfirm: '',
        setSaveState: 'pristine',
        preventOnboardingFlow: false,
        autoLoginState: 'pristine',
    })

    async init() {
        const { authBG, contentScriptsBG } = this.dependencies
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
                console.log('accountsynced', this.hasAccountSynced)

                // @Vincent: Optimisation here: Ideallyl we can start checking for if the link is available at the same time we start checking for account data. Saves a bunch of time for the user in the UI
                const linkAvailable = await this.checkIfAutoOpenLinkAvailable()
                if (linkAvailable) {
                    console.log('link available')
                    await this.openLinkIfAvailable()
                }
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
                console.log('user', user)
                return true
            } else {
                retries++
                console.log('retrying findign user data')
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
                await this.dependencies.contentScriptsBG.openPageWithSidebarInSelectedListMode(
                    {
                        fullPageUrl: payLoad.originalPageUrl,
                        sharedListId: payLoad.sharedListId,
                    },
                )
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
        let payLoad
        let retries = 0
        let maxRetries = 6

        while (!linkAvailable && retries !== maxRetries + 1) {
            const linkToOpen = await browser.storage.local.get('@URL_TO_OPEN')
            if (linkToOpen['@URL_TO_OPEN'] != null) {
                this.hasLinkToOpen = true
                console.log('link to open', linkToOpen['@URL_TO_OPEN'])
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
            setSaveState: { $set: 'running' },
            loadState: { $set: 'running' },
        })

        this.syncPromise = executeUITask(this, 'syncState', async () =>
            this.dependencies.personalCloudBG.enableCloudSyncForNewInstall(),
        )
        if (!newSignUp) {
            this.emitMutation({
                preventOnboardingFlow: { $set: true },
            })
        }

        if (this.hasLinkToOpen) {
            console.log('shouldclose')
            window.close()
        } else {
            this.dependencies.navToDashboard()
        }
    }

    onUserLogIn: EventHandler<'onUserLogIn'> = async ({ event }) => {
        if ((this.hasLinkToOpen = true)) {
            this.emitMutation({
                loadState: { $set: 'running' },
            })
            await this.openLinkIfAvailable()
            await this._onUserLogIn(!!event.newSignUp)
        } else {
            await this._onUserLogIn(!!event.newSignUp)
        }
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

    goToGuidedTutorial: EventHandler<'goToGuidedTutorial'> = ({}) => {
        this.dependencies.navToGuidedTutorial()
    }

    finishOnboarding: EventHandler<'finishOnboarding'> = ({}) => {
        this.dependencies.navToDashboard()
    }

    setAuthDialogMode: EventHandler<'setAuthDialogMode'> = ({ event }) => {
        return { authDialogMode: { $set: event.mode } }
    }

    setSaveState: EventHandler<'setSaveState'> = ({ event }) => {
        return { setSaveState: { $set: event.setSaveState } }
    }
}
