import * as React from 'react'
import * as PropTypes from 'prop-types'
import cx from 'classnames'

const styles = require('./annotation-box.css')

/* tslint:disable-next-line variable-name */
const AnnotationBox = props => (
    <div
        className={cx(styles.container, {
            [styles.pointer]: props.isIFrame && !props.isJustComment,
            [styles.iframe]: props.isIFrame,
            [styles.active]: props.isActive,
        })}
        id={props.id}
        onClick={
            props.isIFrame && !props.isJustComment ? props.goToAnnotation : null
        }
        // onMouseEnter={props.onMouseEnter}
        // onMouseLeave={props.onMouseLeave}
    >
        <div className={styles.timestamp}>
            {!!props.dateDetails.lastEdited && (
                <span className={styles.lastEdit}>Last Edit: </span>
            )}
            {props.dateDetails.timestamp}
        </div>

        {!props.isJustComment && (
            <div className={styles.highlight}>
                "{props.truncatedHighlightText}"{props.showMoreHighlight}
            </div>
        )}

        <div
            className={cx({
                [styles.annotationText]: props.shouldCommentBoxBeVisible,
                [styles.isJustComment]: props.isJustComment,
            })}
        >
            {props.truncatedAnnotationText}
            {props.annotationEditMode && props.showMoreAnnotation}
            <div className={props.tagClasses}>
                {props.tags.map((tag, i) => (
                    <span key={i} className={styles.tagPill}>
                        {tag.name}
                    </span>
                ))}
            </div>
        </div>

        {props.renderAnnotationInput()}

        <div className={styles.footer}>{props.renderFooter()}</div>
    </div>
)

// Annotation.propTypes = {
//     truncatedHighlightText: PropTypes.string.isRequired,
//     showMoreHighlight: PropTypes.node,
//     showMoreAnnotation: PropTypes.node,
//     truncatedAnnotationText: PropTypes.string.isRequired,
//     annotationEditMode: PropTypes.bool.isRequired,
//     tagClasses: PropTypes.string.isRequired,
//     tags: PropTypes.arrayOf(
//         PropTypes.shape({
//             name: PropTypes.string.isRequired,
//             url: PropTypes.string.isRequired,
//         }),
//     ),
//     dateDetails: PropTypes.shape({
//         timestamp: PropTypes.string.isRequired,
//         lastEdited: PropTypes.number,
//     }),
//     renderAnnotationInput: PropTypes.func.isRequired,
//     renderFooter: PropTypes.func.isRequired,
//     goToAnnotation: PropTypes.func.isRequired,
//     isIFrame: PropTypes.bool.isRequired,
//     shouldCommentBoxBeVisible: PropTypes.bool.isRequired,
//     isJustComment: PropTypes.bool.isRequired,
//     isActive: PropTypes.bool.isRequired,
//     isHovered: PropTypes.bool.isRequired,
//     onMouseEnter: PropTypes.func.isRequired,
//     onMouseLeave: PropTypes.func.isRequired,
//     id: PropTypes.string.isRequired,
// }

export default AnnotationBox
