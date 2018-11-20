import { EventEmitter } from 'events'

export class ProcedureUiCommunication {
    _uiTabIds: { [tabId: string]: true } = {}

    registerUiTab(tab) {
        this._uiTabIds[tab.id] = true
    }

    sendEvent(eventType, event) {
        for (const tabId of Object.keys(this._uiTabIds)) {
            try {
                window['browser'].tabs.sendMessage(tabId, {
                    type: 'backup-event',
                    event: { type: eventType, ...(event || {}) },
                })
            } catch (e) {
                // user closed tab
                delete this._uiTabIds[tabId]
            }
        }
    }

    connect(events: EventEmitter) {
        for (const eventName of ['info', 'fail', 'success']) {
            events.on(eventName, event => this.sendEvent(eventName, event))
        }
    }
}
