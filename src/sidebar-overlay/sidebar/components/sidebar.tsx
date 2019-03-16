import * as React from 'react'
import Waypoint from 'react-waypoint'
import Menu from 'react-burger-menu/lib/menus/slide'

import { CongratsMessage, Topbar, Loader, EmptyMessage } from '../../components'
import AnnotationBox from 'src/sidebar-overlay/annotation-box'
import menuStyles from './menu-styles'
import CommentBoxContainer from '../../comment-box'
import { Annotation } from '../types'
import { openSettings } from '../../utils'

const styles = require('./sidebar.css')

interface Props {
    env: 'inpage' | 'overview'
    isOpen: boolean
    isLoading: boolean
    needsWaypoint?: boolean
    appendLoader: boolean
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
    handleAnnotationBoxMouseEnter: (
        annotation: Annotation,
    ) => (e: Event) => void
    handleAnnotationBoxMouseLeave: () => (e: Event) => void
    handleEditAnnotation: (url: string, comment: string, tags: string[]) => void
    handleDeleteAnnotation: (url: string) => void
    handleScrollPagination: (args: Waypoint.CallbackArgs) => void
    handleBookmarkToggle: (url: string) => void
}

interface State {
    searchValue: string
    showFilters: boolean
    showPageResults: boolean
    showAllResults: boolean
}

class Sidebar extends React.Component<Props, State> {
    private _handleSettingsBtnClick = openSettings

    state = {
        searchValue: '',
        showFilters: false,
        showPageResults: true,
        showAllResults: false,
    }

    private renderAnnots() {
        const annots = this.props.annotations.map(annot => (
            <AnnotationBox
                key={annot.url}
                env={this.props.env}
                {...annot}
                isActive={this.props.activeAnnotationUrl === annot.url}
                isHovered={this.props.hoverAnnotationUrl === annot.url}
                handleGoToAnnotation={this.props.handleGoToAnnotation(annot)}
                handleEditAnnotation={this.props.handleEditAnnotation}
                handleDeleteAnnotation={this.props.handleDeleteAnnotation}
                handleMouseLeave={this.props.handleAnnotationBoxMouseLeave()}
                handleMouseEnter={this.props.handleAnnotationBoxMouseEnter(
                    annot,
                )}
                handleBookmarkToggle={this.props.handleBookmarkToggle}
            />
        ))

        if (this.props.needsWaypoint) {
            annots.push(
                <Waypoint
                    onEnter={this.props.handleScrollPagination}
                    key="sidebar-waypoint"
                />,
            )
        }

        if (this.props.isLoading && this.props.appendLoader) {
            annots.push(<Loader key="more-loading" />)
        }

        return annots
    }

    render() {
        const {
            env,
            isOpen,
            isLoading,
            annotations,
            showCommentBox,
            showCongratsMessage,
            closeSidebar,
            handleAddCommentBtnClick,
        } = this.props

        return (
            <React.Fragment>
                <Menu
                    isOpen={isOpen}
                    width={340}
                    styles={menuStyles(env)}
                    right
                    noOverlay
                    disableCloseOnEsc
                >
                    <Topbar
                        disableAddCommentBtn={showCommentBox}
                        handleCloseBtnClick={closeSidebar}
                        handleSettingsBtnClick={this._handleSettingsBtnClick}
                        handleAddCommentBtnClick={handleAddCommentBtnClick}
                    />
                    <div className={styles.sidebar}>
                        {showCommentBox && (
                            <div className={styles.commentBoxContainer}>
                                <CommentBoxContainer env={env} />
                            </div>
                        )}
                        {isLoading && !this.props.appendLoader ? (
                            <Loader />
                        ) : annotations.length === 0 ? (
                            <EmptyMessage />
                        ) : (
                            <div className={styles.annotationsSection}>
                                {this.renderAnnots()}
                                {showCongratsMessage && <CongratsMessage />}
                            </div>
                        )}
                    </div>
                </Menu>
            </React.Fragment>
        )
    }
}

export default Sidebar
