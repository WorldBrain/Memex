import * as React from 'react'
import cx from 'classnames'

const styles = require('./default-footer.css')

interface Props {
    displayGoToAnnotation: boolean
    goToAnnotationHandler: (e: React.MouseEvent<HTMLElement>) => void
    editIconClickHandler: () => void
    trashIconClickHandler: () => void
    shareIconClickHandler: () => void
    replyIconClickHandler: () => void
}

/* tslint:disable-next-line variable-name */
const DefaultFooter = ({
    displayGoToAnnotation,
    goToAnnotationHandler,
    editIconClickHandler,
    trashIconClickHandler,
    shareIconClickHandler,
    replyIconClickHandler,
}: Props) => (
    <div className={styles.annotationBoxDefaultFooter}>
        <div>
            <span
                className={cx(styles.commonIcon, styles.editIcon)}
                title="Edit note"
                onClick={e => {
                    e.stopPropagation()
                    editIconClickHandler()
                }}
            />
            <span
                className={cx(styles.commonIcon, styles.trashIcon)}
                title="Delete note"
                onClick={e => {
                    e.stopPropagation()
                    trashIconClickHandler()
                }}
            />
            <span
                className={cx(styles.commonIcon, styles.shareIcon)}
                title="Share this note"
                onClick={e => {
                    e.stopPropagation()
                    shareIconClickHandler()
                }}
            />
            <span
                className={cx(styles.commonIcon, styles.replyIcon)}
                title="Reply to this note"
                onClick={e => {
                    e.stopPropagation()
                    replyIconClickHandler()
                }}
            />
        </div>
        <div>
            {displayGoToAnnotation && (
                <span
                    className={cx(styles.commonIcon, styles.goToPageIcon)}
                    title="Go to annotation"
                    onClick={goToAnnotationHandler}
                />
            )}
        </div>
    </div>
)

export default DefaultFooter
