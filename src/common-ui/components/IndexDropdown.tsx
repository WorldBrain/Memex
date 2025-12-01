import React, { MouseEventHandler, PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import TextInputControlled from 'src/common-ui/components/TextInputControlled'

const searchImg = chrome.runtime.getURL('/img/search.svg')

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

        return <p>{this.errMsg}</p>
    }

    render() {
        return (
            <div ref={this.props.setTagDivRef}>
                <div>
                    <span>
                        <img src={searchImg} />
                    </span>
                    <TextInputControlled
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
                {this.props.allTabs && <p>Add tags to all tabs in window</p>}
                {this.props.allTabsCollection && (
                    <p>Add all tabs in window to collections</p>
                )}
                <div>
                    <div>{this.props.children}</div>
                </div>
                {!this.props.isForSidebar &&
                    !this.props.isForAnnotation &&
                    !this.props.isForRibbon && (
                        <div>
                            <button onClick={this.props.onBackBtnClick}>
                                Back
                            </button>
                        </div>
                    )}
            </div>
        )
    }
}

export default IndexDropdown
