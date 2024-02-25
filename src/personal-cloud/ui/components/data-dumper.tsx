import React from 'react'

import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { Container, BtnBox, Header, Text } from './shared-components'
import { UIElement } from '@worldbrain/memex-common/lib/main-ui/classes'
import Logic, { Dependencies, State, Event } from './data-dumper.logic'
import type { UIServices } from 'src/services/ui/types'

export interface Props extends Dependencies {
    supportLink: string
    services: Pick<UIServices, 'overlay' | 'device' | 'logicRegistry'>
}

export default class DataDumper extends UIElement<Props, State, Event> {
    constructor(props: Props) {
        super(props, { logic: new Logic(props) })
    }

    private run = (event: keyof Event) => () => this.processEvent(event, null)

    private renderBtns() {
        const { dumpState: backupState } = this.state

        if (backupState === 'pristine') {
            return false
        }
        if (backupState === 'running') {
            return (
                <SecondaryAction
                    label="Cancel"
                    onClick={this.run('cancelDataDump')}
                />
            )
        }
        if (backupState === 'error') {
            return (
                <>
                    <SecondaryAction
                        label="Cancel"
                        onClick={this.run('cancelDataDump')}
                    />
                    <PrimaryAction
                        label="Retry"
                        onClick={this.run('retryDataDump')}
                    />
                </>
            )
        }
        return (
            <PrimaryAction
                label="Continue"
                onClick={this.run('completeDataDump')}
            />
        )
    }

    private renderContent() {
        const { dumpState: backupState } = this.state

        if (backupState === 'pristine') {
            return false
        }
        if (backupState === 'running') {
            return (
                <>
                    <LoadingIndicator />
                    <Header>Data Dump In Progress</Header>
                    <Text dimmed clickable bold>
                        This may take a couple of minutes.
                    </Text>
                </>
            )
        }
        if (backupState === 'error') {
            return (
                <>
                    <Icon icon="warning" height="20px" />
                    <Header>There was an error</Header>
                    <Text dimmed clickable bold>
                        <a href={this.props.supportLink}>Contact support</a> if
                        problem persists.
                    </Text>
                </>
            )
        }
        return (
            <>
                <Icon icon="checkRound" height="20px" />
                <Header>Data Dump Finished</Header>
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
