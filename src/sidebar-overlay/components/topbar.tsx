import * as React from 'react'
import cx from 'classnames'
import { Tooltip, ButtonTooltip } from 'src/common-ui/components/'
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

        <ButtonTooltip tooltipText="Close (ESC)" position="rightCentered">
            <CloseButton
                title="Close sidebar once. Disable via Memex icon in the extension toolbar."
                clickHandler={e => {
                    e.stopPropagation()
                    handleCloseBtnClick()
                }}
            />
        </ButtonTooltip>

        <div className={styles.right}>
            {/* Button to add a comment. */}
            <ButtonTooltip
                tooltipText="Add notes to page"
                position="leftNarrow"
            >
                <button
                    className={cx(styles.button, styles.comments, {
                        [styles.disabled]: disableAddCommentBtn,
                    })}
                    onClick={e => {
                        e.stopPropagation()
                        handleAddCommentBtnClick()
                    }}
                />
            </ButtonTooltip>
        </div>
    </div>
)

export default Topbar
