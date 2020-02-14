import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import onClickOutside from 'react-onclickoutside'

import * as actions from '../actions'
import * as selectors from '../selectors'
import {
    actions as commentBoxActions,
    selectors as commentBoxSelectors,
} from '../../comment-box'
import Sidebar from './sidebar'
import { Page } from '../types'
import RootState, {
    MapDispatchToProps,
    SidebarContextInterface,
} from '../../types'
import AnnotationsManager from '../../../annotations/annotations-manager'
import {
    acts as searchBarActs,
    selectors as searchBar,
} from 'src/overview/search-bar'
import { actions as filterActs } from 'src/search-filters'
import {
    deleteAnnotation,
    editAnnotation,
    fetchAnnotationsForPageUrl,
    fetchMoreAnnotationsForPageUrl,
} from 'src/annotations/actions'
import { Annotation } from 'src/annotations/types'
import { withSidebarContext } from 'src/sidebar-overlay/ribbon-sidebar-controller/sidebar-context'

interface StateProps {
    isOpen: boolean
    isLoading: boolean
    needsWaypoint: boolean
    appendLoader: boolean
    annotations: Annotation[]
    activeAnnotationUrl: string
    hoverAnnotationUrl: string
    showCommentBox: boolean
    showCongratsMessage: boolean
    pageType: 'page' | 'all'
    searchType: 'notes' | 'page' | 'social'
    searchValue: string
    showClearFiltersBtn: boolean
    page: Page
    isSocialPost: boolean
}

interface DispatchProps {
    onInit: () => void
    setAnnotationsManager: (annotationsManager: AnnotationsManager) => void
    closeSidebar: () => void
    handleAddCommentBtnClick: () => void
    setHoverAnnotationUrl: (url: string) => void
    handleEditAnnotation: (url: string, comment: string, tags: string[]) => void
    handleDeleteAnnotation: (url: string) => void
    handleScrollPagination: () => void
    handleBookmarkToggle: (url: string) => void
    onQueryKeyDown: (searchValue: string) => void
    onQueryChange: (searchValue: string) => void
    handlePageTypeClick: React.MouseEventHandler<HTMLButtonElement>
    clearAllFilters: () => void
    resetPage: React.MouseEventHandler<HTMLDivElement>
}

interface ComponentProps {
    env: 'inpage' | 'overview'
    annotationsManager: AnnotationsManager
    sortAnnotationsByPosition?: (annotations: Annotation[]) => Annotation[]
    goToAnnotation: (annotation: Annotation) => void
    /** Optional callback function that gets called after the sidebar is closed. */
    closeSidebarCallback?: () => void
    /** Optional callback function that gets called when the mouse enters an annotation box area. */
    handleAnnotationBoxMouseEnter?: (annotation: Annotation) => void
    /** Optional callback function that gets called when the mouse leaves the annotation box area. */
    handleAnnotationBoxMouseLeave?: () => void
}

type OwnProps = ComponentProps & SidebarContextInterface

type Props = StateProps & DispatchProps & OwnProps

