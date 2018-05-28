import React from 'react'
import PropTypes from 'prop-types'

import localStyles from './Filters.css'

const Filters = props => (
    <div className={localStyles.filtersMain}>
        <div className={localStyles.filters}>
            <div className={localStyles.clearDiv}>
                {props.isClearFilterButtonShown && (
                    <button
                        type="button"
                        onClick={props.clearAllFilters}
                        className={localStyles.clear}
                    >
                        Clear Filters
                    </button>
                )}
            </div>
            <div className={localStyles.tags}>
                <div
                    className={localStyles.filterTagText}
                    onClick={props.handleFilterClick('tag')}
                >
                    Tags
                    <div
                        className={localStyles.filterTagIcon}
                        ref={props.setDropdownRef}
                    />
                </div>
                <div className={localStyles.tagsFilter}>
                    {props.tagFilterPills}
                </div>
                <div className={localStyles.tagsPopup}>
                    {props.tagFilterManager}
                </div>
            </div>
            <div className={localStyles.domains}>
                <div
                    className={localStyles.filterDomainText}
                    onClick={props.handleFilterClick('domain')}
                >
                    Domains
                    <div
                        className={localStyles.filterDomainIcon}
                        ref={props.setDropdownRef}
                    />
                </div>
                <div className={localStyles.tagsFilter}>
                    {props.domainFilterPills}
                </div>
                <div className={localStyles.domainsPopup}>
                    {props.domainFilterManager}
                </div>
            </div>
            <div className={localStyles.misc}>
                <div className={localStyles.filterMiscText}>Misc</div>
                <div className={localStyles.bookmarks}>
                    <input
                        type="checkbox"
                        name="showOnlyBookmarks"
                        id="showOnlyBookmarks"
                        checked={props.showOnlyBookmarks}
                        onChange={props.onShowOnlyBookmarksChange}
                    />
                    <label htmlFor="showOnlyBookmarks">
                        Only Show Bookmarks
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
    handleFilterClick: PropTypes.func.isRequired,
    setDropdownRef: PropTypes.func.isRequired,
    tagFilterPills: PropTypes.node,
    domainFilterPills: PropTypes.node,
}

export default Filters
