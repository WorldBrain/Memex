import React from 'react'

import AdvSettings from './AdvSettingsContainer'
import { IMPORT_TYPE } from '../constants'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import ReadwiseSettings from 'src/readwise-integration/ui/containers/readwise-settings'
import { remoteFunctions } from 'src/util/remote-functions-background'
import { runInBackground } from 'src/util/webextensionRPC'
import { ReadwiseInterface } from 'src/readwise-integration/background/types/remote-interface'
import * as icons from 'src/common-ui/components/design-library/icons'

import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import styled from 'styled-components'

const settingsStyle = require('src/options/settings/components/settings.css')
const localStyles = require('./Import.css')

interface Props {
    isLoading: boolean
    loadingMsg?: string
    isStopped: boolean
    shouldRenderEsts: boolean
    shouldRenderProgress: boolean
    allowTypes: any
}

const Warning = ({ children }) => (
    <div className={localStyles.warning}>
        <img src="/img/caution.png" className={localStyles.icon} />{' '}
        <p className={localStyles.warningText}>{children}</p>
    </div>
)

class Import extends React.PureComponent<Props> {
    // private renderSettings() {
    //     if (!this.props.shouldRenderEsts) {
    //         return
    //     }

    //     return <AdvSettings />
    // }

    private renderEstimates() {
        if (!this.props.shouldRenderEsts) {
            return
        }

        return (
            <div>
                <SectionCircle>
                    <Icon
                        filePath={icons.bookmarkRibbon}
                        heightAndWidth="34px"
                        color="purple"
                        hoverOff
                    />
                </SectionCircle>
                <SectionTitle>
                    Import Bookmarks from other services
                </SectionTitle>
                <InfoText>
                    Import your existing bookmarks of your browser, and other
                    services like Pocket, Pinboard, Raindrop or Diigo.
                </InfoText>
            </div>
        )
    }

    private renderReadwise() {
        if (!this.props.shouldRenderEsts) {
            return
        }

        return (
            <div>
                <Section>
                    <SectionCircle>
                        <Icon
                            filePath={icons.readwise}
                            heightAndWidth="45px"
                            color="purple"
                            hoverOff
                        />
                    </SectionCircle>
                    <SectionTitle>ReadWise.io integration</SectionTitle>
                    <ReadwiseSettings />
                </Section>
            </div>
        )
    }

    private renderProgress() {
        if (!this.props.shouldRenderProgress) {
            return
        }

        return (
            <div>
                <SectionCircle>
                    <Icon
                        filePath={icons.play}
                        heightAndWidth="34px"
                        color="purple"
                        hoverOff
                    />
                </SectionCircle>
                <SectionTitle>Import Progress</SectionTitle>
                <InfoText>
                    The import may freeze because of a browser setting. Go to{' '}
                    <a
                        className={localStyles.link}
                        target="_blank"
                        href="https://links.memex.garden/import_bug"
                    >
                        <b>links.memex.garden/import_bug</b>
                    </a>{' '}
                    to fix it.
                </InfoText>
            </div>
        )
    }

    render() {
        const {
            isLoading,
            loadingMsg,
            isStopped,
            children,
            allowTypes,
        } = this.props

        return (
            <div>
                <Section>
                    {this.renderEstimates()}
                    {this.renderProgress()}
                    {isStopped && (
                        <>
                            <SectionCircle>
                                <Icon
                                    filePath={icons.check}
                                    heightAndWidth="34px"
                                    color="purple"
                                    hoverOff
                                />
                            </SectionCircle>
                            <SectionTitle>Import Finished</SectionTitle>
                        </>
                    )}
                    <div className={localStyles.mainContainer}>
                        <div className={localStyles.importTableContainer}>
                            {children}
                            {/* {this.renderSettings()} */}
                        </div>
                        {isLoading && !allowTypes[IMPORT_TYPE.OTHERS].length && (
                            <div className={localStyles.loadingBlocker}>
                                <LoadingIndicator />
                            </div>
                        )}
                    </div>
                </Section>
                {this.renderReadwise()}
            </div>
        )
    }
}

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

export default Import
