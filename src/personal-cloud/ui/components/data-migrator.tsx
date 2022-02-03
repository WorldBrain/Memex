import React from 'react'

import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import styled from 'styled-components'

import {
    Container,
    BtnBox,
    Header,
    Text,
    TopComponent,
} from './shared-components'

export interface Props {
    isPrepping: boolean
    supportLink: string
    migrationState: UITaskState
    onRetryClick: React.MouseEventHandler
    onCancelClick: React.MouseEventHandler
    onCloseClick: React.MouseEventHandler
}

export default class DataMigrator extends React.PureComponent<Props> {
    private renderBtns() {
        const { migrationState, isPrepping } = this.props
        if (migrationState === 'running' && isPrepping) {
            return false
        }
        if (migrationState === 'running') {
            return (
                <SecondaryAction
                    label="Close"
                    onClick={this.props.onCloseClick}
                />
            )
        }
        if (migrationState === 'error') {
            return (
                <>
                    <SecondaryAction
                        label="Cancel"
                        onClick={this.props.onCancelClick}
                    />
                    <PrimaryAction
                        label="Retry"
                        onClick={this.props.onRetryClick}
                    />
                </>
            )
        }
        return (
            <PrimaryAction
                label="Go to Dashboard"
                onClick={this.props.onCloseClick}
            />
        )
    }

    private renderContent() {
        const { migrationState, supportLink, isPrepping } = this.props
        if (migrationState === 'running') {
            return isPrepping ? (
                <>
                    <TopComponent>
                        <LoadingIndicator />
                    </TopComponent>
                    <SectionTitle>Preparing Cloud Migration</SectionTitle>
                    <InfoText>
                        Don't close your browser or shut off your computer in
                        this stage or you have to restart the migration.
                    </InfoText>
                </>
            ) : (
                <>
                    <TopComponent>
                        <LoadingIndicator />
                    </TopComponent>
                    <SectionTitle>Cloud Migration in Progress</SectionTitle>
                    <InfoText>
                        You can close this modal, as the sync process will
                        continue in the background.
                        <br />
                        Login on other devices to sync them too.
                    </InfoText>
                </>
            )
        }
        if (migrationState === 'error') {
            return (
                <>
                    <TopComponent>
                        <Icon icon="alertRound" height="20px" />
                    </TopComponent>
                    <SectionTitle>
                        There was an error with migrating your data to the cloud
                    </SectionTitle>
                    <InfoText>
                        <a href={supportLink}>Contact support</a> if problem
                        persists.
                    </InfoText>
                </>
            )
        }
        return (
            <>
                <TopComponent>
                    <LoadingIndicator />
                </TopComponent>
                <SectionTitle>Cloud Migration in Progress</SectionTitle>
                <InfoText>
                    You can close this modal, as the sync process will continue
                    in the background.
                    <br />
                    Login on other devices to sync them too.
                    <br />
                    It may take a while for all content to appear on all your
                    devices.
                </InfoText>
            </>
        )
    }

    render() {
        return (
            <Container>
                {this.renderContent()}
                <BtnBox>{this.renderBtns()}</BtnBox>
            </Container>
        )
    }
}

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    margin-bottom: 40px;
    text-align: center;
    font-weight: 500;
`
