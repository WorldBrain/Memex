import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import onClickOutside from 'react-onclickoutside'
import { remoteFunction, makeRemotelyCallable } from 'src/util/webextensionRPC'
import { remoteExecute } from '../messaging'

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

        const annotations = await remoteFunction('getAllAnnotations')(
            window.location.href,
        )
        this.setState({
            annotations,
        })
    }

    setupRPCfunctions = () => {
        makeRemotelyCallable({
            openSidebarOverlay: () => {
                this.openSidebar()
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
        await remoteExecute('reloadAnnotations', this.iFrame.contentWindow)()
        await this.fetchAnnotations()

        const highlightables = this.state.annotations.filter(
            annotation => annotation.selector,
        )
        this.props.highlightAll(highlightables)
    }

    removeAllHighlights = () => {
        this.props.removeHighlights({ isDark: false })
        this.props.removeHighlights({ isDark: true })
    }

    toggleSidebar = async () => {
        const isSidebarActive = !this.state.isSidebarActive

        if (isSidebarActive) {
            await this.reloadAnnotations()
        } else {
            this.removeAllHighlights()
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

    handleClickOutside = () => {
        this.removeAllHighlights()
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
