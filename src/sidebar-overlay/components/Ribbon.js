import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import onClickOutside from 'react-onclickoutside'

import { remoteFunction, makeRemotelyCallable } from 'src/util/webextensionRPC'
import FrameCommunication from '../messaging'

import styles from './Ribbon.css'
import CloseButton from './CloseButton'

const arrowRibbon = browser.extension.getURL('/img/arrow_ribbon.svg')
const logo = browser.extension.getURL('/img/worldbrain-logo-narrow.png')

class Ribbon extends React.Component {
    static propTypes = {
        onInit: PropTypes.func.isRequired,
        destroy: PropTypes.func.isRequired,
        getInitialState: PropTypes.func.isRequired,
        handleRibbonToggle: PropTypes.func.isRequired,
        handleTooltipToggle: PropTypes.func.isRequired,
        sidebarURL: PropTypes.string.isRequired,
        highlightAll: PropTypes.func.isRequired,
        removeHighlights: PropTypes.func.isRequired,
        highlightAndScroll: PropTypes.func.isRequired,
        makeHighlightMedium: PropTypes.func.isRequired,
        removeMediumHighlights: PropTypes.func.isRequired,
        sortAnnotationByPosition: PropTypes.func.isRequired,
        removeAnnotationHighlights: PropTypes.func.isRequired,
    }

    state = {
        isSidebarActive: false,
        isFullScreen: false,
        annotations: [],
        // For preventing the page scroll, when sidebar is open
        isInsideFrame: false,
        top: null,
        shouldRenderIFrame: false,
        isRibbonEnabled: true,
        isTooltipEnabled: true,
        isHovering: false,
    }

    async componentDidMount() {
        // Get ribbon state.
        const {
            isRibbonEnabled,
            isTooltipEnabled,
        } = await this.props.getInitialState()
        this.setState({ isRibbonEnabled, isTooltipEnabled })

        this.setupRPCfunctions()

        this.setupScrollListeners()

        this.setupHoverListeners()

        await this.fetchAnnotations()

        // For hiding the ribbion when fullScreen event is fired
        // For chrome
        document.addEventListener(
            'webkitfullscreenchange',
            this.onFullScreenCall,
            false,
        )
        // For Firefox
        document.addEventListener(
            'mozfullscreenchange',
            this.onFullScreenCall,
            false,
        )

        this.props.onInit({ toggleSidebar: () => this.toggleSidebar() })
    }

    componentDidUpdate(prevProps, prevState) {
        // If this update results in the iframe being rendered + prev state was not
        if (
            !prevState.shouldRenderIFrame &&
            !prevState.isSidebarActive &&
            this.state.shouldRenderIFrame
        ) {
            this.setupFrameFunctions()
        }
    }

    componentWillUnmount() {
        if (this.frameFC) {
            this.frameFC.removeMessageListener()
        }

        this.removeHoverListeners()
    }

    setupRPCfunctions = () => {
        makeRemotelyCallable({
            /**
             * Opens sidebar and displays the "New annotation" message above Comment Box.
             * @param {*} anchor The anchor of the selected text
             */
            openSidebarAndSendAnchor: async anchor => {
                await this.openSidebarAndSendAnchor(anchor)

                const highlightables = this.state.annotations.filter(
                    annotation => annotation.selector,
                )
                this.props.highlightAll(highlightables)
            },
            /**
             * Gets called when "Go to annotation" icon is clicked in overview.
             * Highlights and scrolls to annotation, open sidebar and
             * focuses the annotation container.
             */
            goToAnnotation: async annotation => {
                await this.openSidebar()
                setTimeout(async () => {
                    const top = await this.props.highlightAndScroll(annotation)
                    this.setState({
                        top,
                        isInsideFrame: true,
                    })
                    this.frameFC.remoteExecute('focusAnnotation')(
                        annotation.url,
                    )
                }, 2000)
            },
            toggleIFrameRender: shouldRenderIFrame => {
                this.setState(state => {
                    if (!shouldRenderIFrame && !state.isSidebarActive) {
                        this.frameFC = null
                    }

                    return { shouldRenderIFrame }
                })
            },
        })
    }

