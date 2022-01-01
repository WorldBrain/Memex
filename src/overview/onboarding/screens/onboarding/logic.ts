import {
    UILogic,
    loadInitial,
    executeUITask,
    UIEventHandler,
} from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import type { Dependencies, State, Event } from './types'
import delay from 'src/util/delay'
import { GUIDED_ONBOARDING_URL } from '../../constants'
import { setLocalStorage, getLocalStorage } from 'src/util/storage'
import { getFirebase } from 'src/util/firebase-app-initialized'

type EventHandler<EventName extends keyof Event> = UIEventHandler<
    State,
    Event,
    EventName
>

export default class Logic extends UILogic<State, Event> {
    syncPromise: Promise<any>
    isExistingUser = false

    constructor(private dependencies: Dependencies) {
        super()
    }

    getInitialState = (): State => ({
        step: 'tutorial',
        loadState: 'pristine',
        syncState: 'pristine',
        shouldShowLogin: true,
        newSignUp: false,
    })

    async init() {
        const { authBG } = this.dependencies

        await loadInitial(this, async () => {
            const user = await authBG.getCurrentUser()
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

        this.setSignupDate()

        if (!this.isExistingUser) {
            this.syncPromise = executeUITask(this, 'syncState', async () =>
                this.dependencies.personalCloudBG.enableCloudSyncForNewInstall(),
            )
        }
    }

    async getSignupDate() {
        const signupDateLocalStorage = await getLocalStorage('signUpdate')
        return signupDateLocalStorage
    }

    async setSignupDate() {
        const signupDateLocalStorage = this.getSignupDate()
        if (signupDateLocalStorage) {
            const SignUpDateFirebase = await getFirebase().auth().currentUser
                .metadata.creationTime
            setLocalStorage('signUpdate', SignUpDateFirebase)
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
}
