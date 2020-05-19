import React from 'react'
import onClickOutside from 'react-onclickoutside'
import { features } from 'src/util/remote-functions-background'

import Tooltip from './tooltip'
import {
    CopiedComponent,
    CreatingLinkComponent,
    DoneComponent,
    ErrorComponent,
    InitialComponent,
} from './tooltip-states'

import { conditionallyRemoveOnboardingSelectOption } from '../../onboarding-interactions'
import { STAGES } from 'src/overview/onboarding/constants'
import {
    InPageUIInterface,
    InPageUIEvents,
} from 'src/in-page-ui/shared-state/types'

interface TooltipContainerProps {
    inPageUI: InPageUIInterface
    onInit: any
    createAndCopyDirectLink: any
    createAnnotation: any
    createHighlight: any
    openSettings: any
    destroyTooltip: any
}

interface TooltipContainerState {
    showTooltip: boolean
    showCreateLink: boolean
    showingCloseMessage?: boolean
    position: { x: number; y: number } | {}
    tooltipState: 'copied' | 'running' | 'pristine' | 'done'
}

class TooltipContainer extends React.Component<
    TooltipContainerProps,
    TooltipContainerState
> {
    state: TooltipContainerState = {
        showTooltip: false,
        showCreateLink: false,
        position: { x: 250, y: 200 },
        tooltipState: 'copied',
    }

    async componentDidMount() {
        this.props.inPageUI.events.on('stateChanged', this.handleUIStateChange)
        this.props.onInit(this.showTooltip)
        this.setState({
            showCreateLink: await features.getFeature('DirectLink'),
        })
    }

    componentWillUnmount() {
        this.props.inPageUI.events.removeListener(
            'stateChanged',
            this.handleUIStateChange,
        )
    }

    handleUIStateChange: InPageUIEvents['stateChanged'] = (event) => {
        if (!('tooltip' in event.changes)) {
            return
        }

        if (!event.newState.tooltip) {
            this.setState({
                showTooltip: false,
                position: {},
            })
        }
    }

    showTooltip = (position) => {
        if (!this.state.showTooltip && this.state.tooltipState !== 'running') {
            this.setState({
                showTooltip: true,
                position,
                tooltipState: 'pristine',
            })
        }
    }

    handleClickOutside = async () => {
        this.props.inPageUI.hideTooltip()
        // Remove onboarding select option notification if it's present
        await conditionallyRemoveOnboardingSelectOption(
            STAGES.annotation.notifiedHighlightText,
        )
    }

    closeTooltip = (event, options = { disable: false }) => {
        event.preventDefault()
        event.stopPropagation()

        this.props.inPageUI.removeTooltip()
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

    createAnnotation = async (e) => {
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
                tooltipState: 'running',
            })
            this.props.inPageUI.hideTooltip()
        }, 400)
    }

    createHighlight = async (e) => {
        this.setState({ tooltipState: 'running' })
        try {
            await this.props.createHighlight()
        } catch (err) {
            // Can happen if a user accidently removes the text selection before clicking the button
        } finally {
            this.setState({ tooltipState: 'pristine' })
            this.props.inPageUI.hideTooltip()
        }
    }

    openSettings = (event) => {
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

export default onClickOutside(TooltipContainer)
