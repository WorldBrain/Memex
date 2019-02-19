import React from 'react'

import SearchInjection from './SearchInjectionContainer'
import IndexingPrefs from './IndexingPrefsContainer'
import Tooltip from './Tooltip'
import Ribbon from './Ribbon'
import KeyboardShortcutsContainer from './keyboard-shortcuts-container'

export default () => (
    <React.Fragment>
        <SearchInjection />
        <Tooltip />
        <Ribbon />
        <IndexingPrefs />
        <KeyboardShortcutsContainer />
    </React.Fragment>
)
