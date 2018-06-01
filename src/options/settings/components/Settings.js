import React from 'react'

import { Wrapper } from '../../../common-ui/components'
import SearchInjection from './SearchInjectionContainer'
import IndexingPrefs from './IndexingPrefsContainer'

export default () => (
    <Wrapper>
        <SearchInjection />
        <IndexingPrefs />
    </Wrapper>
)
