import * as React from 'react'
import cx from 'classnames'

const styles = require('./annotation-box-default-footer.css')

interface Props {
    editIconClickHandler: () => void
    trashIconClickHandler: () => void
    shareIconClickHandler: () => void
    replyIconClickHandler: () => void
}

/* tslint:disable-next-line variable-name */
const AnnotationBoxDefaultFooter = ({
    editIconClickHandler,
    trashIconClickHandler,
    shareIconClickHandler,
    replyIconClickHandler,
}: Props) => (
    <React.Fragment>
        <span
            className={cx(styles.commonIcon, styles.editIcon)}
            onClick={e => {
                e.stopPropagation()
                editIconClickHandler()
            }}
        />
        <span
            className={cx(styles.commonIcon, styles.trashIcon)}
            onClick={e => {
                e.stopPropagation()
                trashIconClickHandler()
            }}
        />
        <span
            className={cx(styles.commonIcon, styles.shareIcon)}
            onClick={e => {
                e.stopPropagation()
                shareIconClickHandler()
            }}
        />
        <span
            className={cx(styles.commonIcon, styles.replyIcon)}
            onClick={e => {
                e.stopPropagation()
                replyIconClickHandler()
            }}
        />
    </React.Fragment>
)

export default AnnotationBoxDefaultFooter
