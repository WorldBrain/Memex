import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import onClickOutside from 'react-onclickoutside'

import { highlightAndScroll } from '../interactions'
import { remoteFunction, makeRemotelyCallable } from 'src/util/webextensionRPC'
import FrameCommunication from '../messaging'

import styles from './Ribbon.css'

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
            openSidebarAndSendAnchor: async anchor => {
                await this.openSidebarAndSendAnchor(anchor)
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

    reloadAnnotations = async () => {
        await this.frameFC.remoteExecute('reloadAnnotations')()
        await this.fetchAnnotations()

        const highlightables = this.state.annotations.filter(
            annotation => annotation.selector,
        )
        this.props.highlightAll(highlightables)
    }

    closeSidebarOps = async () => {
        this.props.removeHighlights({ isDark: false })
        this.props.removeHighlights({ isDark: true })
        await this.frameFC.remoteExecute('sendAnchorToSidebar')(null)
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

    handleClickOutside = () => {
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
                    <div className={styles.logo} onClick={this.toggleSidebar} />
                    <span className={styles.cancel} onClick={destroy} />
                    <span className={styles.settings} />
                </div>
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
