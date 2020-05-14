import React from 'react'
import { storiesOf } from '@storybook/react'
import NoResultBadTerm from 'src/overview/results/components/NoResultBadTerm'

storiesOf('Results list', module).add('No results found', () => (
    <NoResultBadTerm title="Heading">
        Message, lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
        eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
        minim veniam
    </NoResultBadTerm>
))
