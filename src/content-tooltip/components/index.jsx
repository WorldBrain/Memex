import React from 'react'
import ReactDOM from 'react-dom'
import TooltipContainer from './container'

export function setupUIContainer(
    target,
    {
        createAndCopyDirectLink,
        openSettings,
        destroyTooltip,
        disableTooltip,
        createAnnotation,
    },
) {
    return new Promise(async resolve => {
        const closeMessageShownKey = 'tooltip.close-message-shown'
        const { [closeMessageShownKey]: closeMessageShown } = await window[
            'browser'
        ].storage.local.get({ [closeMessageShownKey]: false })
        const onCloseMessageShown = () => {
            window['browser'].storage.local.set({
                [closeMessageShownKey]: true,
            })
        }

        ReactDOM.render(
            <TooltipContainer
                onInit={showTooltip => resolve(showTooltip)}
                destroy={destroyTooltip}
                disable={disableTooltip}
                closeMessageShown={closeMessageShown}
                onCloseMessageShown={onCloseMessageShown}
                createAndCopyDirectLink={createAndCopyDirectLink}
                createAnnotation={createAnnotation}
                openSettings={openSettings}
            />,
            target,
        )
    })
}

export function destroyUIContainer(target) {
    ReactDOM.unmountComponentAtNode(target)
}
