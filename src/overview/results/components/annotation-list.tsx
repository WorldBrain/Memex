import React, { Component, MouseEventHandler } from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'

import { MapDispatchToProps } from 'src/sidebar-common/types'
import * as actions from 'src/sidebar-common/sidebar/actions'
import AnnotationBox from 'src/sidebar-common/annotation-box'
import { Annotation } from 'src/sidebar-common/sidebar/types'

import { goToAnnotation } from '../../utils'

const styles = require('./annotation-list.css')

interface OwnProps {
    /** Override for expanding annotations by default */
    isExpandedOverride: boolean
    /** Array of matched annotations, limited to 3 */
    annotations: Annotation[]
    /** URL of the page to which these annotations belong */
    pageUrl: string
    /** Opens the annotation sidebar with all of the annotations */
    openAnnotationSidebar: MouseEventHandler
}

interface DispatchProps {
    handleEditAnnotation: (url: string, comment: string, tags: string[]) => void
    handleDeleteAnnotation: (url: string) => void
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
        /* The intial value is set to the isExpandedOverride which is
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
    }

    private handleDeleteAnnotation = (url: string) => {
        this.props.handleDeleteAnnotation(url)

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

    private handleGoToAnnotation = (annotation: Annotation) => (
        e: React.MouseEvent<HTMLElement>,
    ) => {
        e.preventDefault()
        e.stopPropagation()
        this.goToAnnotation(annotation)
    }

    private renderAnnotations() {
        return this.state.annotations.map(annot => (
            <AnnotationBox
                key={annot.url}
                className={styles.annotation}
                env="overview"
                handleGoToAnnotation={this.handleGoToAnnotation(annot)}
                handleDeleteAnnotation={this.handleDeleteAnnotation}
                handleEditAnnotation={this.handleEditAnnotation}
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
                })}
            >
                {/* Annotation count text and toggle arrow */}
                <p
                    className={cx(styles.resultCount, {
                        [styles.expandedCount]: this.state.isExpanded,
                    })}
                    onClick={this.toggleIsExpanded}
                >
                    <span className={styles.commentIcon} />
                    <b>{this.props.annotations.length}</b> found on this page
                    <span
                        className={cx(styles.icon, {
                            [styles.inverted]: this.state.isExpanded,
                        })}
                    />
                </p>

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
        dispatch(actions.editAnnotation(url, comment, tags)),
    handleDeleteAnnotation: url => dispatch(actions.deleteAnnotation(url)),
})

export default connect(
    null,
    mapDispatchToProps,
)(AnnotationList)
