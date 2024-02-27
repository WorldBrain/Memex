import React from 'react'
import styled from 'styled-components'

import { StatefulUIElement } from 'src/util/ui-logic'
import ReadwiseSettingsLogic from './logic'
import {
    ReadwiseSettingsDependencies,
    ReadwiseSettingsEvent,
    ReadwiseSettingsState,
} from './types'
import * as selectors from './selectors'
import Checkbox from 'src/common-ui/components/Checkbox'

import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { runInBackground } from 'src/util/webextensionRPC'
import { ReadwiseInterface } from 'src/readwise-integration/background/types/remote-interface'
import { AuthContextInterface } from 'src/authentication/background/types'
import { userAuthorizedForReadwise } from './utils'
import analytics from 'src/analytics'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'

class ReadwiseSettingsContainer extends React.Component<
    AuthContextInterface & { showSubscriptionModal: () => void }
> {
    render() {
        return (
            <ReadwiseSettings
                readwise={runInBackground<ReadwiseInterface<'caller'>>()}
                checkFeatureAuthorized={async () =>
                    userAuthorizedForReadwise(this.props.currentUser)
                }
                showSubscriptionModal={this.props.showSubscriptionModal}
            />
        )
    }
}

class ReadwiseSettings extends StatefulUIElement<
    ReadwiseSettingsDependencies,
    ReadwiseSettingsState,
    ReadwiseSettingsEvent
> {
    constructor(props: ReadwiseSettingsDependencies) {
        super(props, new ReadwiseSettingsLogic(props))
    }

    renderUnauthorized() {
        return (
            <MainBox>
                <SuccessMessage>
                    Subscribe to a paid plan to automatically sync all your
                    highlights to ReadWise.io
                </SuccessMessage>
                <PrimaryAction
                    label="Subscribe"
                    onClick={() =>
                        this.processEvent('showSubscriptionModal', null)
                    }
                />
            </MainBox>
        )
    }

    renderSyncScreen() {
        return (
            <div>
                {selectors.showSyncError(this.state) && (
                    <ErrorMessage>
                        Something went wrong syncing your existing
                        annotations...
                    </ErrorMessage>
                )}
                {selectors.showSyncRunning(this.state) && (
                    <SuccessMessage>
                        Syncing your existing annotations...
                    </SuccessMessage>
                )}
            </div>
        )
    }

    confirmSyncKey() {
        this.processEvent('saveAPIKey', null)

        analytics.trackEvent({
            category: 'Readwise',
            action: 'setupReadwise',
        })
    }

    removeSyncKey() {
        this.processEvent('removeAPIKey', null)

        analytics.trackEvent({
            category: 'Readwise',
            action: 'removeReadwise',
        })
    }

    renderForm() {
        return (
            <div>
                {!selectors.showKeyRemoveButton(this.state) && ''}
                {selectors.formEditable(this.state) && (
                    <ExistingHighlightBox>
                        <Checkbox
                            id="Existing Highlight Settings"
                            isChecked={this.state.syncExistingNotes ?? false}
                            handleChange={(e) =>
                                this.processEvent(
                                    'toggleSyncExistingNotes',
                                    null,
                                )
                            }
                            fontSize={16}
                            label={'Sync existing highlights'}
                        />
                    </ExistingHighlightBox>
                )}
                <ExistingHighlightBox>
                    <Checkbox
                        id="Sync only notes with highlights"
                        isChecked={
                            this.state.syncOnlyNotesWithHighlights ?? false
                        }
                        handleChange={(e) =>
                            this.processEvent('toggleOnlySyncNotes', null)
                        }
                        fontSize={16}
                        label={'Sync only notes with highlights'}
                    />
                </ExistingHighlightBox>

                {selectors.showKeySaveError(this.state) ? (
                    <ErrorMessage>
                        {selectors.keySaveErrorMessage(this.state)}
                    </ErrorMessage>
                ) : (
                    <>
                        {selectors.showKeySuccessMessage(this.state) && (
                            <SuccessMessage>
                                Your ReadWise integration is now active! <br />
                                Any annotation you make from now on is
                                immediately uploaded.
                            </SuccessMessage>
                        )}
                        {selectors.showSyncSuccessMessage(this.state) && (
                            <SuccessMessage>
                                Your ReadWise integration is now active! <br />
                                Existing annotations are uploaded and every new
                                one you make too.
                            </SuccessMessage>
                        )}
                    </>
                )}
                <MainBox>
                    {this.state.apiKey || this.state.apiKeyEditable ? (
                        <TextField
                            placeholder="ReadWise API key"
                            disabled={!this.state.apiKeyEditable}
                            value={
                                selectors.showKeySaving(this.state)
                                    ? 'Saving API key...'
                                    : this.state.apiKey || ''
                            }
                            onChange={(e) =>
                                this.processEvent('setAPIKey', {
                                    key: (e.target as HTMLInputElement).value,
                                })
                            }
                            type="text"
                        />
                    ) : undefined}
                    {selectors.showKeySaveButton(this.state) && (
                        <div>
                            <PrimaryAction
                                onClick={() => this.confirmSyncKey()}
                                label={'Confirm'}
                                icon={'check'}
                                size={'medium'}
                                type={'secondary'}
                                padding={'0 8px 0 4px'}
                                height="44px"
                            />
                        </div>
                    )}
                    {selectors.showKeyRemoveButton(this.state) && (
                        <PrimaryAction
                            onClick={() => this.removeSyncKey()}
                            label={'Remove'}
                            icon={'check'}
                            size={'medium'}
                            type={'secondary'}
                            padding={'0 8px 0 4px'}
                            height="44px"
                        />
                    )}
                </MainBox>
            </div>
        )
    }

    render() {
        return (
            <>
                {selectors.showSyncScreen(this.state) &&
                    this.renderSyncScreen()}
                {selectors.showForm(this.state) && this.renderForm()}
                {selectors.showLoadingError(this.state) &&
                    'Something went wrong loading your ReadWise.io settings'}
            </>
        )
    }
}

export default connect(null, (dispatch) => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
}))(withCurrentUser(ReadwiseSettingsContainer))

const MainBox = styled.div`
    display: flex;
    margin-top: 10px;
    justify-content: space-between;
    align-items: center;
    grid-gap: 15px;
`

const ExistingHighlightBox = styled.div`
    display: flex;
    margin: 10px 0px 20px;
    font-size: 14px;
    align-items: center;
    color: ${(props) => props.theme.colors.darkerText};
`

const ErrorMessage = styled.div`
    display: flex;
    margin-top: 10px;
    background: #f29d9d;
    font-size: 14px;
    border-radius: 3px;
    border: none;
    justify-content: center;
    height: 30px;
    color: 3a2f45;
    align-items: center;
`

const SuccessMessage = styled.div`
    display: flex;
    margin: 0px 0px 20px 0px;
    font-size: 14px;

    border-radius: 3px;
    border: none;
    font-weight: 300;
    justify-content: flex-start;
    color: ${(props) => props.theme.colors.greyScale5};
    flex-direction: column;
`
