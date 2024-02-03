import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { getHTML5VideoTimestamp } from '@worldbrain/memex-common/lib/editor/utils'
import React, { Component } from 'react'
import { sleepPromise } from 'src/util/promises'
import styled from 'styled-components'

interface Props {
    runtime: any
    annotationsFunctions: any
    getRootElement: (() => HTMLElement) | null
}

interface State {
    YTChapterContainerVisible: boolean
    existingMemexButtons: boolean
    smartNoteSeconds: string
    noteSeconds: string
}

export default class YoutubeButtonMenu extends React.Component<Props, State> {
    memexButtonContainerRef = React.createRef<HTMLDivElement>()
    parentContainerRef = React.createRef<HTMLDivElement>() // Assuming you have a ref to the parent container

    constructor(props) {
        super(props)
        this.state = {
            YTChapterContainerVisible: false,
            existingMemexButtons: false,
            smartNoteSeconds: '',
            noteSeconds: '',
        }
    }

    async componentDidMount() {
        // Logic to check for YTChapterContainer and existingMemexButtons
        // Logic to retrieve smartNoteSeconds and noteSeconds from storage
        this.adjustScaleToFitParent()
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                this.adjustScaleToFitParent()
            }
        })
        if (this.parentContainerRef.current) {
            resizeObserver.observe(this.parentContainerRef.current)
        }

        await sleepPromise(1000)
        this.adjustScaleToFitParent()
    }

    adjustScaleToFitParent = async () => {
        if (
            !this.memexButtonContainerRef.current ||
            !this.parentContainerRef.current
        ) {
            return
        }
        const parentWidth = this.parentContainerRef.current.offsetWidth
        const childWidth = this.memexButtonContainerRef.current.offsetWidth
        let scaleFactor = parentWidth / childWidth

        if (scaleFactor > 1.2) {
            scaleFactor = 1.2
        }
        this.memexButtonContainerRef.current.style.transform = `scale(${scaleFactor})`
        this.memexButtonContainerRef.current.style.transformOrigin = 'left top'

        this.parentContainerRef.current.style.height =
            this.memexButtonContainerRef.current.offsetHeight * scaleFactor +
            'px'
    }

    getTimestampNoteContentForYoutubeNotes(includeLastFewSecs?: number) {
        let videoTimeStampForComment: string | null

        const [videoURLWithTime, humanTimestamp] = getHTML5VideoTimestamp(
            includeLastFewSecs ?? 0,
        )

        if (videoURLWithTime != null) {
            videoTimeStampForComment = `[${humanTimestamp}](${videoURLWithTime})`

            return videoTimeStampForComment
        } else {
            return null
        }
    }

    handleScreenshotButtonClick = async () => {
        // Logic for screenshot button click
        await this.props.annotationsFunctions.createTimestampWithScreenshot()
    }

    handleAnnotateButtonClick = async () => {
        // Logic for annotate button click

        const includeLastFewSecs = this.state.noteSeconds
            ? parseInt(this.state.noteSeconds)
            : 0
        await globalThis['browser'].storage.local.set({
            ['noteSecondsStorage']: includeLastFewSecs,
        })

        console.log(
            'createAnnotation',
            this.getTimestampNoteContentForYoutubeNotes(includeLastFewSecs),
        )
        this.props.annotationsFunctions.createAnnotation()(
            false,
            false,
            false,
            false,
            this.getTimestampNoteContentForYoutubeNotes(includeLastFewSecs),
        )
    }

    handleSummarizeButtonClick = () => {
        // Logic for summarize button click
        this.props.annotationsFunctions.askAI()(false, false)
    }

    handleAItimeStampButtonClick = async () => {
        const includeLastFewSecs = this.state.smartNoteSeconds
            ? parseInt(this.state.smartNoteSeconds)
            : 60
        await globalThis['browser'].storage.local.set({
            ['smartNoteSecondsStorage']: includeLastFewSecs,
        })

        this.props.annotationsFunctions.createTimestampWithAISummary(
            includeLastFewSecs,
        )(
            false,
            false,
            false,
            false,
            this.getTimestampNoteContentForYoutubeNotes(includeLastFewSecs),
        )
    }

    handleSmartNoteTimeInput = (event) => {
        if (isNaN(event.target.value)) {
            return
        }
        // Logic for text field input
        this.setState({ smartNoteSeconds: event.target.value })
    }

    handleTimestampNoteTimeInput = (event) => {
        if (isNaN(event.target.value)) {
            return
        }
        // Logic for text field input
        this.setState({ noteSeconds: event.target.value })
    }

    render() {
        const { runtime } = this.props

        return (
            <ParentContainer ref={this.parentContainerRef}>
                <MemexButtonContainer
                    id={'MemexButtonContainer'}
                    ref={this.memexButtonContainerRef}
                >
                    {this.state.YTChapterContainerVisible && (
                        <YTChapterContainer />
                    )}
                    <Icon
                        filePath={runtime.getURL('/img/memexLogo.svg')}
                        height={'24px'}
                        color={'prime1'}
                        padding={'0 10px'}
                        hoverOff
                    />
                    <TooltipBox
                        getPortalRoot={this.props.getRootElement}
                        tooltipText={
                            <span>
                                Add a note with a link to the current time.{' '}
                                <br />
                                Optionally: Adjust seconds into past via the
                                text field
                            </span>
                        }
                        placement="bottom"
                    >
                        <YTPMenuItem onClick={this.handleAnnotateButtonClick}>
                            <Icon
                                filePath={runtime.getURL(
                                    '/img/clockForYoutubeInjection.svg',
                                )}
                                heightAndWidth="20px"
                                color={'greyScale6'}
                                hoverOff
                            />
                            <YTPMenuItemLabel>
                                Timestamped Note
                            </YTPMenuItemLabel>
                            <TextFieldContainer>
                                <Icon
                                    filePath={runtime.getURL(
                                        '/img/historyYoutubeInjection.svg',
                                    )}
                                    heightAndWidth="16px"
                                    color={'greyScale5'}
                                    hoverOff
                                />
                                <TextField
                                    type="text"
                                    placeholder="0s"
                                    value={this.state.noteSeconds}
                                    onChange={this.handleTimestampNoteTimeInput}
                                    id="secondsInPastFieldNote"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            this.handleAnnotateButtonClick()
                                        }
                                    }}
                                />
                            </TextFieldContainer>
                        </YTPMenuItem>
                    </TooltipBox>
                    <TooltipBox
                        getPortalRoot={this.props.getRootElement}
                        tooltipText={
                            <span>
                                Summarize this video
                                <br />
                                with custom prompts
                            </span>
                        }
                        placement="bottom"
                    >
                        <YTPMenuItem onClick={this.handleSummarizeButtonClick}>
                            <Icon
                                filePath={runtime.getURL(
                                    '/img/summarizeIconForYoutubeInjection.svg',
                                )}
                                heightAndWidth="20px"
                                color={'greyScale6'}
                                hoverOff
                            />
                            <YTPMenuItemLabel>Summarize Video</YTPMenuItemLabel>
                        </YTPMenuItem>
                    </TooltipBox>
                    <TooltipBox
                        getPortalRoot={this.props.getRootElement}
                        tooltipText={
                            <span>
                                Summary of the last X seconds with a timestamp.{' '}
                                <br />
                                Optionally: Adjust seconds into past via the
                                text field.
                            </span>
                        }
                        placement="bottom"
                    >
                        <YTPMenuItem
                            onClick={this.handleAItimeStampButtonClick}
                        >
                            <Icon
                                filePath={runtime.getURL(
                                    '/img/starsYoutube.svg',
                                )}
                                heightAndWidth="20px"
                                color={'greyScale6'}
                                hoverOff
                            />
                            <YTPMenuItemLabel>AI Note</YTPMenuItemLabel>

                            <TextFieldContainer>
                                <Icon
                                    filePath={runtime.getURL(
                                        '/img/historyYoutubeInjection.svg',
                                    )}
                                    heightAndWidth="16px"
                                    color={'greyScale5'}
                                />
                                <TextField
                                    type="text"
                                    placeholder="60s"
                                    value={this.state.smartNoteSeconds}
                                    onChange={this.handleSmartNoteTimeInput}
                                    id="secondsInPastSetting"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            this.handleAItimeStampButtonClick()
                                        }
                                    }}
                                />
                            </TextFieldContainer>
                        </YTPMenuItem>
                    </TooltipBox>
                    <TooltipBox
                        getPortalRoot={this.props.getRootElement}
                        tooltipText={
                            <span>
                                Take a screenshot of the current frame
                                <br />
                                and adds a linked timestamp.
                            </span>
                        }
                        placement="bottom"
                    >
                        <YTPMenuItem onClick={this.handleScreenshotButtonClick}>
                            <Icon
                                filePath={runtime.getURL('/img/cameraIcon.svg')}
                                heightAndWidth="20px"
                                color={'greyScale6'}
                                hoverOff
                            />
                            <YTPMenuItemLabel>Screenshot</YTPMenuItemLabel>
                        </YTPMenuItem>
                    </TooltipBox>
                </MemexButtonContainer>
            </ParentContainer>
        )
    }
}

