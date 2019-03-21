import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './IndexDropdown.css'
import annotationStyles from './IndexDropdownAnnotation.css'
import sidebarStyles from './IndexDropdownSidebar.css'

/**
 * @augments {PureComponent<{onTagSearchChange: any, onTagSearchKeyDown: any, setInputRef: any, numberOfTags: any, tagSearchValue: any, clearSearchField?: any, showClearfieldBtn?: any}, *>}
 */
class IndexDropdown extends PureComponent {
    static propTypes = {
        children: PropTypes.array.isRequired,
        onTagSearchChange: PropTypes.func.isRequired,
        onTagSearchKeyDown: PropTypes.func.isRequired,
        numberOfTags: PropTypes.number.isRequired,
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
    }

    get styles() {
        if (this.props.isForAnnotation) {
            return annotationStyles
        } else if (this.props.isForSidebar) {
            return sidebarStyles
        }
        return styles
    }

    get mainClass() {
        return cx(this.styles.tagDiv, {
            [this.styles.tagDivFromOverview]: this.props.hover,
            [this.styles.tagDivForFilter]: !this.props.url,
            [this.styles.tagDivForFilterSB]: this.props.isForSidebar,
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
                    className={cx(this.styles.searchContainer, {
                        [this.styles.commentBox]: this.props.allowAdd,
                    })}
                >
                    <span className={styles.searchIcon} />
                    <input
                        className={this.styles.search}
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
                    className={cx(this.styles.tagContainerSB, {
                        [this.styles.tagContainer]: this.props.isForSidebar,
                        [this.styles.remove]: !this.props.children.length,
                    })}
                >   
                <div className={styles.TagBox}>
                    {this.props.children}
                </div>
                </div>
                {!this.props.isForSidebar && (
                    <div className={this.styles.summaryTagContainer}>
                        {!this.props.isForAnnotation &&
                            !this.props.isForRibbon && (
                                <button
                                    className={this.styles.backButton}
                                    onClick={this.props.onBackBtnClick}
                                >
                                    Back
                                </button>
                            )}
                        <div className={this.styles.numberTags}>
                            <span className={this.styles.bold}>
                                {this.props.numberOfTags}
                            </span>{' '}
                            {this.unit} selected
                        </div>
                    </div>
                )}
            </div>
        )
    }
}

export default IndexDropdown
