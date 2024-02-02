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
        const scaleFactor = parentWidth / childWidth
        this.memexButtonContainerRef.current.style.transform = `scale(${scaleFactor})`
        this.memexButtonContainerRef.current.style.transformOrigin = 'left top'

        this.parentContainerRef.current.style.height =
            this.memexButtonContainerRef.current.offsetHeight * scaleFactor +
            'px'

        console.log(
            'adjustScaleToFitParent',
            this.parentContainerRef.current.style.height,
        )
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
        const secondsInPastFieldNote = document.getElementById(
            'secondsInPastFieldNote',
        ) as HTMLInputElement
        const secondsInPastContainerNote = document.getElementById(
            'secondsInPastContainerNote',
        ) as HTMLInputElement

        const includeLastFewSecs = secondsInPastFieldNote.value
            ? parseInt(secondsInPastFieldNote.value)
            : 0

        await globalThis['browser'].storage.local.set({
            ['noteSecondsStorage']: includeLastFewSecs,
        })

        this.props.annotationsFunctions.createAnnotation()(
            false,
            false,
            false,
            this.getTimestampNoteContentForYoutubeNotes(includeLastFewSecs),
            includeLastFewSecs,
        )
    }

    handleSummarizeButtonClick = () => {
        // Logic for summarize button click
        this.props.annotationsFunctions.askAI()(false, false)
    }

    handleAItimeStampButtonClick = async () => {
        // Logic for AI timestamp button click
        const secondsInPastField = document.getElementById(
            'secondsInPastSetting',
        ) as HTMLInputElement
        const secondsInPastSettingContainer = document.getElementById(
            'secondsInPastSettingContainer',
        ) as HTMLInputElement

        const includeLastFewSecs = secondsInPastField.value
            ? parseInt(secondsInPastField.value)
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
            this.getTimestampNoteContentForYoutubeNotes(includeLastFewSecs),
        )
    }

    handleTextFieldInput = (event) => {
        // Logic for text field input
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
                    <MemexIcon src={runtime.getURL('/img/memexLogo.svg')} />
                    <TooltipBox
                        getPortalRoot={this.props.getRootElement}
                        tooltipText={
                            <span>
                                Add a note with a link <br />
                                to the current time
                            </span>
                        }
                        placement="bottom"
                    >
                        <YTPMenuItem onClick={this.handleAnnotateButtonClick}>
                            <TimestampIcon
                                src={runtime.getURL(
                                    '/img/clockForYoutubeInjection.svg',
                                )}
                            />
                            <YTPMenuItemLabel>
                                Timestamped Note
                            </YTPMenuItemLabel>
                            <TextFieldContainer>
                                <RewindIcon
                                    src={runtime.getURL(
                                        '/img/historyYoutubeInjection.svg',
                                    )}
                                />
                                <TextField
                                    type="text"
                                    placeholder="0s"
                                    value={this.state.noteSeconds}
                                    onChange={this.handleTextFieldInput}
                                    id="secondsInPastFieldNote"
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
                            <SummarizeIcon
                                src={runtime.getURL(
                                    '/img/summarizeIconForYoutubeInjection.svg',
                                )}
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
                                Adjust range via the text field.
                            </span>
                        }
                        placement="bottom"
                    >
                        <YTPMenuItem
                            onClick={this.handleAItimeStampButtonClick}
                        >
                            <AITimestampIcon
                                src={runtime.getURL('/img/starsYoutube.svg')}
                            />
                            <YTPMenuItemLabel>AI Note</YTPMenuItemLabel>
                            <TextFieldContainer>
                                <RewindIcon
                                    src={runtime.getURL(
                                        '/img/historyYoutubeInjection.svg',
                                    )}
                                />
                                <TextField
                                    type="text"
                                    placeholder="60s"
                                    value={this.state.smartNoteSeconds}
                                    onChange={this.handleTextFieldInput}
                                    id="secondsInPastSetting"
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
                            <CameraIcon
                                src={runtime.getURL('/img/cameraIcon.svg')}
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
    background-color: ${(props) => props.theme.colors.black};
    border-radius: 8px 8px 8px 8px;
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
    color: ${(props) => props.theme.colors.greyScale7};

    &:hover {
        background-color: ${(props) => props.theme.colors.greyScale1_5};
    }
`

const YTPMenuItemLabel = styled.div`
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on;
    font-family: Satoshi, sans-serif;
    font-size: 14px;
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
    outline: 1px solid #3e3f47;
    overflow: hidden;
    background: #1e1f26;
    width: 84px;
    height: 26px;
    position: relative;
`

const TextField = styled.input`
    height: 100%;
    width: 84px;
    border-radius: 6px;
    padding: 5px 10px;
    overflow: hidden;
    background: transparent;
    outline: none;
    color: #f4f4f4;
    text-align: center;
    position: absolute;
    border: none;
`

const RewindIcon = styled.img`
    height: 18px;
    margin: 0 10px;
`

const MemexIcon = styled.img`
    margin: 0 10px 0 15px;
    height: 20px;
`

const TimestampIcon = styled.img`
    height: 20px;
    margin: 0 10px;
`

const CameraIcon = styled.img`
    height: 20px;
    margin: 0 10px;
`

const AITimestampIcon = styled.img`
    height: 20px;
    margin: 0 10px;
`

const SummarizeIcon = styled.img`
    height: 20px;
    margin: 0 5px 0 10px;
`
