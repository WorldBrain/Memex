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
    }

    state = {
        isSidebarActive: false,
        annotations: [],
    }

    async componentDidMount() {
        this.setupRPCfunctions()

        this.frameFC = new FrameCommunication(this.iFrame.contentWindow)
        this.setupFrameFunctions()

        this.setupScrollListeners()

        const annotations = await remoteFunction('getAllAnnotations')(
            window.location.href,
        )

        this.setState({
            annotations,
        })
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
                await this.props.highlightAndScroll(annotation)
                this.openSidebar()
                this.frameFC.remoteExecute('focusAnnotation')(annotation.url)
            },
        })
    }

    setupFrameFunctions = () => {
        this.frameFC.setUpRemoteFunctions({
            toggleSidebar: async () => {
                await this.toggleSidebar()
            },
            highlightAndScroll: annotation => {
                this.props.highlightAndScroll(annotation)
            },
            makeHighlightMedium: annotation => {
                this.props.makeHighlightMedium(annotation)
            },
            removeMediumHighlights: () => {
                this.props.removeMediumHighlights()
            },
        })
    }

    setupScrollListeners() {
        let isInsideFrame = false
        let top = null

        this.iFrame.addEventListener(
            'mouseenter',
            () => {
                isInsideFrame = true
                top = window.pageYOffset
            },
            false,
        )
        this.iFrame.addEventListener(
            'mouseleave',
            () => {
                isInsideFrame = false
            },
            false,
        )

        document.addEventListener(
            'scroll',
            () => {
                if (isInsideFrame) window.scrollTo(0, top)
            },
            false,
        )
    }

    fetchAnnotations = async () => {
        const annotations = await remoteFunction('getAllAnnotations')(
            window.location.href,
        )
        this.setState({
            annotations,
        })
    }

    togglePageScrolling = isEnabled => () => {
        if (isEnabled) {
            document.body.style.maxHeight = ''
            document.body.style.overflow = 'auto'
        } else {
            document.body.style.maxHeight =
                window.innerHeight + window.pageYOffset + 'px'
            document.body.style.overflow = 'hidden'
        }
    }

    focusAnnotationContainer = annotationUrl => {
        this.frameFC.remoteExecute('focusAnnotation')(annotationUrl)
    }

    hoverAnnotationContainer = annotationUrl => {
        this.frameFC.remoteExecute('setHoveredAnnotation')(annotationUrl)
    }

    openSidebarOps = async () => {
        // await this.frameFC.remoteExecute('reloadAnnotations')()
        await this.fetchAnnotations()

        const highlightables = this.state.annotations.filter(
            annotation => annotation.selector,
        )
        await this.props.highlightAll(
            highlightables,
            this.focusAnnotationContainer,
            this.hoverAnnotationContainer,
        )

        this.togglePageScrolling(false)

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
        this.togglePageScrolling(true)
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

    render() {
        const { isSidebarActive } = this.state
        const { destroy, sidebarURL } = this.props
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
                <iframe
                    src={sidebarURL}
                    height={window.innerHeight}
                    id="memex_annotations_sidebar"
                    width={340}
                    ref={this.setiFrameRef}
                    className={cx(styles.sidebarFrame, {
                        [styles.sidebarActive]: isSidebarActive,
                    })}
                />
            </div>
        )
    }
}

export default onClickOutside(Ribbon)
