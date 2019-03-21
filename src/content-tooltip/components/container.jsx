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
import { userSelectedText } from '../interactions'
import * as Mousetrap from 'mousetrap'
import { remoteFunction } from 'src/util/webextensionRPC'
import {
    highlightAnnotations,
    removeHighlights,
} from '../../sidebar-overlay/content_script/highlight-interactions'
import {
    getKeyboardShortcutsState,
    convertKeyboardEventToKeyString,
} from '../utils'

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

        const shortcutsState = await getKeyboardShortcutsState()
        const {
            shortcutsEnabled,
            highlightShortcut,
            linkShortcut,
            toggleSidebarShortcut,
            toggleHighlightsShortcut,
            createAnnotationShortcut,
        } = shortcutsState

        if (shortcutsEnabled) {
            Mousetrap.bind(
                [
                    highlightShortcut,
                    linkShortcut,
                    toggleHighlightsShortcut,
                    createAnnotationShortcut,
                    toggleSidebarShortcut,
                ],
                this.initHandleKeyboardShortcuts(shortcutsState),
            )
        }
    }

    initHandleKeyboardShortcuts = settingsState => async e => {
        const {
            highlightShortcut,
            linkShortcut,
            toggleSidebarShortcut,
            toggleHighlightsShortcut,
            createAnnotationShortcut,
            highlightShortcutEnabled,
            linkShortcutEnabled,
            toggleSidebarShortcutEnabled,
            toggleHighlightsShortcutEnabled,
            createAnnotationShortcutEnabled,
        } = settingsState
        if (!userSelectedText()) {
            switch (convertKeyboardEventToKeyString(e)) {
                case toggleSidebarShortcut:
                    toggleSidebarShortcutEnabled &&
                        (await remoteFunction('toggleSidebarOverlay')())
                    break
                case toggleHighlightsShortcut:
                    toggleHighlightsShortcutEnabled && this.toggleHighlights()
                    break
            }
        } else {
            switch (convertKeyboardEventToKeyString(e)) {
                case linkShortcut:
                    linkShortcutEnabled && (await this.createLink())
                    break
                case highlightShortcut:
                    if (highlightShortcutEnabled) {
                        this.props.createHighlight()
                        this.setState({
                            highlightsOn: true,
                        })
                    }
                    break
                case createAnnotationShortcut:
                    createAnnotationShortcutEnabled &&
                        (await this.createAnnotation(e))
                    break
            }
        }
    }

    fetchAndHighlightAnnotations = async () => {
        const annotations = await remoteFunction('getAllAnnotationsByUrl')({
            url: window.location.href,
        })
        const highlightables = annotations.filter(
            annotation => annotation.selector,
        )
        highlightAnnotations(highlightables)
    }

    toggleHighlights = () => {
        this.state.highlightsOn
            ? removeHighlights()
            : this.fetchAndHighlightAnnotations()
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
