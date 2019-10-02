import * as React from 'react'
import cx from 'classnames'

const styles = require('./default-footer.css')

interface Props {
    displayGoToAnnotation: boolean
    isEdited: boolean
    timestamp: string
    hasBookmark: boolean
    goToAnnotationHandler: (e: React.MouseEvent<HTMLElement>) => void
    editIconClickHandler: () => void
    trashIconClickHandler: () => void
    handleBookmarkToggle: () => void
}

/* tslint:disable-next-line variable-name */
const DefaultFooter = ({
    timestamp,
    isEdited,
    hasBookmark,
    displayGoToAnnotation,
    goToAnnotationHandler,
    editIconClickHandler,
    trashIconClickHandler,
    handleBookmarkToggle,
}: Props) => (
    <div className={styles.annotationBoxDefaultFooter}>
        <div className={styles.timestamp}>
            {isEdited && <span className={styles.lastEdit}>Last Edit: </span>}
            {timestamp}
        </div>
        <div>
            <button
                className={cx(styles.commonIcon, styles.trashIcon)}
                title="Delete note"
                onClick={e => {
                    e.stopPropagation()
                    trashIconClickHandler()
                }}
            />
            {displayGoToAnnotation && (
                <button
                    className={cx(styles.commonIcon, styles.goToPageIcon)}
                    title="Go to annotation"
                    onClick={goToAnnotationHandler}
                />
            )}
            <button
                className={cx(styles.commonIcon, styles.editIcon)}
                title="Edit note"
                onClick={e => {
                    e.stopPropagation()
                    editIconClickHandler()
                }}
            />
            {/* <button
                className={cx(styles.commonIcon, styles.shareIcon)}
                title="Share this note"
                onClick={e => {
                    e.stopPropagation()
                    shareIconClickHandler()
                }}
            /> */}
            <button
                className={cx(styles.commonIcon, {
                    [styles.bookmark]: hasBookmark,
                    [styles.notBookmark]: !hasBookmark,
                })}
                title="Toggle star"
                onClick={e => {
                    e.stopPropagation()
                    handleBookmarkToggle()
                }}
            />
        </div>
    </div>
)

export default DefaultFooter
