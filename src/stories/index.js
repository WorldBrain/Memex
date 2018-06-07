import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import 'babel-polyfill'

import ResultItem from '../search-injection/components/ResultItem'
import TooltipContainer from '../content-tooltip/components/container'

storiesOf('Result Item', module).add('with all props', () => (
    <ResultItem
        searchEngine="google"
        displayTime={new Date()}
        url="https://google.com"
        title="Google"
        onLinkClick={() => console.log('link clicked')}
    />
))

storiesOf('Memex Tooltip', module).add('default', () => (
    <TooltipContainer
        onInit={showTooltip => console.log('Show tooltip')}
        destroy={() => console.log('Destroy')}
        createAndCopyDirectLink={() => console.log('Create and copy')}
        openSettings={() => console.log('Open settings')}
    />
))
