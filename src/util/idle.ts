import * as Raven from 'src/util/raven'

export type IdleState = typeof chrome.idle.IdleState | 'locked'
type Handler = () => Promise<void> | void
type ErrHandler = (err: Error) => void

interface IdleHandlers {
    onIdle: Handler
    onActive: Handler
    onLocked: Handler
}

export class IdleManager {
    public static DEF_INTERVAL = 20

    private interval: number

    // States to hold scheduled handlers in
    private handlers = {
        idle: new Set<Handler>(),
        locked: new Set<Handler>(),
        active: new Set<Handler>(),
    }

    constructor(interval = IdleManager.DEF_INTERVAL) {
        this.idleInterval = interval
    }

    private runHandler = (handler: Handler) =>
        Promise.resolve(handler()).catch(this._errHandler)

    private _errHandler: ErrHandler = (err) => {
        if (process.env.NODE_ENV === 'development') {
            console.error(err)
        } else {
            Raven.captureException(err)
        }
    }

    public set errHandler(handler: ErrHandler) {
        this._errHandler = handler
    }

    public set idleInterval(seconds: number) {
        if (chrome.idle) {
            chrome.idle.setDetectionInterval(seconds)
        }

        this.interval = seconds
    }

    public handleIdleStateChange = (state: IdleState) =>
        [...this.handlers[state as keyof typeof this.handlers]].map(
            this.runHandler,
        )

    /**
     * Allow setting up of logic to be run on different browser idle events.
     */
    public scheduleIdleCbs(handlerCbs: Partial<IdleHandlers>) {
        if (handlerCbs.onIdle) {
            this.handlers.idle.add(handlerCbs.onIdle)
        }

        if (handlerCbs.onLocked) {
            this.handlers.locked.add(handlerCbs.onLocked)
        }

        if (handlerCbs.onActive) {
            this.handlers.active.add(handlerCbs.onActive)
        }
    }
}

const idleManager = new IdleManager()

if (chrome.idle) {
    // Run all handlers in specific state corresponding to idle state change
    chrome.idle.onStateChanged.addListener((newState) =>
        idleManager.handleIdleStateChange(newState as IdleState),
    )
}

export { idleManager }
