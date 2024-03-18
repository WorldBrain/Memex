import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import TextArea from '@worldbrain/memex-common/lib/common-ui/components/text-area'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import TutorialBox from '@worldbrain/memex-common/lib/common-ui/components/tutorial-box'
import {
    constructVideoURLwithTimeStamp,
    getHTML5VideoTimestamp,
} from '@worldbrain/memex-common/lib/editor/utils'
import React, { Component } from 'react'
import { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import { SyncSettingsStore } from 'src/sync-settings/util'
import { sleepPromise } from 'src/util/promises'
import styled from 'styled-components'
import { Range } from 'react-range'
import { runInTab } from 'src/util/webextensionRPC'
import { InPageUIContentScriptRemoteInterface } from 'src/in-page-ui/content_script/types'
import { browser } from 'webextension-polyfill-ts'

interface Props {
    runtime: any
    annotationsFunctions: any
    getRootElement: (() => HTMLElement) | null
    syncSettingsBG: RemoteSyncSettingsInterface
    syncSettings: SyncSettingsStore<'openAI'>
}

interface State {
    YTChapterContainerVisible: boolean
    existingMemexButtons: boolean
    smartNoteSeconds: string
    noteSeconds: string
    showSummarizeTooltip: boolean
    showAINoteTooltip: boolean
    summarizePrompt: string
    fromSecondsPosition: number
    toSecondsPosition: number
    videoDuration: number
    adsRunning: boolean
}

export default class YoutubeButtonMenu extends React.Component<Props, State> {
    memexButtonContainerRef = React.createRef<HTMLDivElement>()
    parentContainerRef = React.createRef<HTMLDivElement>() // Assuming you have a ref to the parent container
    summarizeButtonRef = React.createRef<HTMLDivElement>() // Assuming you have a ref to the parent container
    AIButtonRef = React.createRef<HTMLDivElement>() // Assuming you have a ref to the parent container
    summarizePromptRef = React.createRef<HTMLInputElement>() // Assuming you have a ref to the parent container

    constructor(props) {
        super(props)

        this.state = {
            YTChapterContainerVisible: false,
            existingMemexButtons: false,
            smartNoteSeconds: '',
            noteSeconds: '',
            showSummarizeTooltip: false,
            showAINoteTooltip: false,
            summarizePrompt: '',
            fromSecondsPosition: 0,
            toSecondsPosition: 100,
            videoDuration: 0,
            adsRunning: false,
        }
    }

    async componentDidMount() {
        if (this.props.syncSettings != null) {
            let summarizeVideoPromptSetting
            let apikey = await this.props.syncSettings.openAI?.get('apiKey')
            try {
                summarizeVideoPromptSetting = await this.props.syncSettings.openAI?.get(
                    'videoPromptSetting',
                )
            } catch (e) {
                if (summarizeVideoPromptSetting == null) {
                    await this.props.syncSettings.openAI?.set(
                        'videoPromptSetting',
                        'Summarise this video and include timestamps',
                    )
                }
            }

            if (summarizeVideoPromptSetting == null) {
                summarizeVideoPromptSetting =
                    'Summarise this video and include timestamps'
            }

            this.setState({
                summarizePrompt: summarizeVideoPromptSetting,
            })
        }
        this.getYoutubeVideoDuration()
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
        browser.runtime.onMessage.addListener((message) => {
            if (message.type === 'URL_CHANGE') {
                console.log('URL_CHANGE', message.url)
                this.getYoutubeVideoDuration()
            }
        })

        await sleepPromise(1000)
        this.adjustScaleToFitParent()
    }

    async getYoutubeVideoDuration() {
        await sleepPromise(1000)
        let video = document.getElementsByTagName('video')[0]
        if (video) {
            let duration = video.duration

            console.log('duration', duration)
            this.setState({
                videoDuration: duration,
            })
        }
    }

    calculateRangeInSeconds(
        duration: number,
        fromPercent: number,
        toPercent: number,
    ) {
        const from = Math.floor((fromPercent / 100) * duration)
        const to = Math.floor((toPercent / 100) * duration)

        return { from, to }
    }

    handleLeftButtonChange = (position) => {
        this.setState({ fromSecondsPosition: position })
    }

    handleRightButtonChange = (position) => {
        this.setState({ toSecondsPosition: position })
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

        if (scaleFactor >= 1) {
            scaleFactor = 1
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
            videoTimeStampForComment = `<a href="${videoURLWithTime}">${humanTimestamp}</a><span>${` `}</span>`

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

        const currentUrl = window.location.href
        const from = this.state.fromSecondsPosition
        const to = this.state.toSecondsPosition

        const range = this.calculateRangeInSeconds(
            this.state.videoDuration,
            from,
            to,
        )

        const fromTimestampInfo = this.createTimestampAndURL(
            currentUrl,
            range.from,
        )
        const toTimestampInfo = this.createTimestampAndURL(currentUrl, range.to)

        this.props.annotationsFunctions.createAnnotation()(
            false,
            false,
            false,
            false,
            (
                this.createAhref(fromTimestampInfo[1], fromTimestampInfo[0]) +
                'to ' +
                this.createAhref(toTimestampInfo[1], toTimestampInfo[0])
            ).toString(),
        )
    }

    createAhref = (videoURLWithTime, humanTimestamp) => {
        return `<a href="${videoURLWithTime}">${humanTimestamp}</a><span>${` `}</span>`
    }

    createTimestampAndURL = (url, timeStamp) => {
        const videoURLWithTime = constructVideoURLwithTimeStamp(url, timeStamp)
        const minutes = Math.floor(timeStamp / 60)
        const seconds = timeStamp % 60
        const humanTimestamp = `${minutes}:${seconds
            .toString()
            .padStart(2, '0')}`

        return [humanTimestamp, videoURLWithTime]
    }

    handleSummarizeButtonClick = async () => {
        // Logic for summarize button click
        if (
            (await this.props.syncSettings?.openAI?.get(
                'videoPromptSetting',
            )) != this.state.summarizePrompt
        ) {
            await this.props.syncSettings?.openAI?.set(
                'videoPromptSetting',
                this.state.summarizePrompt,
            )
        }

        const from = this.state.fromSecondsPosition
        const to = this.state.toSecondsPosition

        const rangeInSeconds = this.calculateRangeInSeconds(
            this.state.videoDuration,
            from,
            to,
        )

        this.setState({
            showSummarizeTooltip: false,
            showAINoteTooltip: false,
        })

        this.props.annotationsFunctions.askAIwithMediaRange()(
            rangeInSeconds,
            this.state.summarizePrompt,
        )
    }

    handleAItimeStampButtonClick = async () => {
        const includeLastFewSecs = this.state.smartNoteSeconds
            ? parseInt(this.state.smartNoteSeconds)
            : 60
        await globalThis['browser'].storage.local.set({
            ['smartNoteSecondsStorage']: includeLastFewSecs,
        })

        this.setState({
            showSummarizeTooltip: false,
            showAINoteTooltip: false,
        })

        const from = this.state.fromSecondsPosition
        const to = this.state.toSecondsPosition

        const rangeInSeconds = this.calculateRangeInSeconds(
            this.state.videoDuration,
            from,
            to,
        )

        this.props.annotationsFunctions.createTimestampWithAISummary(
            rangeInSeconds,
            this.state.summarizePrompt,
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

    renderPromptTooltip = (ref) => {
        let elementRef
        if (ref === 'summarizeVideo') {
            elementRef = this.summarizeButtonRef
        }
        if (ref === 'AInote') {
            elementRef = this.AIButtonRef
        }

        let actionFunction

        if (ref === 'summarizeVideo') {
            actionFunction = this.handleSummarizeButtonClick
        }
        if (ref === 'AInote') {
            actionFunction = this.handleAItimeStampButtonClick
        }

        return (
            <PopoutBox
                targetElementRef={elementRef.current}
                closeComponent={() => {
                    this.setState({
                        showSummarizeTooltip: false,
                        showAINoteTooltip: false,
                    })
                }}
                getPortalRoot={this.props.getRootElement}
                placement="bottom-start"
                strategy="fixed"
                width="350px"
                offsetX={10}
                instaClose
            >
                <TextFieldContainerPrompt>
                    <TextArea
                        type="text"
                        placeholder={'Add your custom prompt here'}
                        value={this.state.summarizePrompt}
                        onChange={(event) => {
                            this.setState({
                                summarizePrompt: (event.target as HTMLTextAreaElement)
                                    .value,
                            })
                        }}
                        onClick={(e) => {
                            e.stopPropagation()
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                actionFunction()
                            }
                        }}
                        width="350px"
                        autoFocus={true}
                    />
                    Use a custom prompt. Click again to apply.
                </TextFieldContainerPrompt>
            </PopoutBox>
        )
    }

    render() {
        const { runtime } = this.props
        const sliderValues = [
            this.state.fromSecondsPosition,
            this.state.toSecondsPosition,
        ]
        return (
            <ParentContainer
                ref={this.parentContainerRef}
                onMouseEnter={() => this.getYoutubeVideoDuration()}
            >
                <InnerContainer
                    id={'MemexButtonContainer'}
                    ref={this.memexButtonContainerRef}
                >
                    <MemexButtonInnerContainer>
                        {/* {this.state.YTChapterContainerVisible && (
                            <YTChapterContainer />
                        )} */}
                        <TopArea>
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
                                        Add a note with a link to the current
                                        time. <br />
                                        Optionally: Adjust seconds into past via
                                        the text field
                                    </span>
                                }
                                placement="bottom"
                            >
                                <YTPMenuItem
                                    onClick={this.handleAnnotateButtonClick}
                                >
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
                                </YTPMenuItem>
                            </TooltipBox>
                            <TooltipBox
                                getPortalRoot={this.props.getRootElement}
                                tooltipText={
                                    <span>
                                        Summary of the last X seconds with a
                                        timestamp. <br />
                                        Optionally: Adjust seconds into past via
                                        the text field.
                                    </span>
                                }
                                placement="bottom"
                            >
                                <YTPMenuItem
                                    onMouseDown={() =>
                                        this.setState({
                                            showAINoteTooltip: true,
                                        })
                                    }
                                    onMouseUp={() => {
                                        if (!this.state.showAINoteTooltip) {
                                            this.handleAItimeStampButtonClick()
                                        }
                                    }}
                                    ref={this.AIButtonRef}
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
                                    {this.state.showAINoteTooltip
                                        ? this.renderPromptTooltip('AInote')
                                        : null}
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
                                <YTPMenuItem
                                    onMouseDown={() =>
                                        this.setState({
                                            showSummarizeTooltip: true,
                                        })
                                    }
                                    onMouseUp={() => {
                                        if (!this.state.showSummarizeTooltip) {
                                            this.handleSummarizeButtonClick()
                                        }
                                    }}
                                    ref={this.summarizeButtonRef}
                                >
                                    <Icon
                                        filePath={runtime.getURL(
                                            '/img/summarizeIconForYoutubeInjection.svg',
                                        )}
                                        heightAndWidth="20px"
                                        color={'greyScale6'}
                                        hoverOff
                                    />
                                    <YTPMenuItemLabel>
                                        Summarize Video
                                    </YTPMenuItemLabel>
                                    {this.state.showSummarizeTooltip
                                        ? this.renderPromptTooltip(
                                              'summarizeVideo',
                                          )
                                        : null}
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
                                <YTPMenuItem
                                    onClick={this.handleScreenshotButtonClick}
                                >
                                    <Icon
                                        filePath={runtime.getURL(
                                            '/img/cameraIcon.svg',
                                        )}
                                        heightAndWidth="20px"
                                        color={'greyScale6'}
                                        hoverOff
                                    />
                                    <YTPMenuItemLabel>
                                        Screenshot
                                    </YTPMenuItemLabel>
                                </YTPMenuItem>
                            </TooltipBox>
                            <TutorialButtonContainer>
                                <TutorialBox
                                    getRootElement={this.props.getRootElement}
                                    tutorialId="annotateVideos"
                                />
                            </TutorialButtonContainer>
                        </TopArea>
                        {this.state.videoDuration != null &&
                            this.state.videoDuration !== 0 && (
                                <BottomArea>
                                    <Range
                                        step={0.1}
                                        min={0}
                                        // draggableTrack
                                        max={100}
                                        values={[
                                            this.state.fromSecondsPosition,
                                            this.state.toSecondsPosition,
                                        ]}
                                        onChange={(values) =>
                                            this.setState({
                                                fromSecondsPosition: values[0],
                                                toSecondsPosition: values[1],
                                            })
                                        }
                                        renderTrack={({ props, children }) => (
                                            <div
                                                {...props}
                                                style={{
                                                    ...props.style,
                                                    height: '24px',
                                                    width: '100%',
                                                    borderRadius:
                                                        '0 0 10px 10px',
                                                    fontSize: '12px',
                                                    color: '#A9A9B1',
                                                    textAlign: 'center',
                                                    verticalAlign: 'middle',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                {children}
                                                <InfoText>
                                                    Select a time frame (click
                                                    or drag)
                                                </InfoText>
                                            </div>
                                        )}
                                        renderThumb={({ props, index }) => {
                                            const {
                                                style,
                                                onKeyDown,
                                                onKeyUp,
                                                ...divProps
                                            } = props
                                            return (
                                                !isNaN(
                                                    this.state.videoDuration,
                                                ) && (
                                                    <div
                                                        {...divProps}
                                                        style={{
                                                            ...props.style,
                                                            ...style,
                                                            height: '24px',
                                                            outline: 'none',
                                                            width:
                                                                'fit-content',
                                                            borderRadius:
                                                                '10px',
                                                            backgroundColor:
                                                                '#6AE394',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                position:
                                                                    'absolute',
                                                                ...style,
                                                                height: '24px',
                                                                outline: 'none',
                                                                width:
                                                                    'fit-content',
                                                                color: 'white',
                                                                fontSize:
                                                                    '14px',
                                                                padding:
                                                                    '0 5px',
                                                                display: 'flex',
                                                                backgroundColor:
                                                                    '#313239',

                                                                alignItems:
                                                                    'center',
                                                                right:
                                                                    index ===
                                                                        1 &&
                                                                    '5px',
                                                                left:
                                                                    index ===
                                                                        0 &&
                                                                    '5px',
                                                                justifyContent:
                                                                    index === 1
                                                                        ? 'flex-end'
                                                                        : 'flex-start',
                                                            }}
                                                        >
                                                            {(() => {
                                                                const totalSeconds =
                                                                    (sliderValues[
                                                                        index
                                                                    ] /
                                                                        100) *
                                                                    this.state
                                                                        .videoDuration
                                                                const hours = Math.floor(
                                                                    totalSeconds /
                                                                        3600,
                                                                )
                                                                const minutes = Math.floor(
                                                                    (totalSeconds %
                                                                        3600) /
                                                                        60,
                                                                )
                                                                const seconds = Math.floor(
                                                                    totalSeconds %
                                                                        60,
                                                                )

                                                                const paddedMinutes = minutes
                                                                    .toString()
                                                                    .padStart(
                                                                        2,
                                                                        '0',
                                                                    )
                                                                const paddedSeconds = seconds
                                                                    .toString()
                                                                    .padStart(
                                                                        2,
                                                                        '0',
                                                                    )

                                                                if (hours > 0) {
                                                                    return `${hours}:${paddedMinutes}:${paddedSeconds}`
                                                                } else {
                                                                    return `${paddedMinutes}:${paddedSeconds}`
                                                                }
                                                            })()}
                                                        </div>
                                                        <div
                                                            style={{
                                                                height: '20px',
                                                                width: '5px',
                                                                outline: 'none',
                                                            }}
                                                        />
                                                    </div>
                                                )
                                            )
                                        }}
                                    />
                                </BottomArea>
                            )}
                    </MemexButtonInnerContainer>
                </InnerContainer>
            </ParentContainer>
        )
    }
}

const InfoText = styled.div`
    align-self: center;
    justify-self: center;
    width: 100%;
    justify-content: center;
`

const TextFieldContainerPrompt = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    grid-gap: 10px;
    padding: 5px 5px 10px 5px;
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    text-align: center;
`

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

const MemexButtonInnerContainer = styled.div`
    display: flex;
    align-items: center;
    width: fill-available;
    flex-direction: column;
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

const TextFieldSmall = styled.input`
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

const TutorialButtonContainer = styled.div`
    border-left: 1px solid ${(props) => props.theme.colors.greyScale3};
    margin-left: 15px;
    padding-left: 10px;
    padding-right: 10px;
    justify-self: flex-end;
`

const InnerContainer = styled.div`
    width: 100%;
    height: fit-content;
    padding-top: 6px;
    grid-gap: 10px;
    display: flex;
    box-sizing: border-box;
    grid-gap: 8px;
    flex-direction: column;
    padding: 6px 5px 0px 5px;
`

const TopArea = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
`

const BottomArea = styled.div`
    border-top: 1px solid ${(props) => props.theme.colors.greyScale3};
    display: flex;
    width: 100%;
    padding: 0 10px;
    box-sizing: border-box;
`
