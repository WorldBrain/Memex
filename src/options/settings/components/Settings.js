import React from 'react'

import SearchInjection from './SearchInjectionContainer'
import IndexingPrefs from './IndexingPrefsContainer'
import Tooltip from './Tooltip'
import Ribbon from './Ribbon'
import KeyboardShortcuts from './KeyboardShortcuts'

export default () => (
    <React.Fragment>
        <SearchInjection />
        <Tooltip />
        <Ribbon />
        <IndexingPrefs />
        <KeyboardShortcuts />
    </React.Fragment>
)
