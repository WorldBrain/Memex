import React from 'react'

import Tooltip from './tooltip'
import {
    // CopiedComponent,
    // CreatingLinkComponent,
    // DoneComponent,
    // ErrorComponent,
    InitialComponent,
} from './tooltip-states'

import { conditionallyRemoveOnboardingSelectOption } from '../../onboarding-interactions'
import { STAGES } from 'src/overview/onboarding/constants'
import { SharedInPageUIEvents } from 'src/in-page-ui/shared-state/types'
import type {
    TooltipInPageUIInterface,
    AnnotationFunctions,
} from 'src/in-page-ui/tooltip/types'
import { ClickAway } from '@worldbrain/memex-common/lib/common-ui/components/click-away-wrapper'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import type { Shortcut } from 'src/in-page-ui/keyboard-shortcuts/types'
import AIInterfaceForTooltip from './aIinterfaceComponent'
import { SummarizationInterface } from 'src/summarization-llm/background'

export interface Props extends AnnotationFunctions {
    inPageUI: TooltipInPageUIInterface
    summarizeBG: SummarizationInterface
    onInit: any
    destroyTooltip: any
}

interface TooltipContainerState {
    showTooltip: boolean
    showingCloseMessage?: boolean
    position: { x: number; y: number } | {}
    tooltipState: 'copied' | 'running' | 'pristine' | 'done' | 'AIinterface'
    keyboardShortCuts: {}
    highlightText: string
    removeAfterUse: boolean
}

async function getShortCut(name: string) {
    let keyboardShortcuts = await getKeyboardShortcutsState()
    const short: Shortcut = keyboardShortcuts[name]

    let shortcut = short.shortcut.split('+')

    return shortcut
}

class TooltipContainer extends React.Component<Props, TooltipContainerState> {
    state: TooltipContainerState = {
        showTooltip: false,
        position: { x: 250, y: 200 },
        tooltipState: 'copied',
        keyboardShortCuts: undefined,
        highlightText: '',
        removeAfterUse: false,
    }

    async componentDidMount() {
        this.props.inPageUI.events?.on('stateChanged', this.handleUIStateChange)
        this.props.onInit(this.showTooltip)
        this.setState({
            keyboardShortCuts: {
                createHighlight: await getShortCut('createHighlight'),
                createAnnotation: await getShortCut('createAnnotation'),
                createAnnotationWithSpace: await getShortCut('addToCollection'),
            },
        })
    }

    componentWillUnmount() {
        this.props.inPageUI.events?.removeListener(
            'stateChanged',
            this.handleUIStateChange,
        )
    }

    handleUIStateChange: SharedInPageUIEvents['stateChanged'] = (event) => {
        if (!('tooltip' in event.changes)) {
            return
        }

        if (event.changes.tooltip != null) {
            if (event.mode === 'AImode') {
                this.setState({
                    highlightText: window.getSelection().toString() ?? '',
                })
                let newPositionX = window.innerWidth / 2
                let newPositionY = window.innerHeight / 2 - 300
                this.setState({
                    showTooltip: true,
                    tooltipState: 'AIinterface',
                    position: { x: newPositionX, y: newPositionY },
                    removeAfterUse: !event.changes.tooltip ? true : false,
                })
            }
        }

        if (!event.newState.tooltip && event.mode == null) {
            this.setState({
                showTooltip: false,
                position: {},
            })
        }
    }

    showTooltip = (position) => {
        this.setState({ highlightText: window.getSelection().toString() ?? '' })
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

    private createAnnotation: React.MouseEventHandler = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            await this.props.createAnnotation(e.shiftKey)
            // Remove onboarding select option notification if it's present
            await conditionallyRemoveOnboardingSelectOption(
                STAGES.annotation.annotationCreated,
            )
        } catch (err) {
            throw err
        } finally {
            window.getSelection().empty()
            // this.setState({ tooltipState: 'pristine' })
            this.props.inPageUI.hideTooltip()
        }
    }

    private createHighlight: React.MouseEventHandler = async (e) => {
        // this.setState({ tooltipState: 'running' })
        try {
            await this.props.createHighlight(e.shiftKey)
        } catch (err) {
            throw err
        } finally {
            window.getSelection().empty()
            // this.setState({ tooltipState: 'pristine' })
            this.props.inPageUI.hideTooltip()
        }
    }

    private addtoSpace: React.MouseEventHandler = async (e) => {
        try {
            await this.props.createAnnotation(false, true)
        } catch (err) {
            throw err
        } finally {
            // this.setState({ tooltipState: 'pristine' })
            window.getSelection().empty()
            this.props.inPageUI.hideTooltip()
        }
    }
    private openAIinterface: React.MouseEventHandler = async (e) => {
        let newPositionX = window.innerWidth / 2
        let newPositionY = window.innerHeight / 2 - 300

        this.setState({
            tooltipState: 'AIinterface',
            position: { x: newPositionX, y: newPositionY },
        })
        // this.props.inPageUI.hideTooltip()
        try {
            // await this.props.createAnnotation(false, true)
        } catch (err) {
            throw err
        } finally {
            // // this.setState({ tooltipState: 'pristine' })
            // window.getSelection().empty()
            // this.props.inPageUI.hideTooltip()
        }
    }

    renderTooltipComponent = () => {
        switch (this.state.tooltipState) {
            case 'pristine':
                if (this.state.keyboardShortCuts != null) {
                    return (
                        <InitialComponent
                            createHighlight={this.createHighlight}
                            createAnnotation={this.createAnnotation}
                            addtoSpace={this.addtoSpace}
                            openAIinterface={this.openAIinterface}
                            closeTooltip={this.closeTooltip}
                            state={this.state.tooltipState}
                            keyboardShortCuts={this.state.keyboardShortCuts}
                        />
                    )
                } else {
                    return undefined
                }
            case 'AIinterface':
                return (
                    <AIInterfaceForTooltip
                        sendAIprompt={async (prompt) => {
                            const response = await this.props.summarizeBG.getTextSummary(
                                this.state.highlightText.replace(
                                    /[^\w\s.?!]/g,
                                    ' ',
                                ),
                                prompt,
                            )
                            return response
                        }}
                        highlightText={this.state.highlightText}
                    />
                )
            // case 'running':
            //     return <CreatingLinkComponent />
            // case 'copied':
            //     return <CopiedComponent />
            // case 'done':
            //     return <DoneComponent />
            // default:
            //     return <ErrorComponent />
        }
    }

    render() {
        const { showTooltip, position, tooltipState } = this.state
        return (
            <div className="memex-tooltip-container">
                {showTooltip ? (
                    <ClickAway
                        onClickAway={() => {
                            this.state.removeAfterUse
                                ? this.props.inPageUI.removeTooltip()
                                : this.props.inPageUI.hideTooltip()
                        }}
                    >
                        <Tooltip
                            {...position}
                            state={tooltipState}
                            tooltipComponent={this.renderTooltipComponent()}
                        />
                    </ClickAway>
                ) : null}
            </div>
        )
    }
}

export default TooltipContainer
