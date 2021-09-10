import React from 'react'

import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { Container, BtnBox, Header, Text, TopComponent } from './shared-components'

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
            return isPrepping && (
                <>
                    <TopComponent>
                        <LoadingIndicator />
                    </TopComponent>
                    <Header>Preparing Cloud Migration</Header>
                    <Text>
                        Don't close your browser or shut off your computer in
                        this stage or you have to restart the migration.
                    </Text>
                </>
            )
        }
        if (migrationState === 'error') {
            return (
                <>
                    <TopComponent>
                    <Icon icon="alertRound" height="20px" />
                    </TopComponent>
                    <Header>
                        There was an error with migrating your data to the cloud
                    </Header>
                    <Text>
                        <a href={supportLink}>Contact support</a> if problem
                        persists.
                    </Text>
                </>
            )
        }
        return (
            <>
                    <TopComponent>
                        <LoadingIndicator />
                    </TopComponent>
                    <Header>Cloud Migration in Progress</Header>
                    <Text>
                        This process with run and continue in the background.
                        <br/>
                        Login on other devices to sync them too.
                        <br/>
                        It may take a while for all content to appear on all
                        your devices.
                    </Text>
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
