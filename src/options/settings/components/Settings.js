import React from 'react'

import SearchInjection from './SearchInjectionContainer'
import IndexingPrefs from './IndexingPrefsContainer'
import Tooltip from './Tooltip'

export default () => (
    <React.Fragment>
        <SearchInjection />
        <Tooltip />
        <IndexingPrefs />
    </React.Fragment>
)
