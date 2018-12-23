import React, { Component } from 'react'
import { remoteFunction } from 'src/util/webextensionRPC'
import { setLocalStorage } from 'src/util/storage'

import TooltipFirstCloseNotification from './notifications/tooltip-first-close'
import RibbonFirstCloseNotification from './notifications/ribbon-first-close'
import OnboardingHighlightText from './notifications/onboarding-highlight-text'
import OnboardingSelectOption from './notifications/onboarding-select-option'
import PowerSearchBrowse from './notifications/power-search-browse'
import GoToDashboard from './notifications/go-to-dashboard'

import { STORAGE_KEY } from 'src/overview/tooltips/constants'
import { STORAGE_KEYS } from 'src/overview/onboarding/constants'

const styles = require('./styles.css')

export interface Props {
    type: string
    onCloseRequested: () => void
    [propName: string]: any
}

export class ToolbarNotification extends Component<Props> {
    /**
     * Return extra styles for the container based on whether the postion prop
     * is passed or not.
     */
    derivePositionStyles = position => {
        let positionStyles
        if (position) {
            // In the use case where the notification must be displayed in a
            // custom position
            // Styles tailored for onboarding notification
            const { x, y } = position
            positionStyles = {
                left: x - 200,
                top: y + 100,
                height: 'auto',
                width: '450px',
                'padding-top': '15px',
                position: 'absolute',
            }
        }

        return positionStyles
    }

    render() {
        const positionStyles = this.derivePositionStyles(this.props.position)
        return (
            <div className={styles.container} style={positionStyles}>
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
                {this.props.type === 'onboarding-select-option' && (
                    <OnboardingSelectOption
                        onCloseRequested={this.props.onCloseRequested}
                    />
                )}
                {this.props.type === 'power-search-browse' && (
                    <PowerSearchBrowse
                        onCloseRequested={this.props.onCloseRequested}
                        triggerNextNotification={
                            this.props.triggerNextNotification
                        }
                        openDashboard={async () => {
                            await setLocalStorage(
                                STORAGE_KEYS.onboardingDemo.step2,
                                'overview-tooltips',
                            )
                            await setLocalStorage(STORAGE_KEY, 'search-bar')
                            remoteFunction('openOptionsTab')('overview')
                        }}
                    />
                )}
            </div>
        )
    }
}

export default ToolbarNotification
