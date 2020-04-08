import { storiesOf } from '@storybook/react'
import * as knobs from '@storybook/addon-knobs'
import React from 'react'
import AnnotationBox from 'src/in-page-ui/sidebar/react/components/annotation-box'

const CREATED_WHEN = Date.now() - 1000 * 60 * 60

const stories = storiesOf('Sidebar - Annotation Box', module)
stories.addDecorator(knobs.withKnobs)

// stories.add('Random', () => (
//     <AnnotationBox
//         env={'inpage'}
//         url={'http://test.com'}
//         className={''}
//         isActive={true}
//         isHovered={true}
//         createdWhen={CREATED_WHEN}
//         lastEdited={CREATED_WHEN}
//         body={'Annotation body'}
//         comment={'Annotation commment'}
//         tags={['foo', 'bar']}
//         hasBookmark={true}
//         handleGoToAnnotation={() => {}}
//         handleMouseEnter={() => {}}
//         handleMouseLeave={() => {}}
//         handleEditAnnotation={() => {}}
//         handleDeleteAnnotation={() => {}}
//         handleBookmarkToggle={() => {}}
//         handleTagClick={() => {}}
//         highlighter={{} as any}
//         mode={'default'}
//         displayCrowdfunding={false}
//     />
// ))
