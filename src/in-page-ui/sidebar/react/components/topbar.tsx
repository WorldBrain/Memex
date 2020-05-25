import * as React from 'react'
import cx from 'classnames'

import { ButtonTooltip } from 'src/common-ui/components/'
import CloseButton from './close-button'
import SearchBox from './search-box'
import { SidebarEnv } from '../types'

const styles = require('./topbar.css')

export interface TopbarState {
    env: SidebarEnv
    searchValue: string
    showClearFiltersBtn: boolean
    disableAddCommentBtn: boolean
}

export interface TopbarProps extends TopbarState {
    handleSearchChange: (searchQuery: string) => void
    handleSearchEnter: (e: React.KeyboardEvent<HTMLInputElement>) => void
    handleClearBtn: (e: React.MouseEvent<HTMLButtonElement>) => void
    handleFilterBtnClick: () => void
    handleCloseBtnClick: () => void
    handleSettingsBtnClick: () => void
    handleAddCommentBtnClick: () => void
    handleClearFiltersBtnClick: React.MouseEventHandler<HTMLSpanElement>
}

/* tslint:disable-next-line variable-name */
class Topbar extends React.Component<TopbarProps> {
    private renderCloseButton() {
        return (
            <ButtonTooltip tooltipText="Close (ESC)" position="rightCentered">
                <CloseButton
                    title="Close sidebar once. Disable via Memex icon in the extension toolbar."
                    clickHandler={(e) => {
                        e.stopPropagation()
                        this.props.handleCloseBtnClick()
                    }}
                />
            </ButtonTooltip>
        )
    }

    private renderSearchBox() {
        return (
            <>
                <SearchBox
                    placeholder="Search Memex"
                    searchValue={this.props.searchValue}
                    onSearchChange={this.props.handleSearchChange}
                    onSearchEnter={this.props.handleSearchEnter}
                    onClearBtn={this.props.handleClearBtn}
                />
                {/* <button
                onClick={props.handleFilterBtnClick}
                className={cx(styles.filterButton, {
                    [styles.filterButtonActive]: props.showClearFiltersBtn,
                })}
            >
                Filters
                {props.showClearFiltersBtn && (
                    <ButtonTooltip
                        position="bottom"
                        tooltipText={'Clear filters'}
                    >
                        <span
                            className={styles.clearFilters}
                            onClick={props.handleClearFiltersBtnClick}
                        />
                    </ButtonTooltip>
                )}
            </button> */}
            </>
        )
    }

    private renderAddNoteButton() {
        return (
            <div className={styles.right}>
                <ButtonTooltip
                    tooltipText="Add notes to page"
                    position="leftNarrow"
                >
                    <button
                        className={cx(styles.button, styles.comments, {
                            [styles.disabled]: this.props.disableAddCommentBtn,
                        })}
                        onClick={(e) => {
                            e.stopPropagation()
                            this.props.handleAddCommentBtnClick()
                        }}
                    />
                </ButtonTooltip>
            </div>
        )
    }

    render() {
        if (this.props.env === 'overview') {
            return (
                <div className={styles.topbar}>
                    {this.renderCloseButton()}
                    {this.renderAddNoteButton()}
                </div>
            )
        }

        return <div className={styles.topbar}>{this.renderSearchBox()}</div>
    }
}

export default Topbar