    setupFrameFunctions = () => {
        this.frameFC = new FrameCommunication(this.iFrame.contentWindow)

        this.frameFC.setUpRemoteFunctions({
            toggleSidebar: async () => {
                await this.toggleSidebar()
            },
            highlightAndScroll: async annotation => {
                await this.highlightAndScroll(annotation)
            },
            makeHighlightMedium: annotation => {
                this.props.makeHighlightMedium(annotation)
            },
            removeMediumHighlights: () => {
                this.props.removeMediumHighlights()
            },
            deleteAnnotation: annotation => {
                this.props.removeAnnotationHighlights(annotation)
            },
            updateAnnotations: async () => {
                // Remove selection
                const selection = document.getSelection()
                selection.removeAllRanges()
                this.props.removeHighlights()
                await this.openSidebar()
            },
        })

        this.iFrame.addEventListener(
            'mouseenter',
            () => {
                this.setState({
                    isInsideFrame: true,
                    top: window.pageYOffset,
                })
            },
            false,
        )
        this.iFrame.addEventListener(
            'mouseleave',
            () => {
                this.setState({
                    isInsideFrame: false,
                })
            },
            false,
        )
    }

    setupScrollListeners() {
        document.addEventListener(
            'scroll',
            () => {
                const { top, isInsideFrame } = this.state
                if (isInsideFrame) {
                    window.scrollTo(0, top)
                }
            },
            false,
        )
    }

    setupHoverListeners() {
        this.ribbonRef.addEventListener('mouseenter', this.handleMouseEnter)
        this.ribbonRef.addEventListener('mouseleave', this.handleMouseLeave)
    }

    removeHoverListeners() {
        this.ribbonRef.removeEventListener('mouseenter', this.handleMouseEnter)
        this.ribbonRef.removeEventListener('mouseleave', this.handleMouseLeave)
    }

    highlightAndScroll = async annotation => {
        const top = await this.props.highlightAndScroll(annotation)
        this.setState({
            isInsideFrame: false,
            top: top,
        })
        setTimeout(() => {
            this.setState({
                isInsideFrame: true,
            })
        }, 50)
    }

    fetchAnnotations = async () => {
        const annotations = await remoteFunction('getAllAnnotations')(
            window.location.href,
        )
        this.setState({
            annotations: annotations || [],
        })
    }

    focusAnnotationContainer = annotationUrl => {
        this.frameFC.remoteExecute('focusAnnotation')(annotationUrl)
    }

    hoverAnnotationContainer = annotationUrl => {
        this.frameFC.remoteExecute('setHoveredAnnotation')(annotationUrl)
    }

    closeSidebarOps = async () => {
        this.props.removeHighlights()
        this.frameFC.remoteExecute('focusAnnotation')('')
        this.frameFC.remoteExecute('setAnnotations')([])
        this.frameFC.remoteExecute('focusCommentBox')(false)
    }

    toggleSidebar = async () => {
        const isSidebarActive = !this.state.isSidebarActive
        const processEvent = remoteFunction('processEvent')

        if (processEvent) {
            processEvent({
                type: isSidebarActive ? 'openSidebarPage' : 'closeSidebarPage',
            })
        }

        if (isSidebarActive) {
            await this.openSidebar()
        } else {
            this.closeSidebarOps()
        }

        this.setState({
            isSidebarActive,
        })
    }

    /* Toggles tooltip on/off for all pages. */
    toggleTooltip = async e => {
        e.stopPropagation()
        e.preventDefault()

        const { isTooltipEnabled } = this.state
        this.props.handleTooltipToggle(isTooltipEnabled)
        this.setState({ isTooltipEnabled: !isTooltipEnabled })
    }

    /* Toggles ribbon on/off for all pages. */
    toggleRibbon = async e => {
        e.stopPropagation()
        e.preventDefault()

        const { isRibbonEnabled } = this.state
        this.props.handleRibbonToggle(isRibbonEnabled)
        this.setState({ isRibbonEnabled: !isRibbonEnabled })
    }

    openSidebar = () =>
        new Promise(resolve => {
            return this.setState(
                {
                    isSidebarActive: true,
                    shouldRenderIFrame: true,
                },
                async () => {
                    if (!this.frameFC) {
                        this.setupFrameFunctions()
                    }
                    await this.frameFC.remoteExecute('setLoaderActive')()
                    await this.fetchAnnotations()
                    const highlightables = this.state.annotations.filter(
                        annotation => annotation.selector,
                    )
                    await this.props.highlightAll(
                        highlightables,
                        this.focusAnnotationContainer,
                        this.hoverAnnotationContainer,
                    )
                    this.frameFC.remoteExecute('focusCommentBox')(true)

                    setTimeout(async () => {
                        const sorted = this.props.sortAnnotationByPosition(
                            this.state.annotations,
                        )
                        await this.frameFC.remoteExecute('setAnnotations')(
                            sorted,
                        )
                        resolve()
                    }, 400)
                },
            )
        })

