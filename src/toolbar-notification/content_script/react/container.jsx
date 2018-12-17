import React from 'react'
import PropTypes from 'prop-types'
import TooltipFirstCloseNotification from './notifications/tooltip-first-close'
import RibbonFirstCloseNotification from './notifications/ribbon-first-close'
import OnboardingHighlightText from './notifications/onboarding-highlight-text'
import OnboardingSelectOption from './notifications/onboarding-select-option'
import PowerSearchBrowse from './notifications/power-search-browse'

import styles from './styles.css'

export class ToolbarNotification extends React.Component {
    static propTypes = {
        type: PropTypes.string.isRequired,
        onCloseRequested: PropTypes.func.isRequired,
        position: PropTypes.object,
    }

    shutUpLinter =
        "I don't want to refactor this to a pure functional component just to shut up the linter"

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
                width: '400px',
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
                    />
                )}
            </div>
        )
    }
}

export default ToolbarNotification
