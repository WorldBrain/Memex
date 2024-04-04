import {
    UILogic,
    loadInitial,
    executeUITask,
    UIEventHandler,
} from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import type { Dependencies, State, Event } from './types'
import { checkStripePlan } from 'src/util/subscriptions/storage'

type EventHandler<EventName extends keyof Event> = UIEventHandler<
    State,
    Event,
    EventName
>

export default class Logic extends UILogic<State, Event> {
    syncPromise: Promise<any>
    isExistingUser = false
    action?: 'login' | 'register'

    constructor(private dependencies: Dependencies) {
        super()
    }

    getInitialState = (): State => ({
        step: 'tutorial',
        loadState: 'pristine',
        syncState: 'pristine',
        shouldShowLogin: true,
        newSignUp: false,
        mode: 'signup',
        email: '',
        password: '',
        displayName: '',
        saveState: 'pristine',
        passwordMatch: false,
        passwordConfirm: '',
        currentUser: null,
        passwordResetSent: false,
        AILimit: '',
        pageLimit: '',
        subscriptionStatus: null,
        subscriptionStatusLoading: 'running',
        loginToken: null,
        loadQRCode: 'pristine',
        systemSelectMenuState: false,
        generateTokenDisplay: null,
        copyToClipBoardState: 'pristine',
    })

    async init() {
        const { authBG } = this.dependencies
        this.emitMutation({
            loadState: { $set: 'running' },
        })

        this.emitMutation({
            mode: { $set: 'signup' },
        })

        await loadInitial(this, async () => {
            const user = await authBG.getCurrentUser()
            this.emitMutation({
                loadState: { $set: 'success' },
            })
            if (user != null) {
                this.isExistingUser = true
                await this._onUserLogIn(false)
            }
        })
    }

    private async _onUserLogIn(newSignUp: boolean) {
        this.emitMutation({
            shouldShowLogin: { $set: false },
            newSignUp: { $set: newSignUp },
        })

        if (!this.isExistingUser) {
            this.syncPromise = executeUITask(this, 'syncState', async () =>
                this.dependencies.personalCloudBG.enableCloudSyncForNewInstall(),
            )
        }
    }

    getCurrentUser: EventHandler<'getCurrentUser'> = ({ event }) => {
        this.emitMutation({
            currentUser: { $set: event.currentUser },
            loadState: { $set: 'success' },
        })
    }
    toggleGenerateTokenSystemSelectMenu: EventHandler<
        'toggleGenerateTokenSystemSelectMenu'
    > = ({ event, previousState }) => {
        this.emitMutation({
            systemSelectMenuState: {
                $set: !previousState.systemSelectMenuState,
            },
        })
    }
    copyCodeToClipboard: EventHandler<'copyCodeToClipboard'> = ({
        previousState,
    }) => {
        this.emitMutation({
            copyToClipBoardState: {
                $set: 'success',
            },
        })
        navigator.clipboard.writeText(previousState.loginToken)
        setTimeout(() => {
            this.emitMutation({
                copyToClipBoardState: {
                    $set: 'pristine',
                },
            })
        }, 3000)
    }

    generateLoginToken: EventHandler<'generateLoginToken'> = async ({
        event,
    }) => {
        if (event.system === 'iOs') {
            this.emitMutation({
                generateTokenDisplay: { $set: 'text' },
            })
        }
        if (event.system === 'android') {
            this.emitMutation({
                generateTokenDisplay: { $set: 'qr' },
            })
        }
        await executeUITask(this, 'loadQRCode', async () => {
            const token = await this.dependencies.authBG.generateLoginToken()
            this.emitMutation({ loginToken: { $set: token } })
        })
    }

    onUserLogIn: EventHandler<'onUserLogIn'> = async ({ event }) => {
        await this._onUserLogIn(!!event.newSignUp)
    }

    setAuthDialogMode: EventHandler<'setAuthDialogMode'> = ({ event }) => {
        return { authDialogMode: { $set: event.mode } }
    }

    sendPasswordReset: EventHandler<'sendPasswordReset'> = ({
        previousState,
        event,
    }) => {
        this.emitMutation({ passwordResetSent: { $set: true } })
        this.dependencies.authBG.sendPasswordResetEmailProcess(
            previousState.currentUser.email,
        )
    }
    setSubscriptionStatus: EventHandler<'setSubscriptionStatus'> = async ({
        previousState,
        event,
    }) => {
        this.emitMutation({
            subscriptionStatusLoading: {
                $set: 'running',
            },
        })
        console.log('event.email', event.email)
        const subscriptionStatusInfo = await checkStripePlan(event.email)

        if (subscriptionStatusInfo != null) {
            this.emitMutation({
                subscriptionStatusLoading: {
                    $set: 'success',
                },
            })
        } else if (
            subscriptionStatusInfo.status === 'active' ||
            subscriptionStatusInfo.status === 'already-setup'
        ) {
            this.emitMutation({
                pageLimit: {
                    $set:
                        subscriptionStatusInfo.pageLimit > 10000
                            ? 'Unlimited'
                            : subscriptionStatusInfo.pageLimit.toString(),
                },
                AILimit: {
                    $set:
                        subscriptionStatusInfo.AILimit > 10000
                            ? 'Unlimited'
                            : subscriptionStatusInfo.AILimit.toString(),
                },
                subscriptionStatusLoading: {
                    $set: 'success',
                },
            })
        }
    }
}
