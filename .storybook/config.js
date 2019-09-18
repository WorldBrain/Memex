import { configure } from '@storybook/react'

function loadStories() {
    require('../src/dev/stories/index.tsx')
}

configure(loadStories, module)
