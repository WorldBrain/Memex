import React, { Component, MouseEventHandler, Fragment } from 'react'
import cx from 'classnames'

import AnnotationBox from 'src/sidebar-common/annotation-box'
import { Annotation } from 'src/sidebar-common/sidebar/types'

const styles = require('./annotation-list.css')

export interface Props {
    /* Override for expanding annotations by default */
    isExpandedOverride: boolean
    /* Array of matched annotations, limited to 3 */
    annotations: Annotation[]
    /* Opens the annotation sidebar with all of the annotations */
    openAnnotationSidebar: MouseEventHandler
}

export interface State {
    /** Boolean to denote whether the list is expanded or not */
    isExpanded: boolean
}

class AnnotationList extends Component<Props, State> {
    state = {
        isExpanded: false,
    }

    /**
     *  Derive isExpanded from override and current state
     */
    private get isExpanded(): boolean {
        return this.props.isExpandedOverride || this.state.isExpanded
    }

    private toggleIsExpanded = () => {
        this.setState(
            (prevState: State): State => ({
                ...prevState,
                isExpanded: !prevState.isExpanded,
            }),
        )
    }

    private renderAnnotations() {
        return this.props.annotations.map(annot => (
            <AnnotationBox
                key={annot.url}
                className={styles.annotation}
                env="overview"
                handleGoToAnnotation={() => undefined}
                handleDeleteAnnotation={() => undefined}
                handleEditAnnotation={() => undefined}
                {...annot}
            />
        ))
    }

    render() {
        const isExpanded = this.isExpanded

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
                    <span className={styles.commentIcon}/>
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

export default AnnotationList
