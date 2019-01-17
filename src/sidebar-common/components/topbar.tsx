import * as React from 'react'
import cx from 'classnames'

import CloseButton from './close-button'

const styles = require('./topbar.css')

interface Props {
    disableAddCommentBtn: boolean
    handleCloseBtnClick: () => void
    handleSettingsBtnClick: () => void
    handleAddCommentBtnClick: () => void
}

/* tslint:disable-next-line variable-name */
const Topbar = ({
    disableAddCommentBtn,
    handleCloseBtnClick,
    handleSettingsBtnClick,
    handleAddCommentBtnClick,
}: Props) => (
    <div className={styles.topbar}>
        {/* Button to close sidebar. */}
        <CloseButton
            title="Close sidebar once. Disable via Memex icon in the extension toolbar."
            clickHandler={e => {
                e.stopPropagation()
                handleCloseBtnClick()
            }}
        />

        <div className={styles.right}>
            {/* Button to open settings. */}
            <span
                title="Open settings."
                className={styles.settingsBtn}
                onClick={e => {
                    e.stopPropagation()
                    handleSettingsBtnClick()
                }}
            />

            {/* Button to add a comment. */}
            <div
                title="Add a comment."
                className={cx(styles.addCommentBtn, {
                    [styles.disabled]: disableAddCommentBtn,
                })}
                onClick={e => {
                    e.stopPropagation()
                    handleAddCommentBtnClick()
                }}
            >
                Add Comment
            </div>
        </div>
    </div>
)

export default Topbar
