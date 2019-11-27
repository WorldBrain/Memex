import { EventEmitter } from 'events'
import { RecurringTask } from '@worldbrain/storex-sync/lib/utils/recurring-task'

export class ConnectivityCheckerBackground extends EventEmitter {
    static DEF_CHECK_INTERVAL = 60000
    static DEF_CHECK_TIMEOUT = 10000
    static DEF_TARGET =
        'https://worldbrain.io/wp-content/uploads/2019/04/cropped-logo_squared_favicon-32x32.png'
    static CONNECTED_EVENT = 'connected'
    static DISCONNECTED_EVENT = 'disconnected'

    private recurringTask: RecurringTask

    isConnected: boolean = true

    constructor(
        private props: {
            xhr: XMLHttpRequest
            target: string
            checkingTimeout?: number
            checkingInterval?: number
        },
    ) {
        super()

        this.props.checkingInterval =
            props.checkingInterval ||
            ConnectivityCheckerBackground.DEF_CHECK_INTERVAL

        this.props.xhr.timeout =
            props.checkingTimeout ||
            ConnectivityCheckerBackground.DEF_CHECK_TIMEOUT
    }

    setupChecking() {
        if (this.recurringTask != null) {
            return
        }

        this.recurringTask = new RecurringTask(this.checkConnection, {
            intervalInMs: this.props.checkingInterval,
            onError: this.handleProcessingError,
        })
    }

    async forceCheck() {
        await this.checkConnection()
    }

    private handleProcessingError = (err: Error) => {}

    private checkConnection = async () => {
        this.isConnected = await this.runCheck()

        this.emit(
            this.isConnected
                ? ConnectivityCheckerBackground.CONNECTED_EVENT
                : ConnectivityCheckerBackground.DISCONNECTED_EVENT,
        )
    }

    private runCheck(): Promise<boolean> {
        return new Promise(resolve => {
            this.props.xhr.open('GET', this.props.target, true)
            this.props.xhr.onload = () => resolve(true)
            this.props.xhr.onerror = () => resolve(false)
            this.props.xhr.send()
        })
    }
}
