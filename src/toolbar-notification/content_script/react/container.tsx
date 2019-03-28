import React, { Component } from 'react'
import { remoteFunction } from 'src/util/webextensionRPC'

import TooltipFirstCloseNotification from './notifications/tooltip-first-close'
import RibbonFirstCloseNotification from './notifications/ribbon-first-close'
import OnboardingHighlightText from './notifications/onboarding-highlight-text'
import OnboardingSelectOption from './notifications/onboarding-select-option'
import PowerSearchBrowse from './notifications/power-search-browse'
import GoToDashboard from './notifications/go-to-dashboard'
import TagThisPage from './notifications/tag-this-page'

import { setOnboardingStage } from 'src/overview/onboarding/utils'
import { FLOWS, STAGES } from 'src/overview/onboarding/constants'
import { EVENT_NAMES } from 'src/analytics/internal/constants'

const styles = require('./styles.css')

export interface Props {
    type: string
    onCloseRequested: () => void
    [propName: string]: any
}

export class ToolbarNotification extends Component<Props> {
    openOptionsTab = remoteFunction('openOptionsTab')
    processEventRPC = remoteFunction('processEvent')
    /**
     * Return extra styles for the container based on whether the postion prop
     * is passed or not.
     */
    deriveContainerStyles = position => {
        let containerStyles
        if (position) {
            // In the use case where the notification must be displayed in a
            // custom position
            // Styles tailored for onboarding notification
            const { x, y } = position
            containerStyles = {
                opacity: 0,
                left: x - 185,
                top: '80px',
                height: 'auto',
                width: '550px',
                paddingTop: '20px',
                position: 'fixed',
                textAlign: 'center',
            }
        } else {
            containerStyles = {
                opacity: 0,
            }
        }

        return containerStyles
    }

    render() {
        const containerStyles = this.deriveContainerStyles(this.props.position)
        return (
            <div className={styles.screen}>
                <div className={styles.container} style={containerStyles}>
                    {this.props.type === 'tooltip-first-close' && (
                        <TooltipFirstCloseNotification
                            onCloseRequested={this.props.onCloseRequested}
                        />
                    )}
                    {this.props.type === 'go-to-dashboard' && (
                        <GoToDashboard
                            onCloseRequested={this.props.onCloseRequested}
                        />
                    )}
                    {this.props.type === 'tag-this-page' && (
                        <TagThisPage
                            onCloseRequested={this.props.onCloseRequested}
                        />
                    )}
                    {this.props.type === 'ribbon-first-close' && (
                        <RibbonFirstCloseNotification
                            onCloseRequested={this.props.onCloseRequested}
                        />
                    )}
                    {this.props.type === 'onboarding-higlight-text' && (
                        <OnboardingHighlightText
                            onCloseRequested={this.props.onCloseRequested}
                        />
                    )}
                    {this.props.type === 'power-search-browse' && (
                        <PowerSearchBrowse
                            onCloseRequested={() => {
                                this.props.onCloseRequested()
                                this.props.triggerNextNotification()
                            }}
                            openDashboard={async () => {
                                this.processEventRPC({
                                    type: EVENT_NAMES.POWERSEARCH_GOTO_DASH,
                                })
                                await setOnboardingStage(
                                    FLOWS.powerSearch,
                                    STAGES.powerSearch.overviewTooltips,
                                )
                                this.openOptionsTab('overview')
                            }}
                        />
                    )}
                </div>
            </div>
        )
    }
}

export default ToolbarNotification
