import React from 'react'
import Menu from 'react-burger-menu/lib/menus/slide'

import { CommentBox } from 'src/common-ui/components'
import styles from './Sidebar.css'

class Sidebar extends React.Component {
    state = {
        isOpen: false,
    }

    handleStateChange = ({ isOpen }) => this.setState({ isOpen })

    closeMenu = () => this.setState({ isOpen: false })

    toggleMenu = () => this.setState({ isOpen: !this.state.isOpen })

    render() {
        return (
            <div>
                <Menu
                    isOpen={this.state.isOpen}
                    onStateChange={this.handleStateChange}
                    menuClassName={styles.customMenu}
                    width={340}
                    right
                    noOverlay
                >
                    <div className={styles.sidebar}>
                        <p className={styles.sidebarTitle}>Highlights</p>
                        <CommentBox comment={undefined} />
                    </div>
                </Menu>
            </div>
        )
    }
}

export default Sidebar
