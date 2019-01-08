import * as React from 'react'
import Menu from 'react-burger-menu/lib/menus/slide'

import CongratsMessage from '../congrats-message'
import menuStyles from './menu-styles'
import CommentBoxContainer from '../../comment-box'
import Topbar from '../topbar'
import Loader from '../loader'
import EmptyMessage from '../empty-message'
import AnnotationBoxContainer from '../annotation-box'
import { Annotation } from '../../types'

const styles = require('./sidebar.css')

interface Props {
    env: 'inpage' | 'overview'
    isOpen: boolean
    isLoading: boolean
    annotations: Annotation[]
    showCommentBox: boolean
    closeSidebar: () => void
    handleAddCommentBtnClick: () => void
    handleMouseEnter: (e: Event) => void
    handleMouseLeave: (e: Event) => void
}

class Sidebar extends React.Component<Props> {
    private _sidebarRef: HTMLElement

    componentDidMount() {
        this._attachEventListeners()
    }

    componentWillUnmount() {
        this._removeEventListeners()
    }

    private _attachEventListeners() {
        this._sidebarRef.addEventListener(
            'mouseenter',
            this.props.handleMouseEnter,
        )
        this._sidebarRef.addEventListener(
            'mouseleave',
            this.props.handleMouseLeave,
        )
    }

    private _removeEventListeners() {
        this._sidebarRef.removeEventListener(
            'mouseenter',
            this.props.handleMouseEnter,
        )
        this._sidebarRef.removeEventListener(
            'mouseleave',
            this.props.handleMouseLeave,
        )
    }

    private _setSidebarRef = (ref: HTMLElement) => {
        this._sidebarRef = ref
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
        const {
            env,
            isOpen,
            isLoading,
            annotations,
            showCommentBox,
            closeSidebar,
            handleAddCommentBtnClick,
        } = this.props

        return (
            <Menu
                isOpen={isOpen}
                width={340}
                styles={menuStyles(env)}
                right
                noOverlay
                disableCloseOnEsc
            >
                <div className={styles.sidebar} ref={this._setSidebarRef}>
                    {/* TODO: Change the styling of CloseButton so that there
                    is no need to use `isOpen` here. */}
                    {isOpen && (
                        <Topbar
                            env={env}
                            disableAddCommentBtn={showCommentBox}
                            handleCloseBtnClick={closeSidebar}
                            handleSettingsBtnClick={
                                this._handleSettingsBtnClick
                            }
                            handleAddCommentBtnClick={handleAddCommentBtnClick}
                        />
                    )}

                    {showCommentBox && <CommentBoxContainer />}

                    {isLoading ? (
                        <Loader />
                    ) : annotations.length === 0 ? (
                        <EmptyMessage />
                    ) : (
                        <div className={styles.annotationsSection}>
                            {annotations.map(annotation => (
                                <AnnotationBoxContainer
                                    key={annotation.url}
                                    {...annotation}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </Menu>
        )
    }
}

export default Sidebar
