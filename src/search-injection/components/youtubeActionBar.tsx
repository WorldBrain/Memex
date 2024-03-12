import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import TextArea from '@worldbrain/memex-common/lib/common-ui/components/text-area'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import TutorialBox from '@worldbrain/memex-common/lib/common-ui/components/tutorial-box'
import { getHTML5VideoTimestamp } from '@worldbrain/memex-common/lib/editor/utils'
import React, { Component } from 'react'
import { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import { SyncSettingsStore } from 'src/sync-settings/util'
import { sleepPromise } from 'src/util/promises'
import styled from 'styled-components'
import { Range } from 'react-range'

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

        this.props.annotationsFunctions.createAnnotation()(
            false,
            false,
            false,
            false,
            this.getTimestampNoteContentForYoutubeNotes(includeLastFewSecs),
        )
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

        const rangeInPercent = { from, to }

        this.setState({
            showSummarizeTooltip: false,
            showAINoteTooltip: false,
        })

        this.props.annotationsFunctions.askAIwithMediaRange()(
            rangeInPercent,
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

        this.props.annotationsFunctions.createTimestampWithAISummary(
            includeLastFewSecs,
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
        return (
            <ParentContainer ref={this.parentContainerRef}>
                <InnerContainer
                    id={'MemexButtonContainer'}
                    ref={this.memexButtonContainerRef}
                >
                    <Range
                        step={0.1}
                        min={0}
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
                                    height: '16px',
                                    width: '100%',
                                    backgroundColor: '#12131B',
                                    borderRadius: '10px',
                                }}
                            >
                                {children}
                            </div>
                        )}
                        renderThumb={({ props }) => (
                            <div
                                {...props}
                                style={{
                                    ...props.style,
                                    height: '24px',
                                    width: '10px',
                                    borderRadius: '10px',
                                    marginTop: '-2px',
                                    backgroundColor: '#6AE394',
                                }}
                            />
                        )}
                    />
                    <MemexButtonContainer>
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
                                <TextFieldContainer>
                                    <Icon
                                        filePath={runtime.getURL(
                                            '/img/historyYoutubeInjection.svg',
                                        )}
                                        heightAndWidth="16px"
                                        color={'greyScale5'}
                                        hoverOff
                                    />
                                    <TextFieldSmall
                                        type="text"
                                        placeholder="0s"
                                        value={this.state.noteSeconds}
                                        onChange={
                                            this.handleTimestampNoteTimeInput
                                        }
                                        id="secondsInPastFieldNote"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                        }}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === 'Enter' &&
                                                !e.shiftKey
                                            ) {
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
                                    Summary of the last X seconds with a
                                    timestamp. <br />
                                    Optionally: Adjust seconds into past via the
                                    text field.
                                </span>
                            }
                            placement="bottom"
                        >
                            <YTPMenuItem
                                onMouseDown={() =>
                                    this.setState({ showAINoteTooltip: true })
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

                                <TextFieldContainer>
                                    <Icon
                                        filePath={runtime.getURL(
                                            '/img/historyYoutubeInjection.svg',
                                        )}
                                        heightAndWidth="16px"
                                        color={'greyScale5'}
                                    />
                                    <TextFieldSmall
                                        type="text"
                                        placeholder="60s"
                                        value={this.state.smartNoteSeconds}
                                        onChange={this.handleSmartNoteTimeInput}
                                        id="secondsInPastSetting"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                        }}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === 'Enter' &&
                                                !e.shiftKey
                                            ) {
                                                this.handleAItimeStampButtonClick()
                                            }
                                        }}
                                    />
                                </TextFieldContainer>
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
                                    ? this.renderPromptTooltip('summarizeVideo')
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
                                <YTPMenuItemLabel>Screenshot</YTPMenuItemLabel>
                            </YTPMenuItem>
                        </TooltipBox>
                        <TutorialButtonContainer>
                            <TutorialBox
                                getRootElement={this.props.getRootElement}
                                tutorialId="annotateVideos"
                            />
                        </TutorialButtonContainer>
                    </MemexButtonContainer>
                </InnerContainer>
            </ParentContainer>
        )
    }
}

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
    padding: 6px 15px 0px 15px;
`
