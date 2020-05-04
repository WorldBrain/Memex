import { storiesOf } from '@storybook/react'
import React from 'react'
import { BackContainer } from 'src/popup/components/BackContainer'
import { withGlobalStyles } from 'src/dev/stories/decorators'

const tags = ['initial', 'tag', 'abcde1', 'abcde2', 'tag 1', 'tag 2']

storiesOf('Popup components', module)
    .addDecorator(withGlobalStyles)
    .add('Back button', () => <BackContainer onClick={undefined} />)
