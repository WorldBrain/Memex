import React, { Component, MouseEventHandler } from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'

import { MapDispatchToProps } from 'src/sidebar-overlay/types'
import * as actions from 'src/sidebar-overlay/sidebar/actions'
import AnnotationBox from 'src/sidebar-overlay/annotation-box'

import { goToAnnotation } from 'src/sidebar-overlay/sidebar/utils'
import { deleteAnnotation, editAnnotation } from 'src/annotations/actions'
import { Annotation } from 'src/annotations/types'
import { HighlightInteractionInterface } from 'src/highlighting/types'
import { withSidebarContext } from 'src/sidebar-overlay/ribbon-sidebar-controller/sidebar-context'

const styles = require('./annotation-list.css')

interface OwnProps {
    env: 'inpage' | 'overview'
    /** Override for expanding annotations by default */
    isExpandedOverride: boolean
    /** Array of matched annotations, limited to 3 */
    annotations: Annotation[]
    /** URL of the page to which these annotations belong */
    pageUrl: string
    /** Opens the annotation sidebar with all of the annotations */
    openAnnotationSidebar: MouseEventHandler
    highlighter: HighlightInteractionInterface
}

interface DispatchProps {
    handleEditAnnotation: (url: string, comment: string, tags: string[]) => void
    handleDeleteAnnotation: (url: string) => void
    handleBookmarkToggle: (url: string) => void
}

interface StateProps {}

type Props = OwnProps & DispatchProps & StateProps

interface State {
    /** Boolean to denote whether the list is expanded or not */
    isExpanded: boolean
    /** The previous prop to compare in getDerivedStateFromProps */
    prevIsExpandedOverride: boolean
    /** Received annotations are stored and manipulated through edit/delete */
    annotations: Annotation[]
}

class AnnotationList extends Component<Props, State> {
    state = {
        /* The initial value is set to the isExpandedOverride which is
        fetched from localStorage. */
        isExpanded: this.props.isExpandedOverride,
        prevIsExpandedOverride: this.props.isExpandedOverride,
        annotations: this.props.annotations,
    }

    private goToAnnotation = goToAnnotation(this.props.pageUrl)

    /**
     * We compare if the previous isExpandedOverride prop is different from
     * the current isExpandedOverride, then we set the state accordingly.
     */
    static getDerivedStateFromProps(props: Props, state: State): State {
        if (props.isExpandedOverride !== state.prevIsExpandedOverride) {
            return {
                ...state,
                isExpanded: props.isExpandedOverride,
                prevIsExpandedOverride: props.isExpandedOverride,
            }
        }
        return state
    }

    private toggleIsExpanded = () => {
        this.setState(
            (prevState: State): State => ({
                ...prevState,
                isExpanded: !prevState.isExpanded,
            }),
        )
    }

    private handleEditAnnotation = (
        url: string,
        comment: string,
        tags: string[],
    ) => {
        // Find the annotation in state and update it
        const { annotations } = this.state

        const index = annotations.findIndex(annot => annot.url === url)
        const annotation: Annotation = annotations[index]

        if (
            !annotation ||
            (!annotation.body && !comment.length && !tags.length)
        ) {
            return
        }

        const newAnnotations: Annotation[] = [
            ...annotations.slice(0, index),
            { ...annotation, comment, tags, lastEdited: Date.now() },
            ...annotations.slice(index + 1),
        ]

        this.props.handleEditAnnotation(url, comment, tags)

        this.setState({
            annotations: newAnnotations,
        })
        this.props.highlighter.removeTempHighlights()
    }

    private handleDeleteAnnotation = (url: string) => {
        // Note this only get's called when editing the annotation on the dashboard results list, not the sidebar
        // TODO: Why is this state not linked to the redux state?

        this.props.handleDeleteAnnotation(url)
        this.props.highlighter.removeAnnotationHighlights(url)

        // Delete the annotation in the state too
        const { annotations } = this.state
        const index = this.state.annotations.findIndex(
            annot => annot.url === url,
        )
        const newAnnotations = [
            ...annotations.slice(0, index),
            ...annotations.slice(index + 1),
        ]
        this.setState({
            annotations: newAnnotations,
        })
    }

    private handleBookmarkToggle = (url: string) => {
        this.props.handleBookmarkToggle(url)

        const { annotations } = this.state

        const index = annotations.findIndex(annot => annot.url === url)
        const annotation: Annotation = annotations[index]
        const newAnnotations: Annotation[] = [
            ...annotations.slice(0, index),
            { ...annotation, hasBookmark: !annotation.hasBookmark },
            ...annotations.slice(index + 1),
        ]

        this.setState({
            annotations: newAnnotations,
        })
    }

    private handleGoToAnnotation = (annotation: Annotation) => (
        e: React.MouseEvent<HTMLElement>,
    ) => {
        e.preventDefault()
        e.stopPropagation()
        this.goToAnnotation(annotation, this.props.env)
    }

    private renderAnnotations() {
        return this.state.annotations.map(annot => (
            <AnnotationBox
                key={annot.url}
                className={cx({
                    [styles.annotation]: this.props.env === 'overview',
                    [styles.annotationBoxInpage]: this.props.env === 'inpage',
                })}
                env={this.props.env}
                handleGoToAnnotation={this.handleGoToAnnotation(annot)}
                handleDeleteAnnotation={this.handleDeleteAnnotation}
                handleEditAnnotation={this.handleEditAnnotation}
                handleBookmarkToggle={this.handleBookmarkToggle}
                {...annot}
            />
        ))
    }

    render() {
        const { isExpanded } = this.state
        return (
            <div
                className={cx({
                    [styles.parentExpanded]: isExpanded,
                    [styles.parentExpandedSidebar]:
                        isExpanded && this.props.env === 'inpage',
                })}
            >
                {/* Annotation count text and toggle arrow */}
                <div
                    className={cx(styles.resultCount, {
                        [styles.expandedCount]: this.state.isExpanded,
                    })}
                    onClick={this.toggleIsExpanded}
                >
                    <b>{this.props.annotations.length}</b>{' '}
                    <span className={styles.resultsText}>results</span>
                    <span
                        className={cx(styles.icon, {
                            [styles.inverted]: this.state.isExpanded,
                        })}
                    />
                </div>

                {/* Container for displaying AnnotationBox */}
                <div className={styles.annotationList}>
                    {isExpanded ? this.renderAnnotations() : null}
                </div>
            </div>
        )
    }
}

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps
> = dispatch => ({
    handleEditAnnotation: (url, comment, tags) =>
        dispatch(editAnnotation(url, comment, tags)),
    handleDeleteAnnotation: url => {
        dispatch(deleteAnnotation(url))
    },
    handleBookmarkToggle: url => dispatch(actions.toggleBookmark(url)),
})

export default withSidebarContext(
    connect(null, mapDispatchToProps)(AnnotationList),
)
