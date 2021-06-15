import React from 'react'

import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { Container, BtnBox, Header, Text } from './shared-components'

export interface Props {
    supportLink: string
    migrationState: UITaskState
    onRetryMigrationClick: React.MouseEventHandler
    onCancelMigrationClick: React.MouseEventHandler
    onFinishMigrationClick: React.MouseEventHandler
}

export default class DataMigrator extends React.PureComponent<Props> {
    private renderBtns() {
        const { migrationState } = this.props
        if (migrationState === 'running') {
            return (
                <SecondaryAction
                    label="Cancel"
                    onClick={this.props.onCancelMigrationClick}
                />
            )
        }
        if (migrationState === 'error') {
            return (
                <>
                    <SecondaryAction
                        label="Cancel"
                        onClick={this.props.onCancelMigrationClick}
                    />
                    <PrimaryAction
                        label="Retry"
                        onClick={this.props.onRetryMigrationClick}
                    />
                </>
            )
        }
        if (migrationState === 'success') {
            return (
                <PrimaryAction
                    label="Complete"
                    onClick={this.props.onFinishMigrationClick}
                />
            )
        }
    }

    private renderContent() {
        const { migrationState, supportLink } = this.props
        if (migrationState === 'running') {
            return (
                <>
                    {/* TODO: Proper loading bar */}
                    <LoadingIndicator />
                    <Header>Cloud Migration in Progress</Header>
                    <Text>
                        This may take a couple of minutes. You can close the
                        tab, but can't use Memex in the meantime.
                    </Text>
                </>
            )
        }
        if (migrationState === 'error') {
            return (
                <>
                    <Icon icon="alertRound" height="20px" />
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
        if (migrationState === 'success') {
            return (
                <>
                    <Icon icon="checkRound" height="20px" />
                    <Header>Cloud Migration Complete</Header>
                    <Text>
                        You can now continue using Memex as you did before.
                        Login on other devices to sync them too.
                    </Text>
                </>
            )
        }
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
