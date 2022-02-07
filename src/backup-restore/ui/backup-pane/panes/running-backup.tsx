import React from 'react'
import RunningProcess from './running-process'
import { WhiteSpacer30 } from 'src/common-ui/components/design-library/typography'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

const settingsStyle = require('src/options/settings/components/settings.css')
const STYLES = require('../../styles.css')

export default function RunningBackup({ onFinish }: { onFinish: () => void }) {
    return (
        <RunningProcess
            functionNames={{
                info: 'getBackupInfo',
                start: 'startBackup',
                cancel: 'cancelBackup',
                pause: 'pauseBackup',
                resume: 'resumeBackup',
                sendNotif: 'sendNotification',
            }}
            eventMessageName="backup-event"
            preparingStepLabel="Preparing uploads"
            synchingStepLabel="Uploading your Memex backup"
            renderHeader={renderHeader}
            renderFailMessage={renderFailMessage}
            renderSuccessMessage={renderSuccessMessage}
            onFinish={onFinish}
        />
    )
}

function renderHeader() {
    return (
        <>
            <SectionCircle>
                <Icon
                    filePath={icons.play}
                    heightAndWidth="34px"
                    color="purple"
                    hoverOff
                />
            </SectionCircle>
            <SectionTitle>Backup in Progress</SectionTitle>
            <InfoText>
                With a lot of data ({'>'} 25.000 pages) it is recommended
                running this over night.
            </InfoText>
        </>
    )
}

function renderFailMessage(errorId: string) {
    return (
        <HeaderContainer>
            <SectionCircle>
                <Icon
                    filePath={icons.warning}
                    heightAndWidth="34px"
                    color="purple"
                    hoverOff
                />
            </SectionCircle>
            <SectionTitle>Backup Failed</SectionTitle>
            <InfoText>
                There has been an issue with your backup process. <br />
                Try again, and if the problem persists, please{' '}
                <a href="mailto:support@memex.garden">contact support</a>.
            </InfoText>
        </HeaderContainer>
    )
}

function renderSuccessMessage() {
    return (
        <HeaderContainer>
            <SectionCircle>
                <Icon
                    filePath={icons.check}
                    heightAndWidth="34px"
                    color="purple"
                    hoverOff
                />
            </SectionCircle>
            <SectionTitle>Backup Successful! 🎉</SectionTitle>
        </HeaderContainer>
    )
}

const HeaderContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
`

const Section = styled.div`
    background: #ffffff;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    padding: 50px;
    margin-bottom: 30px;
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: 80px;
    width: 80px;
    margin-bottom: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
`

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
    font-weight: 500;
`
