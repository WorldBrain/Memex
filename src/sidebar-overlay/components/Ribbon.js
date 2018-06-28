import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import onClickOutside from 'react-onclickoutside'
import { remoteFunction } from 'src/util/webextensionRPC'

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
        const annotations = await remoteFunction('getAllAnnotations')(
            window.location.href,
        )
        this.setState({
            annotations,
        })
    }

    toggleSidebar = () => {
        const isSidebarActive = !this.state.isSidebarActive

        if (isSidebarActive) this.props.highlightAll(this.state.annotations)
        else {
            this.props.removeHighlights({ isDark: false })
            this.props.removeHighlights({ isDark: true })
        }

        this.setState({
            isSidebarActive,
        })
    }

    handleClickOutside = () => {
        this.setState({
            isSidebarActive: false,
        })
    }

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
                    className={cx(styles.sidebarFrame, {
                        [styles.sidebarActive]: isSidebarActive,
                    })}
                />
            </div>
        )
    }
}

export default onClickOutside(Ribbon)