const ParentContainer = styled.div`
    width: 100%;
    border-radius: 8px 8px 8px 8px;
    margin-top: 5px;
    margin-bottom: 20px;
    overflow: hidden;
    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
`

const YTChapterContainer = styled.div`
    display: flex;
    flex: 1;
    width: 250px;
`

const MemexButtonContainer = styled.div`
    display: flex;
    align-items: center;
    width: fit-content;
    background-color: ${(props) => props.theme.colors.black};
    border-radius: 8px 8px 8px 8px;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
`

const NoScrollbar = styled.div`
    ::-webkit-scrollbar {
        display: none;
    }
    scrollbar-width: none;
`

const YTPMenuItem = styled.div`
    display: flex;
    align-items: center;
    cursor: pointer;
    height: 30px;
    width: fit-content;
    padding: 5px 5px;
    border-radius: 5px;
    color: ${(props) =>
        props.theme.variant === 'light'
            ? props.theme.colors.greyScale5
            : props.theme.colors.greyScale7};

    &:hover {
        background-color: ${(props) =>
            props.theme.variant === 'light'
                ? props.theme.colors.greyScale3
                : props.theme.colors.greyScale1_5};
    }
`

const YTPMenuItemLabel = styled.div`
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on;
    font-family: Satoshi, sans-serif;
    font-size: 12px;
    padding: 0px 12px 0 6px;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    display: flex;
`

const TextFieldContainer = styled.div`
    display: flex;
    align-items: center;
    margin: 0 10px;
    border-radius: 6px;
    outline: 1px solid
        ${(props) =>
            props.theme.variant === 'light'
                ? props.theme.colors.greyScale3
                : props.theme.colors.greyScale2};
    overflow: hidden;
    background: ${(props) =>
        props.theme.variant === 'light'
            ? props.theme.colors.greyScale1
            : props.theme.colors.greyScale3};
    width: 55px;
    height: 24px;
    position: relative;
    padding-right: 5px;
`

const TextField = styled.input`
    height: 100%;
    width: 44px;
    border-radius: 6px;
    padding: 5px 10px 5px 10px;
    overflow: hidden;
    background: transparent;
    outline: none;
    font-size: 12px;
    color: ${(props) =>
        props.theme.variant === 'light'
            ? props.theme.colors.greyScale5
            : props.theme.colors.greyScale7};

    text-align: right;
    position: absolute;
    border: none;
`
