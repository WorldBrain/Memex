import { storiesOf } from '@storybook/react'
import React from 'react'
import TagPill from 'src/common-ui/components/tag-pill'
import TagHolder from 'src/common-ui/components/tag-holder'

const tags = ['tag', 'tag2']

storiesOf('Tags Current', module)
    .add('Tag Holder - Sidebar', () => (
        <div>
            <TagHolder
                tags={tags}
                maxTagsLimit={2}
                handlePillClick={() => undefined}
                env="sidebar"
            />
        </div>
    ))

    .add('Tag Pill', () => (
        <div>
            <TagPill value="tag" />
        </div>
    ))
