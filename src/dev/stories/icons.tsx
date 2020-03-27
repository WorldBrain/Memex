import { storiesOf } from '@storybook/react'
import React from 'react'
import { Search, MinusCircle, Check, X as Xicon } from '@styled-icons/feather'

storiesOf('Icons', module).add('Icons', () => (
    <>
        <Search size={24} />
        <MinusCircle size={24} />
        <Check size={24} />
        <Xicon size={24} />
    </>
))
