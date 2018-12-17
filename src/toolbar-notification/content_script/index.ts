import { bodyLoader } from 'src/util/loader'
import { createRootElement, destroyRootElement } from './rendering'
import { setupUIContainer } from './react'
import { RemoteFunctionRegistry } from '../../util/webextensionRPC'
import { any } from 'prop-types'

export default class ToolbarNotifications {
    _rootElement = null

    registerRemoteFunctions(registry: RemoteFunctionRegistry) {
        registry.registerRemotelyCallable({
            showToolbarNotification: (type: string, extraProps: any) => {
                this.showToolbarNotification(type, extraProps)
            },
        })
    }

    async showToolbarNotification(type: string, extraProps: any) {
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
            extraProps,
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
