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
    private checkingConnectionWait: Promise<void>
    isConnected: boolean = true

    constructor(
        private props: {
            xhr: XMLHttpRequest
            target?: string
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

        this.props.target =
            props.target || ConnectivityCheckerBackground.DEF_TARGET
    }

    private handleProcessingError = (err: Error) => {}

    async waitUntilConnected(intervalInMs = this.props.checkingInterval) {
        // Use the Promise created by previous calls if existing
        if (this.checkingConnectionWait) {
            return this.checkingConnectionWait
        }

        this.checkingConnectionWait = new Promise(resolve => {
            if (this.recurringTask) {
                this.recurringTask.stop()
            }

            this.recurringTask = new RecurringTask(
                async () => {
                    await this.checkConnection()

                    if (this.isConnected) {
                        this.checkingConnectionWait = undefined
                        this.recurringTask.stop()
                        resolve()
                    }
                },
                {
                    intervalInMs,
                    onError: this.handleProcessingError,
                },
            )
        })

        return this.checkingConnectionWait
    }

    async checkConnection() {
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
