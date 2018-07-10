import React from 'react'
import PropTypes from 'prop-types'
import styles from './Annotation.css'
import cx from 'classnames'

const Annotation = props => (
    <div
        className={cx(styles.container, {
            [styles.pointer]: props.isIFrame && props.isJustComment,
            [styles.iframe]: props.isIFrame,
            [styles.active]: props.isActive,
        })}
        id={props.id}
        onClick={
            props.isIFrame && props.isJustComment ? props.goToAnnotation : null
        }
    >
        <div
            className={
                props.isJustComment ? styles.highlight : styles.noDisplay
            }
        >
            "{props.renderHighlight()}"
            {props.renderShowButton('highlight')}
        </div>

        <div
            className={cx({
                [styles.annotationText]: props.shouldCommentBoxBeVisible,
                [styles.dashedBorder]: props.isJustComment,
            })}
        >
            {props.renderAnnotation()}
            {props.annotationEditMode
                ? null
                : props.renderShowButton('annotation')}
            <div className={props.deriveTagsClass()}>
                {props.renderTagPills()}
            </div>
        </div>

        {props.renderAnnotationInput()}

        <div className={styles.footer}>{props.renderFooter()}</div>
    </div>
)

Annotation.propTypes = {
    renderHighlight: PropTypes.func.isRequired,
    renderShowButton: PropTypes.func.isRequired,
    renderAnnotation: PropTypes.func.isRequired,
    annotationEditMode: PropTypes.bool.isRequired,
    deriveTagsClass: PropTypes.func.isRequired,
    renderTagPills: PropTypes.func.isRequired,
    renderAnnotationInput: PropTypes.func.isRequired,
    renderFooter: PropTypes.func.isRequired,
    goToAnnotation: PropTypes.func.isRequired,
    isIFrame: PropTypes.bool.isRequired,
    shouldCommentBoxBeVisible: PropTypes.bool.isRequired,
    isJustComment: PropTypes.bool.isRequired,
    isActive: PropTypes.bool.isRequired,
    id: PropTypes.string.isRequired,
}

export default Annotation
