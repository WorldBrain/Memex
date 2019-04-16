import * as React from 'react'
import cx from 'classnames'
import { Tooltip, ButtonTooltip } from 'src/common-ui/components/'
import CloseButton from './close-button'
import SearchBox from './search-box'

const styles = require('./topbar.css')

interface Props {
    searchValue: string
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
    handleClearBtn: (e: React.MouseEvent<HTMLButtonElement>) => void
    handleFilterBtnClick: () => void
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
    ...props
}: Props) => (
    <div className={styles.topbar}>
        <SearchBox
            placeholder={'Search Memex'}
            searchValue={props.searchValue}
            onSearchChange={props.handleChange}
            onSearchEnter={props.handleSearchKeyDown}
            onClearBtn={props.handleClearBtn}
        />
        <button 
            onClick={props.handleFilterBtnClick}
            className={styles.filterButton}
        >
            Filters
        </button>
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
