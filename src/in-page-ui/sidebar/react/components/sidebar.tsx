import * as React from 'react'
import cx from 'classnames'
import Menu from 'react-burger-menu/lib/menus/slide'
import menuStyles from './menu-styles'

const styles = require('./sidebar.css')

interface SidebarProps {
    env: 'inpage' | 'overview'
    isOpen: boolean
    isLoading: boolean
}

export default class Sidebar extends React.PureComponent<SidebarProps> {
    render() {
        return (
            <React.Fragment>
                <Menu
                    isOpen={this.props.isOpen}
                    width={450}
                    styles={menuStyles(this.props.env, this.props.isOpen)}
                    right
                    noOverlay
                    disableCloseOnEsc
                >
                    <div className={styles.sidebar}>
                        <div className={styles.topSection}>
                            {/* <Topbar
                                {...this.props}
                                disableAddCommentBtn={showCommentBox}
                                handleCloseBtnClick={this.handleCloseBtnClick}
                                handleSettingsBtnClick={
                                    this._handleSettingsBtnClick
                                }
                                handleAddCommentBtnClick={
                                    handleAddCommentBtnClick
                                }
                                handleSearchChange={this.handleSearchChange}
                                handleSearchEnter={this.handleSearchEnter}
                                handleClearBtn={this.handleClearBtn}
                                handleFilterBtnClick={this.toggleShowFilters}
                                handleClearFiltersBtnClick={
                                    this.handleClearFiltersBtnClick
                                }
                            /> */}
                            {this.props.env === 'inpage' && (
                                <React.Fragment>
                                    <div className={styles.searchSwitch}>
                                        {/* <SearchTypeSwitch
                                            isOverview={
                                                this.props.env === 'overview'
                                            }
                                            handleAddCommentBtnClick={
                                                handleAddCommentBtnClick
                                            }
                                            showSocialSearch={
                                                this.state.showSocialSearch
                                            } */}
                                        />
                                    </div>
                                    {/* <PageInfo
                                        page={this.props.page}
                                        isCurrentPage={this.isCurrentPageSearch}
                                        resetPage={this.props.resetPage}
                                    /> */}
                                </React.Fragment>
                            )}
                        </div>
                        <div>
                            {/* {showCommentBox && (
                                <div className={styles.commentBoxContainer}>
                                    <CommentBoxContainer
                                        env={env}
                                        isSocialPost={this.props.isSocialPost}
                                    />
                                </div>
                            )} */}
                        </div>
                        <div
                            className={cx(styles.resultsContainer, {
                                [styles.resultsContainerPage]:
                                    this.props.env === 'overview',
                            })}
                        >
                            {/* {!this.isCurrentPageSearch ? (
                                this.renderResults()
                            ) : this.props.isLoading &&
                              !this.props.appendLoader ? (
                                <LoadingIndicator />
                            ) : annotations.length === 0 ? (
                                <EmptyMessage />
                            ) : (
                                <div className={styles.annotationsSection}>
                                    {this.renderAnnots()}
                                    {showCongratsMessage && <CongratsMessage />}
                                </div>
                            )} */}
                        </div>
                    </div>
                </Menu>
                {/* {this.state.showFiltersSidebar && (
                    <FiltersSidebarContainer
                        env={this.props.env}
                        toggleShowFilters={this.toggleShowFilters}
                    />
                )} */}
            </React.Fragment>
        )
    }
}
