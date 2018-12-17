import { EventEmitter } from 'events'

export class ProcedureUiCommunication {
    _uiTabIds: { [tabId: string]: true } = {}

    constructor(public eventName: string) {}

    registerUiTab(tab) {
        this._uiTabIds[tab.id] = true
    }

    sendEvent(eventType, event) {
        for (const tabId of Object.keys(this._uiTabIds)) {
            try {
                window['browser'].tabs.sendMessage(parseInt(tabId, 10), {
                    type: this.eventName,
                    event: { type: eventType, ...(event || {}) },
                })
            } catch (e) {
                // user closed tab
                delete this._uiTabIds[tabId]
            }
        }
    }

    connect(events: EventEmitter, handler = null) {
        for (const eventName of ['info', 'fail', 'success']) {
            events.on(eventName, event => {
                if (!handler) {
                    this.sendEvent(eventName, event)
                } else {
                    handler(eventName, event)
                }
            })
        }
    }
}
