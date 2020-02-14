import React from 'react'
import cx from 'classnames'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'

const styles = require('./search-type-switch.css')

export interface Props {
    showSocialSearch: boolean
    annotsFolded: boolean
    isFilterBarActive: boolean
    searchType: 'page' | 'notes' | 'social'
    handleUnfoldAllClick: React.MouseEventHandler<HTMLButtonElement>
    handleSearchTypeClick: (
        searchType: 'page' | 'notes' | 'social',
    ) => React.MouseEventHandler<HTMLButtonElement>
}

export class SearchTypeSwitch extends React.PureComponent<Props> {
    get unfoldBtnText() {
        return this.props.annotsFolded ? 'Fold All' : 'Unfold All'
    }

    get isPageSearch() {
        return this.props.searchType === 'page'
    }

    get isAnnotSearch() {
        return this.props.searchType === 'notes'
    }

    get isSocialSearch() {
        return this.props.searchType === 'social'
    }

    render() {
        return (
            <div
                className={cx(styles.container, {
                    [styles.filterBarActive]: this.props.isFilterBarActive,
                })}
            >
                <div className={styles.switchContainer}>
                    <button
                        className={cx(
                            styles.searchSwitchBtn,
                            styles.btn,
                            styles.pages,
                        )}
                        onClick={this.props.handleSearchTypeClick('page')}
                        disabled={this.isPageSearch}
                        id="pages"
                    >
                        Pages
                    </button>
                    <button
                        className={cx(styles.searchSwitchBtn, styles.btn)}
                        onClick={this.props.handleSearchTypeClick('notes')}
                        disabled={this.isAnnotSearch}
                    >
                        Notes
                    </button>
                    {this.props.showSocialSearch && (
                        <button
                            className={cx(styles.searchSwitchBtn, styles.btn)}
                            onClick={this.props.handleSearchTypeClick('social')}
                            disabled={this.isSocialSearch}
                        >
                            Social
                            <span className={styles.betaBox}>
                                <ButtonTooltip
                                    tooltipText="Saving Tweets is in beta mode. Bugs may appear. Let us know: support@worldbrain.io or github.com/worldbrain"
                                    position="bottom"
                                >
                                    <span className={styles.beta}>beta</span>
                                </ButtonTooltip>
                            </span>
                        </button>
                    )}
                </div>
                {this.isAnnotSearch && (
                    <button
                        className={cx(styles.unfoldAllBtn, styles.btn)}
                        onClick={this.props.handleUnfoldAllClick}
                        disabled={this.isPageSearch}
                    >
                        {this.unfoldBtnText}
                    </button>
                )}
            </div>
        )
    }
}
