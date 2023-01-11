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
import SettingSection from '@worldbrain/memex-common/lib/common-ui/components/setting-section'

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

    private renderReadwise() {
        if (!this.props.shouldRenderEsts) {
            return
        }

        return (
            <div>
                <SettingSection
                    icon={'readwise'}
                    title={'ReadWise.io integration'}
                    description={
                        <div>
                            <span>
                                Automatically push all your highlights to
                                Readwise. Here you can get the{' '}
                                <a
                                    target="_blank"
                                    href="https://readwise.io/access_token"
                                >
                                    API key
                                </a>
                                .
                            </span>
                        </div>
                    }
                >
                    <ReadwiseSettings />
                </SettingSection>
            </div>
        )
    }

    private renderSectionIcon() {
        if (this.props.shouldRenderProgress) {
            return 'play'
        }

        if (this.props.isStopped) {
            return 'check'
        }

        if (this.props.shouldRenderEsts) {
            return 'bookmarkRibbon'
        }
    }

    private renderSectionTitle() {
        if (this.props.shouldRenderProgress) {
            return 'Import Progress'
        }

        if (this.props.isStopped) {
            return 'Import Finished'
        }

        if (this.props.shouldRenderEsts) {
            return 'Import Bookmarks from other services'
        }
    }

    private renderSectionDescription() {
        if (this.props.shouldRenderProgress) {
            return (
                <>
                    The import may freeze because of a browser setting. Go to{' '}
                    <a
                        className={localStyles.link}
                        target="_blank"
                        href="https://links.memex.garden/import_bug"
                    >
                        <b>links.memex.garden/import_bug</b>
                    </a>{' '}
                    to fix it.
                </>
            )
        }

        if (this.props.isStopped) {
            return ''
        }

        if (this.props.shouldRenderEsts) {
            return 'Import your existing bookmarks of your browser, and other services like Pocket, Pinboard, Raindrop or Diigo.'
        }
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
                <SettingSection
                    title={this.renderSectionTitle()}
                    description={this.renderSectionDescription()}
                    icon={this.renderSectionIcon()}
                >
                    <div className={localStyles.mainContainer}>
                        <div className={localStyles.importTableContainer}>
                            {children}
                            {/* {this.renderSettings()} */}
                        </div>
                        {isLoading && !allowTypes[IMPORT_TYPE.OTHERS].length && (
                            <LoadingBlocker>
                                <LoadingIndicator />
                            </LoadingBlocker>
                        )}
                    </div>
                </SettingSection>
                {this.renderReadwise()}
            </div>
        )
    }
}

export default Import

const LoadingBlocker = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 101%;
    width: 101%;
    text-align: center;
    z-index: 25000000;
    background: ${(props) => props.theme.colors.greyScale1};
`