class SidebarContainer extends React.Component<Props> {
    componentDidMount() {
        this.props.onInit()
        this.props.setAnnotationsManager(this.props.annotationsManager)
        document.addEventListener('keydown', this.onKeydown, false)
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.onKeydown, false)
    }

    private onKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && this.props.isOpen) {
            this._closeSidebar()
        }
    }

    private _closeSidebar = () => {
        this.props.closeSidebar()
        if (this.props.closeSidebarCallback) {
            this.props.closeSidebarCallback()
        }
    }

    private _handleGoToAnnotation = (annotation: Annotation) => (
        e: React.MouseEvent<HTMLElement>,
    ) => {
        e.preventDefault()
        e.stopPropagation()
        this.props.goToAnnotation(annotation)
    }

    private _handleAnnotationBoxMouseEnter = (annotation: Annotation) => (
        e: Event,
    ) => {
        e.stopPropagation()
        this.props.setHoverAnnotationUrl(annotation.url)
        if (this.props.handleAnnotationBoxMouseEnter) {
            this.props.handleAnnotationBoxMouseEnter(annotation)
        }
    }

    private _handleAnnotationBoxMouseLeave = () => (e: Event) => {
        e.stopPropagation()
        this.props.setHoverAnnotationUrl(null)
        if (this.props.handleAnnotationBoxMouseLeave) {
            this.props.handleAnnotationBoxMouseLeave()
        }
    }

    handleClickOutside = (e: Event) => {
        e.stopPropagation()

        if (this.props.env === 'overview') {
            this.props.closeSidebar()
        }
    }

    render() {
        return (
            <Sidebar
                {...this.props}
                showCongratsMessage={
                    this.props.showCongratsMessage && !this.props.isLoading
                }
                closeSidebar={this._closeSidebar}
                handleGoToAnnotation={this._handleGoToAnnotation}
                handleAnnotationBoxMouseEnter={
                    this._handleAnnotationBoxMouseEnter
                }
                handleAnnotationBoxMouseLeave={
                    this._handleAnnotationBoxMouseLeave
                }
            />
        )
    }
}

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    RootState
> = state => ({
    isOpen: selectors.isOpen(state),
    isLoading: selectors.isLoading(state),
    // Disable pagination for now
    // needsWaypoint: selectors.needsPagWaypoint(state),
    needsWaypoint: false,
    appendLoader: selectors.shouldAppendLoader(state),
    annotations: selectors.annotations(state),
    activeAnnotationUrl: selectors.activeAnnotationUrl(state),
    hoverAnnotationUrl: selectors.hoverAnnotationUrl(state),
    showCommentBox: commentBoxSelectors.showCommentBox(state),
    showCongratsMessage: selectors.showCongratsMessage(state),
    pageType: selectors.pageType(state),
    searchType: selectors.searchType(state),
    searchValue: searchBar.query(state),
    showClearFiltersBtn: searchBar.showClearFiltersBtn(state),
    page: selectors.page(state),
    isSocialPost: selectors.isSocialPost(state),
})

const mapDispatchToProps: MapDispatchToProps<DispatchProps, OwnProps> = (
    dispatch,
    props,
) => {
    return {
        onInit: () => dispatch(actions.initState()),
        setAnnotationsManager: annotationsManager =>
            dispatch(actions.setAnnotationsManager(annotationsManager)),
        closeSidebar: () => {
            // This state is not used in the content script version of sidebar
            //  statically importing causes big issues
            if (props.env === 'overview') {
                const {
                    resetActiveSidebarIndex,
                } = require('src/overview/results/actions')
                dispatch(resetActiveSidebarIndex())
            }

            dispatch(actions.closeSidebar())
        },
        handleAddCommentBtnClick: () =>
            dispatch(commentBoxActions.setShowCommentBox(true)),
        setHoverAnnotationUrl: url =>
            dispatch(actions.setHoverAnnotationUrl(url)),
        handleEditAnnotation: (url, comment, tags) =>
            dispatch(editAnnotation(url, comment, tags)),
        handleDeleteAnnotation: url => {
            props.highlighter.removeAnnotationHighlights(url)
            dispatch(deleteAnnotation(url))
        },
        handleScrollPagination: (isSocialSearch?: boolean) =>
            dispatch(fetchMoreAnnotationsForPageUrl(isSocialSearch)),
        handleBookmarkToggle: url => dispatch(actions.toggleBookmark(url)),
        onQueryChange: searchValue =>
            dispatch(searchBarActs.setQueryTagsDomains(searchValue, false)),
        onQueryKeyDown: searchValue =>
            dispatch(searchBarActs.setQueryTagsDomains(searchValue, true)),
        handlePageTypeClick: e => {
            e.preventDefault()
            dispatch(actions.togglePageType())
        },
        clearAllFilters: () => {
            dispatch(filterActs.resetFilters())
            dispatch(searchBarActs.clearFilters())
        },
        resetPage: e => {
            e.preventDefault()
            dispatch(actions.setPageType('all'))
            dispatch(
                actions.setPage({
                    url: null,
                    title: null,
                }),
            )
            dispatch(fetchAnnotationsForPageUrl())
        },
    }
}

export default withSidebarContext(
    connect(
        mapStateToProps,
        mapDispatchToProps,
    )(onClickOutside(SidebarContainer)),
)
