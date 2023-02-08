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
    })

    async init() {
        const { authBG, contentScriptsBG } = this.dependencies
        this.emitMutation({
            mode: { $set: 'signup' },
            loadState: { $set: 'running' },
        })

        if (await this.checkIfMemexSocialTabOpen()) {
            const done = await Promise.all([
                this.autoLoginAvailable(),
                this.openLinkIfAvailable(),
            ])

            if (done) {
                if (this.hasAccountSynced) {
                    await this._onUserLogIn(false)
                } else {
                    await this._onUserLogIn(true)
                }
            } else {
                this.emitMutation({
                    loadState: { $set: 'pristine' },
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
        let maxRetries = 10
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
        let maxRetries = 10

        while (!linkAvailable && retries !== maxRetries + 1) {
            const linkToOpen = await browser.storage.local.get('@URL_TO_OPEN')
            if (linkToOpen['@URL_TO_OPEN'] != null) {
                this.emitMutation({
                    preventOnboardingFlow: { $set: true },
                })
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
        })

        if (newSignUp) {
            this.emitMutation({
                setSaveState: { $set: 'pristine' },
                loadState: { $set: 'pristine' },
                authDialogMode: { $set: 'signup' },
            })
        }

        if (this.isExistingUser) {
            this.emitMutation({
                shouldShowLogin: { $set: false },
            })
            this.syncPromise = executeUITask(this, 'syncState', async () =>
                this.dependencies.personalCloudBG.enableCloudSyncForNewInstall(),
            )
        }
        if (!newSignUp) {
            this.emitMutation({
                setSaveState: { $set: 'running' },
                authDialogMode: { $set: 'login' },
            })
            this.syncPromise = executeUITask(this, 'syncState', async () =>
                this.dependencies.personalCloudBG.enableCloudSyncForNewInstall(),
            )
            this.dependencies.navToDashboard()
        }
    }

    onUserLogIn: EventHandler<'onUserLogIn'> = async ({ event }) => {
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
