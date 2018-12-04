import { bodyLoader } from 'src/util/loader'
import { createRootElement, destroyRootElement } from './rendering'
import { setupUIContainer } from './react'
import { RemoteFunctionRegistry } from '../../util/webextensionRPC'

export default class ToolbarNotifications {
    _rootElement = null

    registerRemoteFunctions(registry: RemoteFunctionRegistry) {
        registry.registerRemotelyCallable({
            showToolbarNotification: (type: string) => {
                this.showToolbarNotification(type)
            },
        })
    }

    async showToolbarNotification(type: string) {
        await bodyLoader()

        if (this._rootElement) {
            // We're already showing a notification, close it
            console.warn(
                'Showing a toolbar notification while already showing one, overriding...',
            )
            this._destroyRootElement()
        }

        const { rootElement, shadow } = createRootElement()
        await setupUIContainer(rootElement, {
            type,
            shadow,
            onCloseRequested: () => {
                this._destroyRootElement()
            },
        })
    }

    _ensureRootElement() {
        if (this._rootElement) {
            return this._rootElement
        }

        this._rootElement = createRootElement()
        return this._rootElement
    }

    _destroyRootElement() {
        destroyRootElement()
        this._rootElement = null
    }
}
