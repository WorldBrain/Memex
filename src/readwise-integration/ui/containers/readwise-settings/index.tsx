import React from 'react'

import { StatefulUIElement } from 'src/util/ui-logic'
import ReadwiseSettingsLogic from './logic'
import {
    ReadwiseSettingsDependencies,
    ReadwiseSettingsEvent,
    ReadwiseSettingsState,
} from './types'
import * as selectors from './selectors'

export default class ReadwiseSettings extends StatefulUIElement<
    ReadwiseSettingsDependencies,
    ReadwiseSettingsState,
    ReadwiseSettingsEvent
> {
    constructor(props: ReadwiseSettingsDependencies) {
        super(props, new ReadwiseSettingsLogic(props))
    }

    renderSyncing() {
        return (
            <div>
                {selectors.showSyncError(this.state) && (
                    <div>
                        Something went wrong syncing your existing
                        annotations...
                    </div>
                )}
                {selectors.showSyncRunning(this.state) && (
                    <div>Syncing your existing annotations...</div>
                )}
            </div>
        )
    }

    renderForm() {
        return (
            <div>
                <div>
                    <input
                        type="text"
                        placeholder="ReadWise API key"
                        disabled={selectors.apiKeyDisabled(this.state)}
                        value={this.state.apiKey || ''}
                        onChange={(e) =>
                            this.processEvent('setAPIKey', {
                                key: e.target.value,
                            })
                        }
                    />
                    {selectors.showKeyRemoveButton(this.state) && (
                        <span
                            onClick={() =>
                                this.processEvent('removeAPIKey', null)
                            }
                        >
                            Remove
                        </span>
                    )}
                </div>
                {selectors.showKeySaveError(this.state) && (
                    <div>{selectors.keySaveErrorMessage(this.state)}</div>
                )}
                {selectors.showKeySuccessMessage(this.state) && (
                    <div>
                        Your ReadWise integration is now active! Any annotations
                        you make from here are immediately sent to your ReadWise
                        account.
                    </div>
                )}
                {selectors.showSyncSuccessMessage(this.state) && (
                    <div>
                        Your ReadWise integration is now active! Your existing
                        notes are being uploaded to Readwise, and any
                        annotations you make from here are will be sent to your
                        ReadWise account.
                    </div>
                )}
                {selectors.formEditable(this.state) && (
                    <div>
                        <input
                            type="checkbox"
                            checked={this.state.syncExistingNotes ?? false}
                            onChange={(e) =>
                                this.processEvent(
                                    'toggleSyncExistingNotes',
                                    null,
                                )
                            }
                        />{' '}
                        Sync existing higlights
                    </div>
                )}
                {selectors.showKeySaveButton(this.state) && (
                    <div>
                        <button
                            onClick={() =>
                                this.processEvent('saveAPIKey', null)
                            }
                        >
                            Confirm
                        </button>
                    </div>
                )}
                {selectors.showKeySaving(this.state) && (
                    <div>Saving API key...</div>
                )}
            </div>
        )
    }

    render() {
        if (selectors.showForm(this.state)) {
            return this.renderForm()
        }
        if (selectors.showSyncScreen(this.state)) {
            return this.renderSyncing()
        }
        if (selectors.showLoadingError(this.state)) {
            return 'Something went wrong loading your ReadWise.io settings'
        }
    }
}
