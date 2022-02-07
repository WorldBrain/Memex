import React from 'react'
import { UIElement } from '@worldbrain/memex-common/lib/main-ui/classes'
import Overlay from '@worldbrain/memex-common/lib/main-ui/containers/overlay'

import CloudOnboardingModalLogic from './logic'
import type { Dependencies, State, Event } from './types'
import type { UIServices } from 'src/services/ui/types'
import DataMigrator from '../components/data-migrator'
import DataCleaner from '../components/data-cleaner'
import DataDumper from '../components/data-dumper'
import {
    Text,
    Header,
    BtnBox,
    Container,
} from '../components/shared-components'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SUPPORT_EMAIL } from 'src/constants'
import checkBrowser from 'src/util/check-browser'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

export interface Props extends Dependencies {
    supportLink: string
    dataCleanReadMoreLink: string
    services: Pick<UIServices, 'overlay' | 'device' | 'logicRegistry'>
}

export default class CloudOnboardingModal extends UIElement<
    Props,
    State,
    Event
> {
    static defaultProps: Pick<
        Props,
        'supportLink' | 'dataCleanReadMoreLink' | 'browser'
    > = {
        supportLink: 'mailto:' + SUPPORT_EMAIL,
        browser: checkBrowser(),
        dataCleanReadMoreLink:
            'https://worldbrain.notion.site/Cleaning-out-unnecessary-data-before-Migration-69f82d016898405e9586714445e38ff4',
    }

    constructor(props: Props) {
        super(props, { logic: new CloudOnboardingModalLogic(props) })
    }

    private renderDataDumper() {
        if (!this.state.giveControlToDumper) {
            return (
                <SectionContainer>
                    <SectionCircle>
                        <Icon
                            filePath={icons.backup}
                            heightAndWidth="24px"
                            color="purple"
                            hoverOff
                        />
                    </SectionCircle>
                    <SectionTitle>
                        Locally back up your data before starting the migration
                    </SectionTitle>
                    <InfoText>
                        Create a backup dump of your data before starting the
                        sync.
                    </InfoText>
                    <BtnBox>
                        <SecondaryAction
                            label="Backup existing data"
                            onClick={() =>
                                this.processEvent('startDataDump', null)
                            }
                        />
                        <PrimaryAction
                            label="Continue migration"
                            onClick={() =>
                                this.processEvent('continueToMigration', null)
                            }
                        />
                    </BtnBox>
                </SectionContainer>
            )
        }

        return (
            <DataDumper
                {...this.props}
                onCancel={() => this.processEvent('cancelDataDump', null)}
                onComplete={() =>
                    this.processEvent('continueToMigration', null)
                }
            />
        )
    }

    private renderModalContent() {
        if (this.state.stage === 'data-dump') {
            return this.renderDataDumper()
        }
        if (this.state.stage === 'data-clean') {
            return (
                <DataCleaner
                    supportLink={this.props.supportLink}
                    readMoreLink={this.props.dataCleanReadMoreLink}
                    dataCleaningState={this.state.dataCleaningState}
                    onStartClick={() =>
                        this.processEvent('startDataClean', null)
                    }
                    onRetryClick={() =>
                        this.processEvent('retryDataClean', null)
                    }
                    onCancelClick={() =>
                        this.processEvent('cancelDataClean', null)
                    }
                />
            )
        }
        if (this.state.stage === 'old-version-backup') {
            return (
                <SectionContainer>
                    <SectionCircle>
                        <Icon
                            filePath={icons.backup}
                            heightAndWidth="24px"
                            color="purple"
                            hoverOff
                        />
                    </SectionCircle>
                    <SectionTitle>
                        Create backup to migrate to offline-only version
                    </SectionTitle>
                    <InfoText>
                        <strong>Important:</strong>
                        <br />
                        Memex last version (
                        <a
                            target="_blank"
                            href="https://worldbrain.io/downloads/offline-only-2-20-0"
                        >
                            2.20.0
                        </a>
                        ) is made available for users who really want to keep
                        using an offline-only product. Be aware that development
                        on this version is discontinued and will not have mobile
                        sync.
                        <br />
                        Backup your data, install 2.20.0 and then restore your
                        data there.
                    </InfoText>
                    <BtnBox>
                        <SecondaryAction
                            label="Go Back"
                            onClick={() =>
                                this.processEvent(
                                    'cancelMigrateToOldVersion',
                                    null,
                                )
                            }
                        />
                        <PrimaryAction
                            label="Continue to Backup"
                            onClick={() =>
                                this.processEvent('goToBackupRoute', null)
                            }
                        />
                    </BtnBox>
                </SectionContainer>
            )
        }
        return (
            <DataMigrator
                supportLink={this.props.supportLink}
                migrationState={this.state.migrationState}
                isPrepping={!this.state.isMigrationPrepped}
                onRetryClick={() => this.processEvent('retryMigration', null)}
                onCloseClick={() => this.processEvent('closeMigration', null)}
                onCancelClick={() => this.processEvent('cancelMigration', null)}
            />
        )
    }

    render() {
        return (
            <Overlay
                services={this.props.services}
                onCloseRequested={() =>
                    this.processEvent('attemptModalClose', null)
                }
            >
                {this.renderModalContent()}
            </Overlay>
        )
    }
}

const SectionContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    grid-gap: 10px;
    padding: 50px;
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: 60px;
    width: 60px;
    margin-bottom: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 20px;
    font-weight: bold;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    margin-bottom: 40px;
    font-weight: 500;
`
