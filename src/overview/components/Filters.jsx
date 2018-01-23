import React from 'react'
import PropTypes from 'prop-types'

import localStyles from './Filters.css'

const Filters = ({
    showOnlyBookmarks,
    onShowOnlyBookmarksChange,
    clearAllFilters,
    isClearFilterButtonShown,
    tagFilterManager,
    domainFilterManager,
    onFilterClick,
    setTagDomainButtonRef,
    tagFilterPills,
    domainFilterPills,
}) => (
    <div className={localStyles.filtersMain}>
        <div className={localStyles.filters}>
            <div
                style={{
                    visibility: `${isClearFilterButtonShown
                        ? 'visible'
                        : 'hidden'}`,
                }}
                className={localStyles.clearDiv}
            >
                {isClearFilterButtonShown && (
                    <button
                        type="button"
                        onClick={clearAllFilters}
                        className={localStyles.clear}
                    >
                        Clear Filters
                    </button>
                )}
            </div>
            <div className={localStyles.tags}>
                <div
                    className={localStyles.filterTagText}
                    onClick={() => onFilterClick('tag')}
                >
                    Tags
                    <div
                        className={localStyles.filterTagIcon}
                        ref={setTagDomainButtonRef}
                    />
                </div>
                <div className={localStyles.tagsFilter}>{tagFilterPills}</div>
                <div className={localStyles.tagsPopup}>{tagFilterManager}</div>
            </div>
            <div className={localStyles.domains}>
                <div
                    className={localStyles.filterDomainText}
                    onClick={() => onFilterClick('domain')}
                >
                    Domains
                    <div
                        className={localStyles.filterDomainIcon}
                        ref={setTagDomainButtonRef}
                    />
                </div>
                <div className={localStyles.tagsFilter}>
                    {domainFilterPills}
                </div>
                <div className={localStyles.domainsPopup}>
                    {domainFilterManager}
                </div>
            </div>
            <div className={localStyles.misc}>
                <div className={localStyles.filterMiscText}>Misc</div>
                <div className={localStyles.bookmarks}>
                    <input
                        type="checkbox"
                        name="showOnlyBookmarks"
                        id="showOnlyBookmarks"
                        checked={showOnlyBookmarks}
                        onChange={onShowOnlyBookmarksChange}
                    />
                    <label htmlFor="showOnlyBookmarks">
                        <span className={localStyles.checkboxText}>
                            Only Show Bookmarks
                        </span>
                    </label>
                </div>
            </div>
        </div>
    </div>
)

Filters.propTypes = {
    showOnlyBookmarks: PropTypes.bool.isRequired,
    onShowOnlyBookmarksChange: PropTypes.func.isRequired,
    clearAllFilters: PropTypes.func.isRequired,
    isClearFilterButtonShown: PropTypes.bool.isRequired,
    tagFilterManager: PropTypes.node,
    domainFilterManager: PropTypes.node,
    onFilterClick: PropTypes.func.isRequired,
    setTagDomainButtonRef: PropTypes.func.isRequired,
    tagFilterPills: PropTypes.node,
    domainFilterPills: PropTypes.node,
}

export default Filters
