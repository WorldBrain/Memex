import React, { MouseEventHandler, PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import TextInputControlled from 'src/common-ui/components/TextInputControlled'

import { browser } from 'webextension-polyfill-ts'
const styles = require('./IndexDropdown.css')

const searchImg = browser.extension.getURL('/img/search.svg')

export interface Props {
    children?: any[]
    onTagSearchChange?: (s: string) => void
    onTagSearchSpecialKeyHandlers?: {
        test: (e) => boolean
        handle: (e) => void
    }[]
    setTagDivRef?: (e: Element) => void
    setInputRef?: (e: Element) => void
    tagSearchValue?: string
    hover?: boolean
    isForAnnotation?: boolean
    source?: 'tag' | 'domain' | 'list' | 'user' | 'hashtag'
    url?: string
    allowAdd?: boolean
    isForSidebar?: boolean
    clearSearchField?: () => void
    showClearfieldBtn?: boolean
    isForRibbon?: boolean
    onBackBtnClick?: (e: any) => void
    allTabs?: boolean
    allTabsCollection?: boolean
    sidebarTagDiv?: boolean
    showError?: boolean
    errMsg?: string
}

class IndexDropdown extends PureComponent<Props> {
    static propTypes = {
        children: PropTypes.array.isRequired,
        onTagSearchChange: PropTypes.func.isRequired,
        onTagSearchSpecialKeyHandlers: PropTypes.arrayOf(PropTypes.object),
        setTagDivRef: PropTypes.func,
        setInputRef: PropTypes.func.isRequired,
        tagSearchValue: PropTypes.string.isRequired,
        hover: PropTypes.bool,
        isForAnnotation: PropTypes.bool,
        source: PropTypes.oneOf(['tag', 'domain', 'list', 'user', 'hashtag'])
            .isRequired,
        url: PropTypes.string,
        allowAdd: PropTypes.bool,
        isForSidebar: PropTypes.bool,
        clearSearchField: PropTypes.func,
        showClearfieldBtn: PropTypes.bool,
        isForRibbon: PropTypes.bool,
        onBackBtnClick: PropTypes.func,
        allTabs: PropTypes.bool,
        allTabsCollection: PropTypes.bool,
        sidebarTagDiv: PropTypes.bool,
        showError: PropTypes.bool,
        errMsg: PropTypes.string,
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
            case 'user':
                placeholder = 'Users'
                break
            default:
        }
        return placeholder
    }

    get unit() {
        return this.placeholder.toLowerCase()
    }

    get errMsg() {
        return `ERROR: ${this.props.errMsg}`
    }

    renderError() {
        if (!this.props.showError) {
            return null
        }

        return <p className={styles.errMsg}>{this.errMsg}</p>
    }

    render() {
        return (
            <div className={this.mainClass} ref={this.props.setTagDivRef}>
                <div
                    className={cx(styles.searchContainer, {
                        [styles.commentBox]: this.props.allowAdd,
                    })}
                >
                    <span className={styles.searchIcon}>
                        <img src={searchImg} className={styles.searchImg} />
                    </span>
                    <TextInputControlled
                        className={styles.search}
                        name="query"
                        placeholder={this.searchPlaceholder}
                        onChange={this.props.onTagSearchChange}
                        updateRef={this.props.setInputRef}
                        autoComplete="off"
                        defaultValue={this.props.tagSearchValue}
                        autoFocus
                        specialHandlers={
                            this.props.onTagSearchSpecialKeyHandlers
                        }
                        type={'input'}
                    />
                </div>
                {this.renderError()}
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
