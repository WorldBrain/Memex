import * as React from 'react'
import cx from 'classnames'

import CloseButton from '../close-button'

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

        {/* Button to open settings. */}
        {/* TODO: Add a title perhaps? */}
        <span
            className={styles.settingsBtn}
            onClick={e => {
                e.stopPropagation()
                handleSettingsBtnClick()
            }}
        />

        {/* Button to add a comment. */}
        {/* TODO: Add a title perhaps? */}
        <div
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
)

export default Topbar
