import React, { Component, MouseEventHandler } from 'react'
import cx from 'classnames'

import AnnotationBox from 'src/sidebar-overlay/annotation-box'
import { Annotation as AnnotationFlawed } from 'src/annotations/types'

const styles = require('./annotation-list.css')

// TODO (sidebar-refactor): somewhere this type regressed and `isBookmarked` got
//  changed to `hasBookmark`
type Annotation = Omit<AnnotationFlawed, 'isBookmarked'> & {
    hasBookmark: boolean
}

export interface Props {
    /** Override for expanding annotations by default */
    isExpandedOverride: boolean
    /** Array of matched annotations, limited to 3 */
    annotations: Annotation[]
    /** URL of the page to which these annotations belong */
    pageUrl: string
    /** Opens the annotation sidebar with all of the annotations */
    openAnnotationSidebar: MouseEventHandler
    goToAnnotation: (annotation: Annotation) => void
    handleEditAnnotation: (url: string, comment: string, tags: string[]) => void
    handleDeleteAnnotation: (url: string) => void
    handleBookmarkToggle: (url: string) => void
}

interface State {
    /** Boolean to denote whether the list is expanded or not */
    isExpanded: boolean
    /** The previous prop to compare in getDerivedStateFromProps */
    prevIsExpandedOverride: boolean
    /** Received annotations are stored and manipulated through edit/delete */
    annotations: Annotation[]
}

class AnnotationList extends Component<Props, State> {
    state: State = {
        /* The initial value is set to the isExpandedOverride which is
        fetched from localStorage. */
        isExpanded: this.props.isExpandedOverride,
        prevIsExpandedOverride: this.props.isExpandedOverride,
        annotations: this.props.annotations,
    }

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

        const index = annotations.findIndex((annot) => annot.url === url)
        const annotation: Annotation = annotations[index]

        if (
            !annotation ||
            (!annotation.body && !comment.length && !tags.length)
        ) {
            return
        }

        const newAnnotations: Annotation[] = [
            ...annotations.slice(0, index),
            { ...annotation, comment, tags, lastEdited: new Date() },
            ...annotations.slice(index + 1),
        ]

        this.props.handleEditAnnotation(url, comment, tags)

        this.setState({
            annotations: newAnnotations,
        })
    }

    private handleDeleteAnnotation = (url: string) => {
        this.props.handleDeleteAnnotation(url)

        // Delete the annotation in the state too
        const { annotations } = this.state
        const index = this.state.annotations.findIndex(
            (annot) => annot.url === url,
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

        const index = annotations.findIndex((annot) => annot.url === url)
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
        this.props.goToAnnotation(annotation)
    }

    private renderAnnotations() {
        return this.state.annotations.map((annot) => (
            <AnnotationBox
                env="overview"
                key={annot.url}
                className={styles.annotation}
                handleGoToAnnotation={this.handleGoToAnnotation(annot)}
                handleDeleteAnnotation={this.handleDeleteAnnotation}
                handleEditAnnotation={this.handleEditAnnotation}
                handleBookmarkToggle={this.handleBookmarkToggle}
                {...annot}
                hasBookmark={annot.hasBookmark}
                lastEdited={annot.lastEdited?.valueOf()}
                createdWhen={annot.createdWhen?.valueOf()}
            />
        ))
    }

    render() {
        const { isExpanded } = this.state
        return (
            <div
                className={cx({
                    [styles.parentExpanded]: isExpanded,
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

export default AnnotationList