    openSidebarAndSendAnchor = async anchor => {
        await this.openSidebar()

        setTimeout(
            () => this.frameFC.remoteExecute('sendAnchorToSidebar')(anchor),
            400,
        )
    }

    handleClickOutside = e => {
        if (!this.state.isSidebarActive) {
            return
        } else if (e.target.dataset.annotation) {
            return
        }
        this.closeSidebarOps()
        this.setState({
            isSidebarActive: false,
        })
    }

    onFullScreenCall = () => {
        let isFullScreenBool
        if (document.webkitIsFullScreen || document.mozIsFullScreen) {
            isFullScreenBool = true
        } else {
            isFullScreenBool = false
        }
        this.setState({ isFullScreen: isFullScreenBool })
    }

    setiFrameRef = node => (this.iFrame = node)

    renderIFrame() {
        if (!this.state.shouldRenderIFrame && !this.state.isSidebarActive) {
            return null
        }

        return (
            <iframe
                src={this.props.sidebarURL}
                height={window.innerHeight}
                id="memex_annotations_sidebar"
                ref={this.setiFrameRef}
                className={cx(styles.sidebarFrame, {
                    [styles.sidebarActive]: this.state.isSidebarActive,
                })}
            />
        )
    }

    handleMouseEnter = e => {
        e.stopPropagation()
        if (!this.state.isHovering) {
            this.setState({ isHovering: true })
        }
    }

    handleMouseLeave = e => {
        e.stopPropagation()
        if (this.state.isHovering) {
            this.setState({ isHovering: false })
        }
    }

    setupInputRef = ref => {
        this.ribbonRef = ref
    }

    render() {
        const {
            isSidebarActive,
            isFullScreen,
            isTooltipEnabled,
            isRibbonEnabled,
            isHovering,
        } = this.state
        const { destroy } = this.props

        return (
            <React.Fragment>
                <div
                    className={cx(styles.ribbon, {
                        [styles.ribbonSidebarActive]: isSidebarActive,
                        [styles.onFullScreen]: isFullScreen,
                        [styles.ribbonExpanded]: isHovering,
                    })}
                    onClick={this.toggleSidebar}
                    ref={this.setupInputRef}
                >
                    <div className={styles.arrowBox}>
                        <img
                            onClick={this.toggleSidebar}
                            className={styles.arrow}
                            src={arrowRibbon}
                            title={'Open Annotation Sidebar'}
                        />
                    </div>
                    {isHovering && (
                        <div className={styles.buttons}>
                            <img
                                src={logo}
                                className={styles.logo}
                                onClick={this.toggleSidebar}
                                title={'Open Annotation Sidebar'}
                            />
                            <div
                                className={styles.buttonHolder}
                                onClick={this.toggleTooltip}
                            >
                                <span
                                    className={cx(styles.toggler, {
                                        [styles.tooltipOn]: isTooltipEnabled,
                                        [styles.tooltipOff]: !isTooltipEnabled,
                                    })}
                                    title={
                                        'Turn on/off Highlighter on all pages'
                                    }
                                />
                            </div>
                            <div
                                className={styles.buttonHolder}
                                onClick={this.toggleRibbon}
                            >
                                <span
                                    className={cx(styles.toggler, {
                                        [styles.ribbonOn]: isRibbonEnabled,
                                        [styles.ribbonOff]: !isRibbonEnabled,
                                    })}
                                    title={
                                        'Turn on/off this ribbon on all pages'
                                    }
                                />
                            </div>
                            <div className={styles.buttonHolder}>
                                <span
                                    title={
                                        'Close ribbon once. Disable via Memex icon in the extension toolbar.'
                                    }
                                    className={styles.cancel}
                                    onClick={destroy}
                                />
                            </div>
                        </div>
                    )}
                </div>
                <CloseButton
                    isActive={isSidebarActive}
                    clickHandler={this.toggleSidebar}
                    title={
                        'Close once. Disable via Memex icon in the extension toolbar.'
                    }
                />
                {this.renderIFrame()}
            </React.Fragment>
        )
    }
}

export default onClickOutside(Ribbon)
