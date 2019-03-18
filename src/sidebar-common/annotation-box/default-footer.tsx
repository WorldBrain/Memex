import * as React from 'react'
import cx from 'classnames'

const styles = require('./default-footer.css')
const boxStyles = require('./annotation-box-container.css')

interface Props {
    displayGoToAnnotation: boolean
    isEdited: boolean
    timestamp: string
    goToAnnotationHandler: (e: React.MouseEvent<HTMLElement>) => void
    editIconClickHandler: () => void
    trashIconClickHandler: () => void
}

/* tslint:disable-next-line variable-name */
const DefaultFooter = ({
    timestamp,
    isEdited,
    displayGoToAnnotation,
    goToAnnotationHandler,
    editIconClickHandler,
    trashIconClickHandler,
}: Props) => (
    <div className={styles.annotationBoxDefaultFooter}>
        <div className={styles.timestamp}>
            {isEdited && <span className={styles.lastEdit}>Last Edit: </span>}
            {timestamp}
        </div>
        <div className={boxStyles.buttonBar}>
            <div>
                <button
                    className={cx(boxStyles.commonIcon, boxStyles.editIcon)}
                    title="Edit note"
                    onClick={e => {
                        e.stopPropagation()
                        editIconClickHandler()
                    }}
                />
                <button
                    className={cx(boxStyles.commonIcon, boxStyles.trashIcon)}
                    title="Delete note"
                    onClick={e => {
                        e.stopPropagation()
                        trashIconClickHandler()
                    }}
                />
                {/* <button
                    className={cx(styles.commonIcon, styles.shareIcon)}
                    title="Share this note"
                    onClick={e => {
                        e.stopPropagation()
                        shareIconClickHandler()
                    }}
                />*/}
            </div>
            <div>
                {displayGoToAnnotation && (
                    <button
                        className={cx(
                            boxStyles.commonIcon,
                            boxStyles.goToPageIcon,
                        )}
                        title="Go to annotation"
                        onClick={goToAnnotationHandler}
                    />
                )}
            </div>
        </div>
    </div>
)

export default DefaultFooter
