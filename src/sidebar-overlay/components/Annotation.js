import React from 'react'
import PropTypes from 'prop-types'
import styles from './Annotation.css'

const Annotation = props => (
    <div className={styles.container}>
        <div className={styles.highlight}>
            {props.renderHighlight()}
            {props.renderShowButton('highlight')}
        </div>

        <div className={styles.annotationText}>
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
}

export default Annotation
