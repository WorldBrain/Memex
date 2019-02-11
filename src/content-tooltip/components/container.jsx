import React from 'react'
import PropTypes from 'prop-types'
import OnClickOutside from 'react-onclickoutside'

import Tooltip from './tooltip'
import {
    InitialComponent,
    CreatingLinkComponent,
    CopiedComponent,
    ErrorComponent,
    DoneComponent,
} from './tooltip-states'

import { conditionallyRemoveSelectOption } from '../onboarding-interactions'
import { STAGES } from 'src/overview/onboarding/constants'
import { userSelectedText } from '../../content-tooltip/interactions'
import * as Mousetrap from '../../mousetrap.min'
import { remoteFunction } from 'src/util/webextensionRPC'
import {
    highlightAnnotations,
    removeHighlights,
} from '../../sidebar-overlay/content_script/interactions'

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
        position: { x: 250, y: 200 },
        tooltipState: 'copied',
        highlightsOn: false,
    }

    componentDidMount() {
        this.props.onInit(this.showTooltip)

        const fetchAndHighlightAnnotations = async () => {
            const annotations = await remoteFunction('getAllAnnotations')(
                window.location.href,
            )
            const highlightables = annotations.filter(
                annotation => annotation.selector,
            )
            highlightAnnotations(highlightables)
        }

        const toggleHighlights = () => {
            this.state.highlightsOn
                ? removeHighlights()
                : fetchAndHighlightAnnotations()
            this.setState({ highlightsOn: !this.state.highlightsOn })
        }

        Mousetrap.bind(['r', 'h', 'a', 'l'], e => {
            if (!userSelectedText()) {
                switch (e.key) {
                    case 'r':
                        remoteFunction('toggleSidebar')()
                        break
                    case 'h':
                        toggleHighlights()
                        break
                }
            } else {
                switch (e.key) {
                    case 'l':
                        this.createLink()
                        break
                    case 'h':
                        this.props.createHighlight()
                        this.setState({
                            highlightsOn: !this.state.highlightsOn,
                        })
                        break
                    case 'a':
                        this.createAnnotation(e)
                        break
                }
            }
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
        await conditionallyRemoveSelectOption(
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
        await conditionallyRemoveSelectOption(
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

    openSettings = event => {
        event.preventDefault()
        this.props.openSettings()
    }

    renderTooltipComponent = () => {
        switch (this.state.tooltipState) {
            case 'pristine':
                return (
                    <InitialComponent
                        createLink={this.createLink}
                        createAnnotation={this.createAnnotation}
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
