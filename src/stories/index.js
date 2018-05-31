import React from 'react'
import { storiesOf } from '@storybook/react'
import ResultItem from '../search-injection/components/ResultItem'

storiesOf('Result Item', module).add('with all props', () => (
    <ResultItem
        searchEngine="google"
        displayTime={new Date()}
        url="https://google.com"
        title="Google"
        onLinkClick={() => console.log('link clicked')}
    />
))
