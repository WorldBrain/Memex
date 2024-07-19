import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import IconBox from '@worldbrain/memex-common/lib/common-ui/components/icon-box'
import KeyboardShortcuts from '@worldbrain/memex-common/lib/common-ui/components/keyboard-shortcuts'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import TextArea from '@worldbrain/memex-common/lib/common-ui/components/text-area'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import TutorialBox from '@worldbrain/memex-common/lib/common-ui/components/tutorial-box'
import VideoRangeSelector from '@worldbrain/memex-common/lib/common-ui/components/video-range-selector'
import getYoutubeVideoDuration, {
    getYoutubeVideoElement,
} from '@worldbrain/memex-common/lib/common-ui/utils/youtube-video-duration'
import {
    constructVideoURLwithTimeStamp,
    getHTML5VideoTimestamp,
} from '@worldbrain/memex-common/lib/editor/utils'
import {
    extractIdFromUrl,
    isUrlYTVideo,
} from '@worldbrain/memex-common/lib/utils/youtube-url'
import React, { Component } from 'react'
import {
    ONBOARDING_NUDGES_DEFAULT,
    ONBOARDING_NUDGES_MAX_COUNT,
    ONBOARDING_NUDGES_STORAGE,
} from 'src/content-scripts/constants'
import { LoadingContainer } from 'src/dashboard-refactor/styled-components'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import {
    BaseKeyboardShortcuts,
    Shortcut,
} from 'src/in-page-ui/keyboard-shortcuts/types'
import {
    ShortcutElData,
    shortcuts,
} from 'src/options/settings/keyboard-shortcuts'
import { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import {
    SyncSettingsStore,
    createSyncSettingsStore,
} from 'src/sync-settings/util'
import { renderNudgeTooltip, updateNudgesCounter } from 'src/util/nudges-utils'
import { sleepPromise } from 'src/util/promises'
import styled from 'styled-components'
import { TaskState } from 'ui-logic-core/lib/types'
import browser, { Browser } from 'webextension-polyfill'
import { pipeline, env } from '@xenova/transformers'
import { ContentScriptsInterface } from 'src/content-scripts/background/types'
import { captureScreenshotFromHTMLVideo } from 'src/content-scripts/content_script/utils'

interface Props {
    runtime: any
    annotationsFunctions: any
    getRootElement: (() => HTMLElement) | null
    syncSettingsBG: RemoteSyncSettingsInterface
    syncSettings: SyncSettingsStore<'openAI'>
    browserAPIs: Browser
    shortcutsData: ShortcutElData[]
    transcriptFunctions: any
    removeYoutubeBar: () => void
    handleDownloadAudio?: (url: string) => Promise<Float32Array>
    videoComponent: HTMLVideoElement
}

interface State {
    videoElement: HTMLVideoElement
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
    showYoutubeSummaryNudge: boolean
    showTranscript: TaskState
    transcript: TranscriptLine[] | null
}

interface TranscriptLine {
    startTime: number
    text: string
    startInSec: number
}

export default class TwitterActionBar extends React.Component<Props, State> {
    static defaultProps: Pick<Props, 'shortcutsData'> = {
        shortcutsData: shortcuts,
    }

    private shortcutsData: Map<string, ShortcutElData>
    private keyboardShortcuts: BaseKeyboardShortcuts
    memexButtonContainerRef = React.createRef<HTMLDivElement>()
    parentContainerRef = React.createRef<HTMLDivElement>() // Assuming you have a ref to the parent container
    summarizeButtonRef = React.createRef<HTMLDivElement>() // Assuming you have a ref to the parent container
    AIButtonRef = React.createRef<HTMLDivElement>() // Assuming you have a ref to the parent container
    summarizePromptRef = React.createRef<HTMLInputElement>() // Assuming you have a ref to the parent container
    syncSettings: SyncSettingsStore<'openAI'>

    constructor(props) {
        super(props)

        this.syncSettings = createSyncSettingsStore({
            syncSettingsBG: this.props.syncSettingsBG,
        })

        this.shortcutsData = new Map(
            props.shortcutsData.map((s) => [s.name, s]) as [
                string,
                ShortcutElData,
            ][],
        )

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
            showYoutubeSummaryNudge: false,
            showTranscript: 'pristine',
            transcript: null,
            videoElement: null,
        }
    }

    async componentDidMount() {
        this.getYoutubeVideoDuration()

        this.keyboardShortcuts = await getKeyboardShortcutsState()
        if (this.syncSettings != null) {
            let summarizeVideoPromptSetting
            try {
                summarizeVideoPromptSetting = await this.syncSettings.openAI?.get(
                    'videoPromptSetting',
                )
            } catch (e) {
                if (summarizeVideoPromptSetting == null) {
                    await this.syncSettings.openAI?.set(
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
                this.getYoutubeVideoDuration()
            }
        })

        await sleepPromise(1000)
        this.adjustScaleToFitParent()

        const shouldShow = await updateNudgesCounter(
            'youtubeSummaryCount',
            this.props.browserAPIs,
        )

        if (shouldShow) {
            this.setState({
                showYoutubeSummaryNudge: true,
            })
        }
    }

    private getHotKey(
        name: string,
        size: 'small' | 'medium',
    ): JSX.Element | string {
        const elData = this.shortcutsData.get(name)
        const short: Shortcut = this.keyboardShortcuts[name]

        if (!elData) {
            return null
        }

        let source = elData.tooltip

        return short.shortcut && short.enabled ? (
            <TooltipContent>
                {
                    <KeyboardShortcuts
                        size={size ?? 'small'}
                        keys={short.shortcut.split('+')}
                        getRootElement={this.props.getRootElement}
                    />
                }
            </TooltipContent>
        ) : (
            source
        )
    }

    async getYoutubeVideoDuration() {
        await sleepPromise(1000)
        const videoElement = await getYoutubeVideoElement(document)

        this.setState({
            videoDuration: videoElement.duration,
            videoElement: videoElement,
        })
    }

    calculateRangeInSeconds(
        duration: number,
        fromPercent: number,
        toPercent: number,
    ) {
        let from = Math.floor(fromPercent) / 100
        let to = Math.floor(toPercent) / 100

        from = Math.floor(from * duration)
        to = Math.floor(to * duration)

        return { from, to }
    }

    handleRangeChange = (from, to) => {
        let fromSecondsPosition = from
        if (!fromSecondsPosition) {
            fromSecondsPosition = this.state.fromSecondsPosition
        }
        let toSecondsPosition = to
        if (!toSecondsPosition) {
            toSecondsPosition = this.state.toSecondsPosition
        }

        this.setState({
            fromSecondsPosition: fromSecondsPosition,
            toSecondsPosition: toSecondsPosition,
        })
        this.adjustTranscriptRange(fromSecondsPosition, toSecondsPosition)
    }

    adjustTranscriptRange = (fromInput, toInput) => {
        if (!this.state.transcript) {
            return
        }

        const { from, to } = this.calculateRangeInSeconds(
            this.state.videoDuration,
            fromInput,
            toInput,
        )
        const filteredTranscript = this.state.transcript.filter(
            (line) => line.startInSec >= from && line.startInSec <= to,
        )

        return filteredTranscript
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

    getTimestampNoteContentForYoutubeNotes() {
        let videoTimeStampForComment: string | null

        const [videoURLWithTime, humanTimestamp] = getHTML5VideoTimestamp()

        if (videoURLWithTime != null) {
            videoTimeStampForComment = `<a href="${videoURLWithTime}">${humanTimestamp}</a><span>${` `}</span>`

            return videoTimeStampForComment
        } else {
            return null
        }
    }

    handleScreenshotButtonClick = async (event) => {
        event.stopPropagation()

        const screenshotTarget = this.props.videoComponent

        if (screenshotTarget) {
            const dataURL = await captureScreenshotFromHTMLVideo(
                screenshotTarget,
            )

            console.log('dataURL', dataURL)
        }

        // Logic for screenshot button click
        // await this.props.annotationsFunctions.createTimestampWithScreenshot()
    }

    async getTranscript() {
        if (!this.state.transcript) {
            let stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            })
            let audioStream = new MediaStream(stream.getAudioTracks())
            let videoStream = new MediaStream(stream.getVideoTracks())

            try {
                let whisperModel = await this.props.browserAPIs.storage.local.get(
                    'whisperModel',
                )
                let modelBlob = whisperModel.whisperModel

                console.log('modelBlob', modelBlob)

                const responseText = await this.props.handleDownloadAudio(
                    'https://video.twimg.com/ext_tw_video/1811242447780876288/pu/vid/avc1/828x720/FNNAJ7BmH8Y_gMAO.mp4?tag=12',
                )
                console.log('responseText', responseText)

                // // Convert base64 string back to blob
                // const byteString = atob(responseText.split(',')[1])
                // const byteArray = new Uint8Array(byteString.length)
                // for (let i = 0; i < byteString.length; i++) {
                //     byteArray[i] = byteString.charCodeAt(i)
                // }
                // const blob = new Blob([byteArray], { type: 'video/mp4' })

                // console.log('newBlob', blob)

                // // Convert ArrayBuffer to Float32Array
                // let arrayBuffer = await blob.arrayBuffer()
                // if (arrayBuffer.byteLength % 4 !== 0) {
                //     const paddedArrayBuffer = new ArrayBuffer(
                //         Math.ceil(arrayBuffer.byteLength / 4) * 4,
                //     )
                //     new Uint8Array(paddedArrayBuffer).set(
                //         new Uint8Array(arrayBuffer),
                //     )
                //     arrayBuffer = paddedArrayBuffer
                // }
                // const float32Array = new Float32Array(arrayBuffer)
                // console.log('float32Array', float32Array)

                // // env.allowRemoteModels = true
                // // env.useBrowserCache = false
                // // env.remoteHost =
                // //     'https://cjzbftkyxnbpyozbgprl.supabase.co/storage/v1/object/public/assets/experiments/decoder_model_quantized.onnx'

                // try {
                //     const pipe = await pipeline(
                //         'automatic-speech-recognition',
                //         'whisper-base',
                //     )

                //     // Log the response to see what is being returned
                //     console.log('Response before processing:', float32Array)

                //     let transcript = await pipe(float32Array)
                //     console.log('out', transcript)
                // } catch (e) {
                //     console.log('error', e)
                // }
            } catch (e) {
                console.log('error top level', e)
            }
        }
    }

    handleOpenTranscript = async (event) => {
        event.stopPropagation()

        if (this.state.showTranscript !== 'pristine') {
            this.setState({
                showTranscript: 'pristine',
            })
            this.parentContainerRef.current.style.height = 'unset'
            return
        }
        this.setState({
            showTranscript: 'running',
        })

        const transcript = await this.getTranscript()

        if (transcript != null) {
            // Function to format seconds into hh:mm:ss
            const formatTimestamp = (seconds) => {
                const date = new Date(0)
                date.setSeconds(seconds)
                const timeString = date.toISOString().substr(11, 8)
                return timeString.startsWith('00:')
                    ? timeString.substr(3)
                    : timeString
            }

            // Cluster the transcript into groups of 20
            const clusteredTranscript = []
            for (let i = 0; i < transcript.length; i += 20) {
                const cluster = transcript.slice(i, i + 20)
                const startTime = formatTimestamp(cluster[0].start)
                const startInSec = Math.floor(cluster[0].start)
                const text = cluster.map((line) => line.text).join(' ')
                clusteredTranscript.push({ startTime, text, startInSec })
            }

            this.setState({
                showTranscript: 'success',
                transcript: clusteredTranscript,
            })
        }
        this.parentContainerRef.current.style.height = 'fit-content'
    }

    handleAnnotateButtonClick = async (
        event: React.MouseEvent<HTMLDivElement>,
    ) => {
        event.stopPropagation()
        const currentUrl = window.location.href
        const from = this.state.fromSecondsPosition
        const to = this.state.toSecondsPosition
        // Check if Shift key is pressed during the click

        let timestampToSend = null

        if (event.shiftKey) {
            const range = this.calculateRangeInSeconds(
                this.state.videoDuration,
                from,
                to,
            )
            const fromTimestampInfo = this.createTimestampAndURL(
                currentUrl,
                range.from,
            )
            const toTimestampInfo = this.createTimestampAndURL(
                currentUrl,
                range.to,
            )

            timestampToSend = (
                this.createAhref(fromTimestampInfo[1], fromTimestampInfo[0]) +
                'to ' +
                this.createAhref(toTimestampInfo[1], toTimestampInfo[0])
            ).toString()
        } else {
            let video = document.getElementsByTagName('video')[0]
            if (video) {
                let currentTime = Math.floor(video.currentTime)
                const currentTimeStamp = this.createTimestampAndURL(
                    currentUrl,
                    currentTime,
                )
                timestampToSend = this.createAhref(
                    currentTimeStamp[1],
                    currentTimeStamp[0],
                )
            }
        }
        // Logic for annotate button click
        this.props.annotationsFunctions.createYoutubeTimestamp(timestampToSend)
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

    handleSummarizeButtonClick = async (event) => {
        event.stopPropagation()
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
            null,
            event.shiftKey,
        )
    }

    handleAItimeStampButtonClick = async (event) => {
        event.stopPropagation()
        this.setState({
            showSummarizeTooltip: false,
            showAINoteTooltip: false,
        })

        await this.syncSettings.openAI?.set(
            'videoPromptSetting',
            this.state.summarizePrompt,
        )

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
            this.getTimestampNoteContentForYoutubeNotes(),
        )
    }

    handleSmartNoteTimeInput = (event) => {
        event.stopPropagation()
        if (isNaN(event.target.value)) {
            return
        }
        // Logic for text field input
        this.setState({ smartNoteSeconds: event.target.value })
    }

    handleTimestampNoteTimeInput = (event) => {
        event.stopPropagation()
        if (isNaN(event.target.value)) {
            return
        }
        // Logic for text field input
        this.setState({ noteSeconds: event.target.value })
    }

    hideYTNudge = async () => {
        this.setState({
            showYoutubeSummaryNudge: false,
        })

        const onboardingNudgesStorage = await this.props.browserAPIs.storage.local.get(
            ONBOARDING_NUDGES_STORAGE,
        )
        let onboardingNudgesValues =
            onboardingNudgesStorage[ONBOARDING_NUDGES_STORAGE] ??
            ONBOARDING_NUDGES_DEFAULT

        onboardingNudgesValues.youtubeSummaryCount = null

        await this.props.browserAPIs.storage.local.set({
            [ONBOARDING_NUDGES_STORAGE]: onboardingNudgesValues,
        })
    }
    snoozeNudge = async () => {
        this.setState({
            showYoutubeSummaryNudge: false,
        })
    }

    renderYouTubeSummaryNudge = () => {
        if (this.state.showYoutubeSummaryNudge) {
            return renderNudgeTooltip(
                "Don't waste time watching this video",
                'Use Memex to summarize and ask questions instead',
                this.getHotKey('askAI', 'medium'),
                '450px',
                this.hideYTNudge,
                this.snoozeNudge,
                this.props.getRootElement,
                this.summarizeButtonRef.current,
                'top-start',
            )
        }
    }

    jumpToTime = (time) => {
        this.state.videoElement.currentTime = time
    }

    renderTranscriptContainer = () => {
        const filteredTranscript = this.adjustTranscriptRange(
            this.state.fromSecondsPosition,
            this.state.toSecondsPosition,
        )

        return filteredTranscript.map((transcriptLine) => {
            return (
                <TranscriptElement>
                    <TranscriptTimestamp
                        onClick={() => {
                            this.jumpToTime(transcriptLine.startInSec)
                        }}
                    >
                        {transcriptLine.startTime}
                    </TranscriptTimestamp>
                    <TranscriptText>{transcriptLine.text}</TranscriptText>
                    <TranscriptActionButtons>
                        {/* <Icon />
                                <Icon />
                                <Icon /> */}
                    </TranscriptActionButtons>
                </TranscriptElement>
            )
        })
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
                    Use a custom prompt. Click again to apply.
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
                                        <strong>+ Shift</strong> to add range
                                        selected below
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
                                        Instant note with timestamp and summary
                                        <br /> of the selected video range
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
                                    onMouseUp={(event) => {
                                        if (!this.state.showAINoteTooltip) {
                                            this.handleAItimeStampButtonClick(
                                                event,
                                            )
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
                                        Summarize this video with custom prompts
                                        <br />
                                    </span>
                                }
                                placement="bottom"
                            >
                                <YTPMenuItem
                                    // onMouseDown={() =>
                                    //     this.setState({
                                    //         showSummarizeTooltip: true,
                                    //     })
                                    // }
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        this.handleSummarizeButtonClick(event)
                                        this.setState({
                                            showYoutubeSummaryNudge: false,
                                        })
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
                                    {/* {this.state.showSummarizeTooltip
                                        ? this.renderPromptTooltip(
                                              'summarizeVideo',
                                          )
                                        : null} */}
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
                            {/* <TooltipBox
                                getPortalRoot={this.props.getRootElement}
                                tooltipText={
                                    <span>
                                        {this.state.showTranscript ===
                                        'pristine'
                                            ? 'Show Transcript'
                                            : 'Hide Transcript'}
                                        <br />
                                    </span>
                                }
                                placement="bottom"
                            >
                                <YTPMenuItem
                                    onClick={this.handleOpenTranscript}
                                    active={
                                        this.state.showTranscript !== 'pristine'
                                    }
                                >
                                    <Icon
                                        filePath={runtime.getURL(
                                            '/img/chatWithUs.svg',
                                        )}
                                        heightAndWidth="20px"
                                        color={'greyScale6'}
                                        hoverOff
                                    />
                                    <YTPMenuItemLabel>
                                        Transcript
                                    </YTPMenuItemLabel>
                                </YTPMenuItem>
                            </TooltipBox> */}
                            <TutorialButtonContainer>
                                <TutorialBox
                                    getRootElement={this.props.getRootElement}
                                    tutorialId="annotateVideos"
                                />
                                <TooltipBox
                                    getPortalRoot={this.props.getRootElement}
                                    tooltipText={
                                        <span>Remove Youtube bar</span>
                                    }
                                    placement="bottom"
                                >
                                    <Icon
                                        icon="removeX"
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            this.props.removeYoutubeBar
                                        }}
                                        heightAndWidth="20px"
                                    />
                                </TooltipBox>
                            </TutorialButtonContainer>
                        </TopArea>
                        {this.state.videoDuration != null &&
                            this.state.videoDuration !== 0 && (
                                <BottomArea>
                                    <VideoRangeSelector
                                        onChange={(values) => {
                                            this.handleRangeChange(
                                                values[0],
                                                values[1],
                                            )
                                        }}
                                        videoDuration={this.state.videoDuration}
                                    />
                                </BottomArea>
                            )}
                        {/* {this.state.showTranscript !== 'pristine' ? (
                            <TranscriptContainer>
                                {this.state.showTranscript === 'running' && (
                                    <LoadingBox>
                                        <LoadingIndicator size={30} />
                                    </LoadingBox>
                                )}

                                {this.state.showTranscript === 'success' &&
                                    this.renderTranscriptContainer()}
                            </TranscriptContainer>
                        ) : null} */}
                    </MemexButtonInnerContainer>
                </InnerContainer>
                {this.renderYouTubeSummaryNudge()}
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
    padding: 10px 5px 5px 5px;
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
    min-height: fit-content;
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

const YTPMenuItem = styled.div<{ active?: boolean }>`
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

    ${(props) =>
        props.active &&
        `
        background-color: ${props.theme.colors.greyScale3};
    `}
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
    display: flex;
    align-items: center;
    justify-content: center;
    grid-gap: 10px;
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
    overflow-x: auto;
`

const BottomArea = styled.div`
    border-top: 1px solid ${(props) => props.theme.colors.greyScale3};
    display: flex;
    width: 100%;
    padding: 0 10px;
    box-sizing: border-box;
`

const TooltipContent = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
    flex-direction: row;
    justify-content: center;
`

const TranscriptContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    height: 500px;
    width: 100%;
    overflow-y: auto;
    border-top: 1px solid ${(props) => props.theme.colors.greyScale3};
`

const LoadingBox = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
`

const TranscriptActionButtons = styled.div`
    position: absolute;
    display: none;
    right: 20px;
    top: 20px;
`

const TranscriptElement = styled.div`
    display: flex;
    justify-content: flex-start;
    grid-gap: 20px;
    align-items: flex-start;
    padding: 20px;
    position: relative;

    &:hover ${TranscriptActionButtons} {
        display: flex;
    }
`

const TranscriptTimestamp = styled.div`
    padding: 5px 10px;
    color: ${(props) => props.theme.colors.greyScale5};
    background: ${(props) => props.theme.colors.greyScale1};
    border-radius: 5px;
    font-size: 14px;

    &:hover {
        cursor: pointer;
    }
`

const TranscriptText = styled.div`
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 14px;
    line-height: 21px;
`
