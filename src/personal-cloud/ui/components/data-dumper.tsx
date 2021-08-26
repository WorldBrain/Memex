import React from 'react'
import styled from 'styled-components'

import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { Container, BtnBox, Header, Text } from './shared-components'

export interface Props {
    supportLink: string
    backupState: UITaskState
    onStartClick: React.MouseEventHandler
    onRetryClick: React.MouseEventHandler
    onCancelClick: React.MouseEventHandler
    onContinueClick: React.MouseEventHandler
    onUseOldVersionClick: React.MouseEventHandler
}

export default class DataDumper extends React.PureComponent<Props> {
    private renderBtns() {
        const { backupState } = this.props

        if (backupState === 'pristine') {
            return (
                <>
                    <SecondaryAction
                        label="Backup existing data"
                        onClick={this.props.onStartClick}
                    />
                    <PrimaryAction
                        label="Continue migration"
                        onClick={this.props.onContinueClick}
                    />
                </>
            )
        }
        if (backupState === 'running') {
            return (
                <SecondaryAction
                    label="Cancel"
                    onClick={this.props.onCancelClick}
                />
            )
        }
        if (backupState === 'error') {
            return (
                <>
                    <SecondaryAction
                        label="Cancel"
                        onClick={this.props.onCancelClick}
                    />
                    <PrimaryAction
                        label="Rety"
                        onClick={this.props.onRetryClick}
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
        const { backupState, supportLink } = this.props

        if (backupState === 'pristine') {
            return (
                <>
                    <Header>
                        Locally back up your data before starting the migration
                    </Header>
                    <Text>
                        Create a backup dump of your data before starting the
                        sync.
                    </Text>
                </>
            )
        }
        if (backupState === 'running') {
            return (
                <>
                    <LoadingIndicator />
                    <Header>Data Backup In Progress</Header>
                    <Text>This may take a couple of minutes.</Text>
                </>
            )
        }
        if (backupState === 'error') {
            return (
                <>
                    <Icon icon="alertRound" height="20px" />
                    <Header>There was an error</Header>
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
                {this.props.backupState === 'pristine' && (
                    <Text dimmed>
                        Don't want to use the cloud?{' '}
                        <Text
                            dimmed
                            clickable
                            onClick={this.props.onUseOldVersionClick}
                        >
                            <u>Migrate</u>
                        </Text>{' '}
                        to the last version of Memex.
                    </Text>
                )}
            </Container>
        )
    }
}
