import * as React from 'react'
import Menu from 'react-burger-menu/lib/menus/slide'

import { CongratsMessage, Topbar, Loader, EmptyMessage } from '../../components'
import AnnotationBoxContainer from '../../annotation-box'
import menuStyles from './menu-styles'
import CommentBoxContainer from '../../comment-box'
import { Annotation } from '../types'
import { openSettings } from '../../utils'

const styles = require('./sidebar.css')

interface Props {
    env: 'inpage' | 'overview'
    isOpen: boolean
    isLoading: boolean
    annotations: Annotation[]
    activeAnnotationUrl: string
    hoverAnnotationUrl: string
    showCommentBox: boolean
    showCongratsMessage: boolean
    closeSidebar: () => void
    handleGoToAnnotation: (
        annotation: Annotation,
    ) => (e: React.MouseEvent<HTMLElement>) => void
    handleAddCommentBtnClick: () => void
    handleMouseEnter: (e: Event) => void
    handleMouseLeave: (e: Event) => void
    handleAnnotationBoxMouseEnter: (
        annotation: Annotation,
    ) => (e: Event) => void
    handleAnnotationBoxMouseLeave: () => (e: Event) => void
    handleEditAnnotation: (url: string, comment: string, tags: string[]) => void
    handleDeleteAnnotation: (url: string) => void
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

    private _handleSettingsBtnClick = () => {
        openSettings()
    }

    render() {
        const {
            env,
            isOpen,
            isLoading,
            annotations,
            activeAnnotationUrl,
            hoverAnnotationUrl,
            showCommentBox,
            showCongratsMessage,
            closeSidebar,
            handleGoToAnnotation,
            handleAddCommentBtnClick,
            handleAnnotationBoxMouseEnter,
            handleAnnotationBoxMouseLeave,
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
                    <Topbar
                        disableAddCommentBtn={showCommentBox}
                        handleCloseBtnClick={closeSidebar}
                        handleSettingsBtnClick={this._handleSettingsBtnClick}
                        handleAddCommentBtnClick={handleAddCommentBtnClick}
                    />

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
                                    env={env}
                                    {...annotation}
                                    isActive={
                                        activeAnnotationUrl === annotation.url
                                    }
                                    isHovered={
                                        hoverAnnotationUrl === annotation.url
                                    }
                                    handleGoToAnnotation={handleGoToAnnotation(
                                        annotation,
                                    )}
                                    handleMouseEnter={handleAnnotationBoxMouseEnter(
                                        annotation,
                                    )}
                                    handleMouseLeave={handleAnnotationBoxMouseLeave()}
                                    handleEditAnnotation={
                                        this.props.handleEditAnnotation
                                    }
                                    handleDeleteAnnotation={
                                        this.props.handleDeleteAnnotation
                                    }
                                />
                            ))}
                            {showCongratsMessage && <CongratsMessage />}
                        </div>
                    )}
                </div>
            </Menu>
        )
    }
}

export default Sidebar
