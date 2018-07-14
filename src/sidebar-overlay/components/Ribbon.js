import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import onClickOutside from 'react-onclickoutside'

import { highlightAndScroll } from '../interactions'
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
    }

    state = {
        isSidebarActive: false,
        annotations: [],
    }

    async componentDidMount() {
        this.setupRPCfunctions()

        this.frameFC = new FrameCommunication(this.iFrame.contentWindow)
        this.setupFrameFunctions()

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
                await highlightAndScroll(annotation)
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
                highlightAndScroll(annotation)
            },
        })
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

    reloadAnnotations = async () => {
        await this.frameFC.remoteExecute('reloadAnnotations')()
        await this.fetchAnnotations()

        const highlightables = this.state.annotations.filter(
            annotation => annotation.selector,
        )
        this.props.highlightAll(highlightables, this.focusAnnotationContainer)
    }

    closeSidebarOps = async () => {
        this.props.removeHighlights({ isDark: false })
        this.props.removeHighlights({ isDark: true })
        await this.frameFC.remoteExecute('sendAnchorToSidebar')(null)
        this.frameFC.remoteExecute('focusAnnotation')('')
    }

    toggleSidebar = async () => {
        const isSidebarActive = !this.state.isSidebarActive

        if (isSidebarActive) {
            await this.reloadAnnotations()
        } else {
            this.closeSidebarOps()
        }

        this.setState({
            isSidebarActive,
        })
    }

    openSidebar = async () => {
        await this.reloadAnnotations()
        this.setState({
            isSidebarActive: true,
        })
    }

    openSidebarAndSendAnchor = async anchor => {
        await this.frameFC.remoteExecute('sendAnchorToSidebar')(anchor)
        this.setState({
            isSidebarActive: true,
        })
    }

    handleClickOutside = e => {
        if (e.target.dataset.annotation === 'yes') return
        this.closeSidebarOps()
        this.setState({
            isSidebarActive: false,
        })
    }

    openSettings = () => {
        browser.tabs.create({
            url: browser.extension.getURL('/options.html#/settings'),
            active: true,
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
                        <span
                            className={styles.settings}
                            onClick={this.openSettings}
                        />
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
