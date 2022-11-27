import React from 'react'
import PropTypes from 'prop-types'
import SettingSection from '@worldbrain/memex-common/lib/common-ui/components/setting-section'

const SearchInjection = ({ children }) => {
    return (
        <SettingSection
            title={'Search Engine Integration'}
            icon={'searchIcon'}
            description={'Show Memex results alongside your web search results'}
        >
            {children}
        </SettingSection>
    )
}

SearchInjection.propTypes = {
    children: PropTypes.arrayOf(PropTypes.element).isRequired,
}

export default SearchInjection
