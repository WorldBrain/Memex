import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './Ribbon.css'

class Ribbon extends React.Component {
    static propTypes = {
        destroy: PropTypes.func.isRequired,
        sidebarURL: PropTypes.string.isRequired,
    }

    state = {
        isSidebarActive: false,
    }

    toggleSidebar = () => {
        const isSidebarActive = !this.state.isSidebarActive
        this.setState({
            isSidebarActive,
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

Ribbon.propTypes = {
    destroy: PropTypes.func.isRequired,
    sidebarURL: PropTypes.string.isRequired,
}

export default Ribbon
