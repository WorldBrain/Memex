import React from 'react'
import PropTypes from 'prop-types'
import OnClickOutside from 'react-onclickoutside'
import { features } from 'src/util/remote-functions-background'

import Tooltip from './tooltip'
import {
    CopiedComponent,
    CreatingLinkComponent,
    DoneComponent,
    ErrorComponent,
    InitialComponent,
} from './tooltip-states'

import { conditionallyRemoveOnboardingSelectOption } from '../onboarding-interactions'
import { STAGES } from 'src/overview/onboarding/constants'

class TooltipContainer extends React.Component {
    static propTypes = {
        onInit: PropTypes.func.isRequired,
        createAndCopyDirectLink: PropTypes.func.isRequired,
        createAnnotation: PropTypes.func.isRequired,
        createHighlight: PropTypes.func.isRequired,
        openSettings: PropTypes.func.isRequired,
        destroy: PropTypes.func.isRequired,
    }

    state = {
        showTooltip: false,
        showCreateLink: false,
        position: { x: 250, y: 200 },
        tooltipState: 'copied',
    }

    async componentDidMount() {
        this.props.onInit(this.showTooltip)
        this.setState({
            showCreateLink: await features.getFeature('DirectLink'),
        })
    }

    showTooltip = position => {
        if (!this.state.showTooltip && this.state.tooltipState !== 'running') {
            this.setState({
                showTooltip: true,
                position,
                tooltipState: 'pristine',
            })
        }
    }

    handleClickOutside = async () => {
        this.setState({
            showTooltip: false,
            position: {},
        })
        // Remove onboarding select option notification if it's present
        await conditionallyRemoveOnboardingSelectOption(
            STAGES.annotation.notifiedHighlightText,
        )
    }

    closeTooltip = (event, options = { disable: false }) => {
        event.preventDefault()
        event.stopPropagation()

        this.props.destroy()
    }

    showCloseMessage() {
        this.setState({ showingCloseMessage: true })
    }

    createLink = async () => {
        this.setState({
            tooltipState: 'running',
        })
        await this.props.createAndCopyDirectLink()
        this.setState({
            tooltipState: 'copied',
        })
    }

    createAnnotation = async e => {
        e.preventDefault()
        e.stopPropagation()
        await this.props.createAnnotation()

        // Remove onboarding select option notification if it's present
        await conditionallyRemoveOnboardingSelectOption(
            STAGES.annotation.annotationCreated,
        )

        // quick hack, to prevent the tooltip from popping again
        setTimeout(() => {
            this.setState({
                tooltipState: 'runnning',
                showTooltip: false,
                position: {},
            })
        }, 400)
    }
    createHighlight = async e => {
        this.setState({
            tooltipState: 'running',
        })
        await this.props.createHighlight()
        this.setState({
            showTooltip: false,
            tooltipState: 'pristine',
        })
    }

    openSettings = event => {
        event.preventDefault()
        this.props.openSettings()
    }

    renderTooltipComponent = () => {
        switch (this.state.tooltipState) {
            case 'pristine':
                return (
                    <InitialComponent
                        createLink={
                            this.state.showCreateLink
                                ? this.createLink
                                : undefined
                        }
                        createHighlight={this.createHighlight}
                        createAnnotation={this.createAnnotation}
                        closeTooltip={this.closeTooltip}
                        state={this.state.tooltipState}
                    />
                )
            case 'running':
                return <CreatingLinkComponent />
            case 'copied':
                return <CopiedComponent />
            case 'done':
                return <DoneComponent />
            default:
                return <ErrorComponent />
        }
    }

    render() {
        const { showTooltip, position, tooltipState } = this.state

        return (
            <div className="memex-tooltip-container">
                {showTooltip ? (
                    <Tooltip
                        {...position}
                        state={tooltipState}
                        tooltipComponent={this.renderTooltipComponent()}
                        closeTooltip={this.closeTooltip}
                        openSettings={this.openSettings}
                    />
                ) : null}
            </div>
        )
    }
}

export default OnClickOutside(TooltipContainer)
