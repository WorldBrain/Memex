import React from 'react'

import { Wrapper } from '../../../common-ui/components'
import SearchInjection from './SearchInjectionContainer'
import IndexingPrefs from './IndexingPrefsContainer'
import Tooltip from './Tooltip'

export default () => (
    <Wrapper>
        <SearchInjection />
        <Tooltip />
        <IndexingPrefs />
    </Wrapper>
)
