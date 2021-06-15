import React from 'react'

import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { Container, BtnBox, Header, Text } from './shared-components'

export interface Props {
    supportLink: string
    backupState: UITaskState
    dataCleaningState: UITaskState
    onBackupClick: React.MouseEventHandler
    onContinueClick: React.MouseEventHandler
    onRetryCleanClick: React.MouseEventHandler
    onCancelCleanClick: React.MouseEventHandler
    onRetryBackupClick: React.MouseEventHandler
    onCancelBackupClick: React.MouseEventHandler
}

export default class DataDumper extends React.PureComponent<Props> {
    private renderBtns() {
        const { backupState, dataCleaningState, supportLink } = this.props
        if (dataCleaningState === 'running') {
            return (
                <SecondaryAction
                    label="Cancel"
                    onClick={this.props.onCancelCleanClick}
                />
            )
        }
        if (dataCleaningState === 'error') {
            return (
                <>
                    <SecondaryAction
                        label="Cancel"
                        onClick={this.props.onCancelCleanClick}
                    />
                    <PrimaryAction
                        label="Retry"
                        onClick={this.props.onRetryCleanClick}
                    />
                </>
            )
        }

        if (backupState === 'pristine') {
            return (
                <>
                    <SecondaryAction
                        label="Download Backup"
                        onClick={this.props.onBackupClick}
                    />
                    <PrimaryAction
                        label="Continue Migration"
                        onClick={this.props.onContinueClick}
                    />
                </>
            )
        }
        if (backupState === 'running') {
            return (
                <SecondaryAction
                    label="Cancel"
                    onClick={this.props.onCancelBackupClick}
                />
            )
        }
        if (backupState === 'error') {
            return (
                <>
                    <SecondaryAction
                        label="Retry"
                        onClick={this.props.onRetryBackupClick}
                    />
                    <PrimaryAction
                        label="Continue Migration"
                        onClick={this.props.onContinueClick}
                    />
                </>
            )
        }

        return (
            <PrimaryAction
                label="Continue Migration"
                onClick={this.props.onContinueClick}
            />
        )
    }

    private renderContent() {
        const { backupState, dataCleaningState, supportLink } = this.props
        if (dataCleaningState === 'running') {
            return (
                <>
                    <LoadingIndicator />
                    <Header>Preparing Migration: Cleaning Old Data</Header>
                    <Text>
                        This may take a couple of minutes. You can't use Memex
                        in the meantime.
                    </Text>
                </>
            )
        }
        if (dataCleaningState === 'error') {
            return (
                <>
                    <Icon icon="alertRound" height="20px" />
                    <Header>There was an error with cleaning your data</Header>
                    <Text>
                        <a href={supportLink}>Contact support</a> if problem
                        persists.
                    </Text>
                </>
            )
        }

        if (backupState === 'pristine') {
            return (
                <>
                    <Header>
                        Clean your data before starting the migration
                    </Header>
                    <Text>
                        You've been using Memex since when we still had the
                        history full-text search.
                    </Text>
                    <Text>
                        Because of that, there is a lot of unecessary data in
                        your Memex that must be cleaned out.
                    </Text>
                    <br />
                    <Text>
                        You have the chance now to create a{' '}
                        <strong>one-time backup</strong> of that data before
                        migrating to the Memex cloud.
                    </Text>
                </>
            )
        }
        if (backupState === 'running') {
            return (
                <>
                    <LoadingIndicator />
                    <Header>Data Backup In Progress</Header>
                    <Text>
                        This may take a couple of minutes. You can't use Memex
                        in the meantime.
                    </Text>
                </>
            )
        }
        if (backupState === 'error') {
            return (
                <>
                    <Icon icon="alertRound" height="20px" />
                    <Header>There was an error with your data backup</Header>
                    <Text>
                        <a href={supportLink}>Contact support</a> if problem
                        persists.
                    </Text>
                </>
            )
        }

        return (
            <>
                <Icon icon="checkRound" height="20px" />
                <Header>Data Backup Finished</Header>
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
