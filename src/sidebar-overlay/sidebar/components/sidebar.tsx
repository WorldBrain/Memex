import * as React from 'react'
import Menu from 'react-burger-menu/lib/menus/slide'
import { browser } from 'webextension-polyfill-ts'

import CongratsMessage from '../../components/CongratsMessage'
import menuStyles from './menu-styles'
import CommentBox from '../../comment-box'
import { Topbar } from '../../components'
import { getExtUrl } from 'src/sidebar-overlay/utils'

const styles = require('./sidebar.css')

interface Props {
    isOpen: boolean
    isUserCommenting: boolean
    closeSidebar: () => void
    handleMouseEnter: (e: Event) => void
    handleMouseLeave: (e: Event) => void
}

class Sidebar extends React.Component<Props> {
    private sidebarRef: HTMLElement

    componentDidMount() {
        this._attachEventListeners()
    }

    componentWillUnmount() {
        this._removeEventListeners()
    }

    private _attachEventListeners() {
        this.sidebarRef.addEventListener(
            'mouseenter',
            this.props.handleMouseEnter,
        )
        this.sidebarRef.addEventListener(
            'mouseleave',
            this.props.handleMouseLeave,
        )
    }

    private _removeEventListeners() {
        this.sidebarRef.removeEventListener(
            'mouseenter',
            this.props.handleMouseEnter,
        )
        this.sidebarRef.removeEventListener(
            'mouseleave',
            this.props.handleMouseLeave,
        )
    }

    private _setSidebarRef = (ref: HTMLElement) => {
        this.sidebarRef = ref
    }

    private _handleSettingsBtnClick() {
        // TODO: Following piece of code does not work.
        // Gives `browser` is undefined. Move to a content script.
        // const settingsUrl = getExtUrl('/options.html#/settings')
        // browser.tabs.create({
        //     url: settingsUrl,
        //     active: true,
        // })
    }

    render() {
        const { isOpen, isUserCommenting, closeSidebar } = this.props

        return (
            <Menu
                isOpen={isOpen}
                width={340}
                styles={menuStyles}
                right
                noOverlay
                disableCloseOnEsc
            >
                <div className={styles.sidebar} ref={this._setSidebarRef}>
                    <Topbar
                        disableAddCommentBtn={isUserCommenting}
                        handleCloseBtnClick={closeSidebar}
                        handleSettingsBtnClick={this._handleSettingsBtnClick}
                        handleAddCommentBtnClick={() => null}
                    />

                    {isUserCommenting && <CommentBox />}
                </div>
            </Menu>
        )
    }
}

export default Sidebar
