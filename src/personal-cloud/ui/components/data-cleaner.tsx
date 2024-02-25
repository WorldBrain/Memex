import React from 'react'

import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { Container, BtnBox, Header, Text } from './shared-components'

export interface Props {
    supportLink: string
    readMoreLink: string
    dataCleaningState: UITaskState
    onStartClick: React.MouseEventHandler
    onRetryClick: React.MouseEventHandler
    onCancelClick: React.MouseEventHandler
}

export default class DataCleaner extends React.PureComponent<Props> {
    private renderBtns() {
        const { dataCleaningState } = this.props

        if (dataCleaningState === 'pristine') {
            return (
                <>
                    <SecondaryAction
                        label="Cancel Migration"
                        onClick={this.props.onCancelClick}
                    />
                    <PrimaryAction
                        label="Continue Migration"
                        onClick={this.props.onStartClick}
                    />
                </>
            )
        }
        if (dataCleaningState === 'running') {
            return (
                <SecondaryAction
                    label="Cancel"
                    onClick={this.props.onCancelClick}
                />
            )
        }
        if (dataCleaningState === 'error') {
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
        return false
    }

    private renderContent() {
        const { dataCleaningState, supportLink, readMoreLink } = this.props

        if (dataCleaningState === 'pristine') {
            return (
                <>
                    <Header>Cleaning out old data</Header>
                    <Text dimmed clickable bold>
                        You've been using Memex since when we still had the
                        history full-text search.
                        <br />
                        Because of that, there is a lot of unecessary data in
                        your Memex that must be cleaned out.
                        <br />
                        <a href={readMoreLink} target="_blank">
                            Read more &gt;
                        </a>
                    </Text>
                </>
            )
        }
        if (dataCleaningState === 'running') {
            return (
                <>
                    <LoadingIndicator />
                    <Header>Cleaning out old data</Header>
                    <Text dimmed clickable bold>
                        This may take a couple of minutes. You can't use Memex
                        in the mean time.
                    </Text>
                </>
            )
        }
        if (dataCleaningState === 'error') {
            return (
                <>
                    <Icon icon="warning" height="20px" />
                    <Header>There was an error</Header>
                    <Text dimmed clickable bold>
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
