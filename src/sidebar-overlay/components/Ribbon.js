import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import onClickOutside from 'react-onclickoutside'

import { remoteFunction, makeRemotelyCallable } from 'src/util/webextensionRPC'
import FrameCommunication from '../messaging'

import styles from './Ribbon.css'
import CloseButton from './CloseButton'

class Ribbon extends React.Component {
    static propTypes = {
        destroy: PropTypes.func.isRequired,
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
        annotations: [],
        // For preventing the page scroll, when sidebar is open
        isInsideFrame: false,
        top: null,
        shouldRenderIFrame: true,
    }

    async componentDidMount() {
        this.setupRPCfunctions()

        this.setupFrameFunctions()

        this.setupScrollListeners()

        const annotations = await remoteFunction('getAllAnnotations')(
            window.location.href,
        )

        this.setState({
            annotations,
        })
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
        this.frameFC.removeMessageListener()
    }

    setupRPCfunctions = () => {
        makeRemotelyCallable({
            toggleSidebarOverlay: async () => {
                await this.toggleSidebar()
            },
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
                }, 500)
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
                await this.openSidebarOps()
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
                if (isInsideFrame) window.scrollTo(0, top)
            },
            false,
        )
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
        }, 500)
    }

    fetchAnnotations = async () => {
        const annotations = await remoteFunction('getAllAnnotations')(
            window.location.href,
        )
        this.setState({
            annotations,
        })
    }

    focusAnnotationContainer = annotationUrl => {
        this.frameFC.remoteExecute('focusAnnotation')(annotationUrl)
    }

    hoverAnnotationContainer = annotationUrl => {
        this.frameFC.remoteExecute('setHoveredAnnotation')(annotationUrl)
    }

    openSidebarOps = async () => {
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

        setTimeout(() => {
            const sorted = this.props.sortAnnotationByPosition(
                this.state.annotations,
            )
            this.frameFC.remoteExecute('setAnnotations')(sorted)
        }, 400)
    }

    closeSidebarOps = async () => {
        this.props.removeHighlights()
        await this.frameFC.remoteExecute('sendAnchorToSidebar')(null)
        this.frameFC.remoteExecute('focusAnnotation')('')
        this.frameFC.remoteExecute('setAnnotations')([])
        this.frameFC.remoteExecute('focusCommentBox')(false)
    }

    toggleSidebar = async () => {
        const isSidebarActive = !this.state.isSidebarActive

        if (isSidebarActive) {
            await this.openSidebarOps()
        } else {
            this.closeSidebarOps()
        }

        this.setState({
            isSidebarActive,
        })
    }

    openSidebar = async () => {
        await this.openSidebarOps()
        this.setState({
            isSidebarActive: true,
        })
    }

    openSidebarAndSendAnchor = async anchor => {
        await this.frameFC.remoteExecute('sendAnchorToSidebar')(anchor)
        await this.openSidebar()
    }

    handleClickOutside = e => {
        if (!this.state.isSidebarActive) return
        else if (e.target.dataset.annotation) return
        this.closeSidebarOps()
        this.setState({
            isSidebarActive: false,
        })
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
                width={340}
                ref={this.setiFrameRef}
                className={cx(styles.sidebarFrame, {
                    [styles.sidebarActive]: this.state.isSidebarActive,
                })}
            />
        )
    }

    render() {
        const { isSidebarActive } = this.state
        const { destroy } = this.props
        return (
            <div>
                <div
                    className={cx(styles.ribbon, {
                        [styles.ribbonSidebarActive]: isSidebarActive,
                    })}
                >
                    <div className={styles.buttonHolder}>
                        <span className={styles.cancel} onClick={destroy} />
                    </div>
                    <div className={styles.logo} onClick={this.toggleSidebar} />
                </div>
                <CloseButton
                    isActive={isSidebarActive}
                    clickHandler={this.toggleSidebar}
                />
                {this.renderIFrame()}
            </div>
        )
    }
}

export default onClickOutside(Ribbon)
