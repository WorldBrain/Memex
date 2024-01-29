import { getHTML5VideoTimestamp } from '@worldbrain/memex-common/lib/editor/utils'
import React, { Component } from 'react'
import styled from 'styled-components'

interface Props {
    runtime: any
    annotationsFunctions: any
}

interface State {
    YTChapterContainerVisible: boolean
    existingMemexButtons: boolean
    smartNoteSeconds: string
    noteSeconds: string
}

export default class YoutubeButtonMenu extends React.Component<Props, State> {
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
            <MemexButtonContainer>
                {this.state.YTChapterContainerVisible && <YTChapterContainer />}
                <YTPMenuItem onClick={this.handleScreenshotButtonClick}>
                    <CameraIcon src={runtime.getURL('/img/cameraIcon.svg')} />
                    <YTPMenuItemLabel>Screenshot</YTPMenuItemLabel>
                </YTPMenuItem>
                <YTPMenuItem onClick={this.handleAnnotateButtonClick}>
                    <TimestampIcon
                        src={runtime.getURL(
                            '/img/clockForYoutubeInjection.svg',
                        )}
                    />
                    <YTPMenuItemLabel>Timestamped Note</YTPMenuItemLabel>
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
                        />
                    </TextFieldContainer>
                </YTPMenuItem>
                <YTPMenuItem onClick={this.handleSummarizeButtonClick}>
                    <SummarizeIcon
                        src={runtime.getURL(
                            '/img/summarizeIconForYoutubeInjection.svg',
                        )}
                    />
                    <YTPMenuItemLabel>Summarize Video</YTPMenuItemLabel>
                </YTPMenuItem>
                <YTPMenuItem onClick={this.handleAItimeStampButtonClick}>
                    <AITimestampIcon
                        src={runtime.getURL('/img/starsYoutube.svg')}
                    />
                    <YTPMenuItemLabel>Smart Note</YTPMenuItemLabel>
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
                        />
                    </TextFieldContainer>
                </YTPMenuItem>
            </MemexButtonContainer>
        )
    }
}

const YTChapterContainer = styled.div`
    display: flex;
    flex: 1;
    width: 250px;
`

const MemexButtonContainer = styled.div`
    display: flex;
    align-items: center;
    margin: 10px 0;
    border-radius: 6px;
    border: 1px solid #3e3f47;
    overflow: hidden;
    overflow-x: scroll;
    background-color: #12131b;
    color: #f4f4f4;
    width: fit-content;
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
    border-left: 1px solid #24252c;
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
