import * as React from 'react'
import cx from 'classnames'

import {
    AnnotationSharingInfo,
    AnnotationSharingAccess,
} from 'src/content-sharing/ui/types'
import { AnnotationShareIconRenderer } from 'src/annotations/components/AnnotationShareIconRenderer'
import { LoadingIndicator } from 'src/common-ui/components'
import * as icons from 'src/common-ui/components/design-library/icons'

const styles = require('./default-footer.css')

export interface ShareAnnotationProps {
    sharingInfo?: AnnotationSharingInfo
    sharingAccess: AnnotationSharingAccess
    onShare: () => void
    onUnshare: () => void
}

interface Props extends ShareAnnotationProps {
    displayGoToAnnotation: boolean
    isEdited: boolean
    timestamp: string
    hasBookmark: boolean
    goToAnnotationHandler: (e: React.MouseEvent<HTMLElement>) => void
    editIconClickHandler: () => void
    trashIconClickHandler: () => void
    copyIconClickHandler?: () => void
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
    copyIconClickHandler,
    handleBookmarkToggle,
    ...props
}: Props) => (
    <div className={styles.annotationBoxDefaultFooter}>
        <div className={styles.timestamp}>
            {isEdited && <span className={styles.lastEdit}>Last Edit: </span>}
            {timestamp}
        </div>
        <div className={styles.buttonContainer}>
            {copyIconClickHandler && (
                <button
                    className={styles.commonIcon}
                    onClick={copyIconClickHandler}
                >
                    <img
                        src={icons.copy}
                        style={{ width: '100%', height: '100%' }}
                    />
                </button>
            )}
            <button
                className={cx(styles.commonIcon, styles.trashIcon)}
                title="Delete note"
                onClick={(e) => {
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
                onClick={(e) => {
                    e.stopPropagation()
                    editIconClickHandler()
                }}
            />
            <AnnotationShareIconRenderer
                {...props}
                renderShareIcon={(shareIconProps) => (
                    <button
                        className={styles.commonIcon}
                        onClick={shareIconProps.onClickAction}
                    >
                        {shareIconProps.isLoading ? (
                            <LoadingIndicator />
                        ) : (
                            <img
                                className={cx(styles.shareIcon, {
                                    [styles.shareIconDisabled]:
                                        shareIconProps.isDisabled,
                                })}
                                title={shareIconProps.tooltipText}
                                src={shareIconProps.imgSrc}
                            />
                        )}
                    </button>
                )}
            />
            <button
                className={cx(styles.commonIcon, {
                    [styles.bookmark]: hasBookmark,
                    [styles.notBookmark]: !hasBookmark,
                })}
                title="Toggle star"
                onClick={(e) => {
                    e.stopPropagation()
                    handleBookmarkToggle()
                }}
            />
        </div>
    </div>
)

export default DefaultFooter
