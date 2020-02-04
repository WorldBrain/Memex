import React from 'react'
import PropTypes from 'prop-types'
import OnClickOutside from 'react-onclickoutside'

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
// import { userSelectedText } from '../interactions'
// import * as Mousetrap from 'mousetrap'
import { removeHighlights } from '../../highlighting/ui/highlight-interactions'
import {
    // convertKeyboardEventToKeyString,
    getHighlightsState,
    // getKeyboardShortcutsState,
} from '../utils'
import { fetchAnnotationsAndHighlight } from '../../annotations'
// import { toggleSidebarOverlay } from '../../sidebar-overlay/utils'

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

    async componentDidMount() {
        this.props.onInit(this.showTooltip)

        // Highlights state is coupled to whether or not the tooltip is enabled
        const highlightsOn = await getHighlightsState()
        this.setState(() => ({ highlightsOn }))

        // const {
        //     shortcutsEnabled,
        //     ...shortcuts
        // } = await getKeyboardShortcutsState()
        //
        // if (shortcutsEnabled) {
        //     Mousetrap.bind(
        //         Object.values(shortcuts).map(val => val.shortcut),
        //         this.initHandleKeyboardShortcuts(shortcuts),
        //     )
        // }
    }

    /*
initHandleKeyboardShortcuts = ({
        addComment,
        addTag,
        addToCollection,
        createAnnotation,
        createHighlight,
        createBookmark,
        link,
        toggleHighlights,
        toggleSidebar,
    }) => async e => {
        if (!userSelectedText()) {
            switch (convertKeyboardEventToKeyString(e)) {
                case toggleSidebar.shortcut:
                    toggleSidebar.enabled &&
                        toggleSidebarOverlay({
                            override: true,
                            openSidebar: true,
                        })
                    break
                case toggleHighlights.shortcut:
                    toggleHighlights.enabled && this.toggleHighlightsAct()
                    break
                case addTag.shortcut:
                    addTag.enabled &&
                        toggleSidebarOverlay({
                            override: true,
                            openToTags: true,
                        })
                    break
                case addToCollection.shortcut:
                    addToCollection.enabled &&
                        toggleSidebarOverlay({
                            override: true,
                            openToCollections: true,
                        })
                    break
                case addComment.shortcut:
                    addComment.enabled &&
                        toggleSidebarOverlay({
                            override: true,
                            openToComment: true,
                        })
                    break
                case createBookmark.shortcut:
                    createBookmark.enabled &&
                        toggleSidebarOverlay({
                            override: true,
                            openToBookmark: true,
                        })
                    break
                default:
            }
        } else {
            switch (convertKeyboardEventToKeyString(e)) {
                case link.shortcut:
                    link.enabled && (await this.createLink())
                    break
                case createHighlight.shortcut:
                    createHighlight.enabled && (await this.createHighlight(e))
                    break
                case createAnnotation.shortcut:
                    createAnnotation.enabled && (await this.createAnnotation(e))
                    break
                default:
            }
        }
    }
    */

    toggleHighlightsAct = () => {
        this.state.highlightsOn
            ? removeHighlights()
            : fetchAnnotationsAndHighlight()
        this.setState({ highlightsOn: !this.state.highlightsOn })
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
        await this.props.createAnnotation(document.getSelection())

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
        await this.props.createHighlight(document.getSelection())
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
                        createLink={this.createLink}
                        createHighlight={this.createHighlight}
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
