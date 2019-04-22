import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './IndexDropdown.css'

/**
 * @augments {PureComponent<{onTagSearchChange: any, onTagSearchKeyDown: any, setInputRef: any, numberOfTags: any, tagSearchValue: any, clearSearchField?: any, showClearfieldBtn?: any}, *>}
 */
class IndexDropdown extends PureComponent {
    static propTypes = {
        children: PropTypes.array.isRequired,
        onTagSearchChange: PropTypes.func.isRequired,
        onTagSearchKeyDown: PropTypes.func.isRequired,
        setTagDivRef: PropTypes.func,
        setInputRef: PropTypes.func.isRequired,
        tagSearchValue: PropTypes.string.isRequired,
        hover: PropTypes.bool,
        isForAnnotation: PropTypes.bool,
        source: PropTypes.oneOf(['tag', 'domain', 'list']).isRequired,
        url: PropTypes.string,
        allowAdd: PropTypes.bool,
        isForSidebar: PropTypes.bool,
        // clearSearchField: PropTypes.func,
        // showClearfieldBtn: PropTypes.bool,
        isForRibbon: PropTypes.bool,
        onBackBtnClick: PropTypes.func,
        allTabs: PropTypes.bool,
        allTabsCollection: PropTypes.bool,
        sidebarTagDiv: PropTypes.bool,
    }

    get mainClass() {
        return cx(styles.tagDiv, {
            [styles.tagDivFromOverview]: this.props.hover,
            [styles.tagDivForAnnotations]: this.props.isForAnnotation,
            [styles.tagDivForFilter]: !this.props.url,
            [styles.tagDivForFilterSB]: this.props.isForSidebar,
            [styles.tagDivForSidebarResults]: this.props.sidebarTagDiv,
        })
    }

    get searchPlaceholder() {
        return `Search & Add ${this.placeholder}`
    }

    get placeholder() {
        let placeholder
        switch (this.props.source) {
            case 'tag':
                placeholder = 'Tags'
                break
            case 'domain':
                placeholder = 'Domains'
                break
            case 'list':
                placeholder = 'Lists'
                break
            default:
        }
        return placeholder
    }

    get unit() {
        return this.placeholder.toLowerCase()
    }

    render() {
        return (
            <div className={this.mainClass} ref={this.props.setTagDivRef}>
                <div
                    className={cx(styles.searchContainer, {
                        [styles.commentBox]: this.props.allowAdd,
                    })}
                >
                    <span className={styles.searchIcon} />
                    <input
                        className={styles.search}
                        name="query"
                        placeholder={this.searchPlaceholder}
                        onChange={this.props.onTagSearchChange}
                        onKeyDown={this.props.onTagSearchKeyDown}
                        ref={this.props.setInputRef}
                        autoComplete="off"
                        value={this.props.tagSearchValue}
                        autoFocus
                    />
                </div>
                {this.props.allTabs && (
                    <p className={styles.allTabs}>
                        Add tags to all tabs in window
                    </p>
                )}
                {this.props.allTabsCollection && (
                    <p className={styles.allTabs}>
                        Add all tabs in window to collections
                    </p>
                )}
                <div
                    className={cx(styles.tagContainer, {
                        [styles.tagContainerAnnotations]: this.props
                            .isForAnnotation,
                    })}
                >
                    <div className={styles.TagBox}>{this.props.children}</div>
                </div>
                {!this.props.isForSidebar &&
                    !this.props.isForAnnotation &&
                    !this.props.isForRibbon && (
                        <div className={styles.summaryTagContainer}>
                            <button
                                className={styles.backButton}
                                onClick={this.props.onBackBtnClick}
                            >
                                Back
                            </button>
                        </div>
                    )}
            </div>
        )
    }
}

export default IndexDropdown
