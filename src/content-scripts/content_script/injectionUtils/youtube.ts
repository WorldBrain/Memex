import { getHTML5VideoTimestamp } from '@worldbrain/memex-common/lib/editor/utils'
import { runtime } from 'webextension-polyfill'

export function loadYoutubeButtons(annotationsFunctions) {
    const below = document.querySelector('#below')
    const player = document.querySelector('#player')
    const url = new URL(window.location.href)
    const videoPath = url.pathname + '?v=' + url.searchParams.get('v')
    const selector = `#description-inline-expander .yt-core-attributed-string__link[href^="${videoPath}"]`
    const chapterContainer = document.querySelectorAll(selector)
    let hasChapterContainer = chapterContainer.length > 0

    if (below) {
        injectYoutubeButtonMenu(annotationsFunctions)
    }
    if (player) {
        injectYoutubeContextMenu(annotationsFunctions)
    }

    if (!below || !player || !hasChapterContainer) {
        // Create a new MutationObserver instance
        const observer = new MutationObserver(function (
            mutationsList,
            observer,
        ) {
            mutationsList.forEach(function (mutation) {
                mutation.addedNodes.forEach((node) => {
                    // Check if the added node is an HTMLElement
                    if (!player) {
                        if (node instanceof HTMLElement) {
                            // Check if the "player" element is in the added node or its descendants
                            if (node.querySelector('#player')) {
                                injectYoutubeContextMenu(annotationsFunctions)

                                if (below && player && hasChapterContainer) {
                                    observer.disconnect()
                                }
                            }
                        }
                    }
                    if (!below) {
                        if (node instanceof HTMLElement) {
                            // Check if the "below" element is in the added node or its descendants
                            if (node.querySelector('#below')) {
                                injectYoutubeButtonMenu(annotationsFunctions)

                                if (below && player && hasChapterContainer) {
                                    observer.disconnect()
                                }
                            }
                        }
                    }
                    if (!hasChapterContainer) {
                        if (node instanceof HTMLElement) {
                            // Check if the "below" element is in the added node or its descendants
                            if (
                                node.classList.contains(
                                    'yt-core-attributed-string__link',
                                )
                            ) {
                                if (
                                    node
                                        .getAttribute('href')
                                        .startsWith(videoPath)
                                ) {
                                    const selector2 = `#description-inline-expander .yt-core-attributed-string__link[href^="${videoPath}"]`
                                    const chapterTimestamps = document.querySelectorAll(
                                        selector2,
                                    )
                                    const chapterBlocks = []
                                    hasChapterContainer = true
                                    Array.from(chapterTimestamps).forEach(
                                        (block, i) => {
                                            const chapteblock =
                                                block.parentElement
                                            chapterBlocks.push(chapteblock)
                                        },
                                    )

                                    const firstBlock = chapterBlocks[0]

                                    const buttonIcon = runtime.getURL(
                                        '/img/memex-icon.svg',
                                    )

                                    const newBlock = document.createElement(
                                        'div',
                                    )
                                    newBlock.style.display = 'flex'
                                    newBlock.style.alignItems = 'center'
                                    newBlock.style.marginTop = '10px'
                                    newBlock.style.marginBottom = '10px'
                                    newBlock.style.flexWrap = 'wrap'
                                    newBlock.style.gap = '15px'
                                    newBlock.style.width = 'fit-content'
                                    newBlock.style.height = 'fit-content'
                                    newBlock.style.padding =
                                        '10px 16px 10px 16px'
                                    newBlock.style.borderRadius = '5px'
                                    newBlock.style.backgroundColor = '#12131B'
                                    newBlock.style.color = '#C6F0D4'
                                    newBlock.style.fontSize = '14px'
                                    newBlock.style.fontFamily = 'Arial'
                                    newBlock.style.cursor = 'pointer'
                                    newBlock.onclick = () => {
                                        annotationsFunctions.openChapterSummary()
                                    }
                                    newBlock.innerHTML = `<img src=${buttonIcon} style="height: 23px; padding-left: 2px; display: flex; grid-gap:5px; width: auto"/> <div style="white-space: nowrap">Summarize Chapters</div>`

                                    firstBlock.insertAdjacentElement(
                                        'beforebegin',
                                        newBlock,
                                    )
                                    injectYoutubeButtonMenu(
                                        annotationsFunctions,
                                    )

                                    if (below && player && chapterContainer) {
                                        observer.disconnect()
                                    }
                                }
                            }
                        }
                    }
                })
            })
        })

        // Start observing mutations to the document body
        observer.observe(document.body, { childList: true, subtree: true })
    }
}

export function injectYoutubeContextMenu(annotationsFunctions: any) {
    const config = { attributes: true, childList: true, subtree: true }
    const icon = runtime.getURL('/img/memex-icon.svg')

    const observer = new MutationObserver((mutation) => {
        const targetObject = mutation[0]
        const targetElement = targetObject.target as HTMLElement
        if (targetElement.className === 'ytp-popup ytp-contextmenu') {
            const targetChildren = targetElement.children
            let panel = null

            for (let i = 0; i < targetChildren.length; i++) {
                if (targetChildren[i].classList.contains('ytp-panel')) {
                    panel = targetChildren[i]
                    break
                }
            }
            if (panel == null) {
                return
            }
            const newEntry = document.createElement('div')
            newEntry.setAttribute('class', 'ytp-menuitem')
            newEntry.onclick = () =>
                annotationsFunctions.createAnnotation()(
                    false,
                    false,
                    false,
                    getTimestampNoteContentForYoutubeNotes(),
                )
            newEntry.innerHTML = `<div class="ytp-menuitem-icon"><img src=${icon} style="height: 23px; padding-left: 2px; display: flex; width: auto"/></div><div class="ytp-menuitem-label" style="white-space: nowrap, color: white">Add Note to current time</div>`
            panel.prepend(newEntry)
            // panel.style.height = "320px"
            observer.disconnect()
        }
    })

    observer.observe(document, config)
}

export async function getTimestampedNoteWithAIsummaryForYoutubeNotes() {
    const [startTimeURL] = getHTML5VideoTimestamp()
    const [endTimeURL] = getHTML5VideoTimestamp()

    const startTimeSecs = parseFloat(
        new URL(startTimeURL).searchParams.get('t'),
    )
    const endTimeSecs = parseFloat(new URL(endTimeURL).searchParams.get('t'))

    return [startTimeSecs, endTimeSecs]
}

export function getTimestampNoteContentForYoutubeNotes() {
    let videoTimeStampForComment: string | null

    const [videoURLWithTime, humanTimestamp] = getHTML5VideoTimestamp()

    if (videoURLWithTime != null) {
        videoTimeStampForComment = `[${humanTimestamp}](${videoURLWithTime})`

        return videoTimeStampForComment
    } else {
        return null
    }
}
export async function injectYoutubeButtonMenu(annotationsFunctions: any) {
    const YTchapterContainer = document.getElementsByClassName(
        'ytp-chapter-container',
    )

    if (YTchapterContainer.length > 0) {
        let container = YTchapterContainer[0] as HTMLElement
        container.style.display = 'flex'
        container.style.flex = '1'
        container.style.width = '250px'
    }

    const existingMemexButtons = document.getElementsByClassName(
        'memex-youtube-buttons',
    )
    if (existingMemexButtons.length > 0) {
        existingMemexButtons[0].remove()
    }

    const panel = document.getElementsByClassName('ytp-time-display')[0]
    // Memex Button Container
    const memexButtons = document.createElement('div')
    memexButtons.style.display = 'flex'
    memexButtons.style.alignItems = 'center'
    memexButtons.style.margin = '10px 0px'
    memexButtons.style.borderRadius = '6px'
    memexButtons.style.border = '1px solid #3E3F47'
    memexButtons.style.overflow = 'hidden'
    memexButtons.style.overflowX = 'scroll'
    memexButtons.style.backgroundColor = '#12131B'
    memexButtons.setAttribute('class', 'memex-youtube-buttons no-scrollbar')
    // Create a <style> element
    const style = document.createElement('style')

    // Add your CSS as a string
    style.textContent = `
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            scrollbar-width: none;
        }
        `

    // Assuming `memexButtons` is your DOM element

    document.head.appendChild(style)

    // Add screenshot Button
    const screenshotButton = document.createElement('div')
    screenshotButton.setAttribute('class', 'ytp-menuitem')
    screenshotButton.onclick = async () => {
        await annotationsFunctions.createTimestampWithScreenshot()
    }
    screenshotButton.style.display = 'flex'
    screenshotButton.style.alignItems = 'center'
    screenshotButton.style.cursor = 'pointer'
    screenshotButton.style.borderLeft = '1px solid #24252C'

    screenshotButton.innerHTML = `<div class="ytp-menuitem-label" id="screenshotButtonInner"  style="font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on; font-family: Satoshi, sans-serif; font-size: 14px;padding: 0px 12 0 6px; align-items: center; justify-content: center; white-space: nowrap; display: flex; align-items: center">Screenshot</div>`

    // Add Note Button
    const annotateButton = document.createElement('div')
    annotateButton.setAttribute('class', 'ytp-menuitem')
    annotateButton.onclick = async () => {
        const secondsInPastFieldNote = document.getElementById(
            'secondsInPastFieldNote',
        ) as HTMLInputElement
        const secondsInPastContainerNote = document.getElementById(
            'secondsInPastContainerNote',
        ) as HTMLInputElement

        const includeLastFewSecs = secondsInPastFieldNote.value
            ? parseInt(secondsInPastFieldNote.value)
            : 0

        await globalThis['browser'].storage.local.set({
            ['noteSecondsStorage']: includeLastFewSecs,
        })

        annotationsFunctions.createAnnotation()(
            false,
            false,
            false,
            getTimestampNoteContentForYoutubeNotes(),
            includeLastFewSecs,
        )
    }
    annotateButton.style.display = 'flex'
    annotateButton.style.alignItems = 'center'
    annotateButton.style.cursor = 'pointer'
    annotateButton.style.borderLeft = '1px solid #24252C'

    annotateButton.innerHTML = `<div class="ytp-menuitem-label" style="font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on; font-family: Satoshi, sans-serif; font-size: 14px;padding: 0px 12 0 6px; align-items: center; justify-content: center; white-space: nowrap; display: flex; align-items: center">Timestamped Note</div>`

    // Summarize Button
    const summarizeButton = document.createElement('div')
    summarizeButton.setAttribute('class', 'ytp-menuitem')
    summarizeButton.onclick = () => annotationsFunctions.askAI()(false, false)
    summarizeButton.style.display = 'flex'
    summarizeButton.style.alignItems = 'center'
    summarizeButton.style.cursor = 'pointer'
    summarizeButton.style.borderLeft = '1px solid #24252C'
    summarizeButton.innerHTML = `<div class="ytp-menuitem-label" style="font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on; font-family: Satoshi, sans-serif; font-size: 14px;padding: 0px 12 0 6px; align-items: center; justify-content: center; white-space: nowrap; display: flex; align-items: center">Summarize Video</div>`

    // Textfield for Smart Note
    const textField = document.createElement('input')
    textField.id = 'secondsInPastSetting'
    const smartNoteSecondsStorage = await globalThis[
        'browser'
    ].storage.local.get('smartNoteSecondsStorage')

    const smartNoteSeconds = smartNoteSecondsStorage.smartNoteSecondsStorage

    if (smartNoteSeconds) {
        textField.value = smartNoteSeconds
    }
    textField.setAttribute('type', 'text')
    textField.setAttribute('placeholder', '60s')
    textField.style.height = '100%'
    textField.style.width = '84px'
    textField.style.borderRadius = '6px'
    textField.style.padding = '5px 10px'
    textField.style.overflow = 'hidden'
    textField.style.background = 'transparent'
    textField.style.outline = 'none'
    textField.style.color = '#f4f4f4'
    textField.style.textAlign = 'center'
    textField.style.position = 'absolute'

    // Textfield for Regular Note
    const textFieldNote = document.createElement('input')
    textFieldNote.id = 'secondsInPastFieldNote'

    const noteSecondsStorage = await globalThis['browser'].storage.local.get(
        'noteSecondsStorage',
    )

    const noteSeconds = noteSecondsStorage.noteSecondsStorage

    if (noteSeconds) {
        textFieldNote.value = noteSeconds
    }

    textFieldNote.setAttribute('type', 'text')
    textFieldNote.setAttribute('placeholder', '0s')
    textFieldNote.style.height = '100%'
    textFieldNote.style.width = '84px'
    textFieldNote.style.borderRadius = '6px'
    textFieldNote.style.padding = '5px 10px'
    textFieldNote.style.overflow = 'hidden'
    textFieldNote.style.background = 'transparent'
    textFieldNote.style.outline = 'none'
    textFieldNote.style.color = '#f4f4f4'
    textFieldNote.style.textAlign = 'center'
    textFieldNote.style.position = 'absolute'

    // Stop click event propagation on the textfield to its parent
    textFieldNote.addEventListener('click', (event) => {
        event.stopPropagation()
    })

    // Add keyup event to the textfield for the "Enter" key
    textFieldNote.addEventListener('keyup', (event) => {
        if (event.key === 'Enter' || event.keyCode === 13) {
            annotateButton.click()
        }
    })

    textField.addEventListener('keyup', (event) => {
        if (event.key === 'Enter' || event.keyCode === 13) {
            AItimeStampButton.click()
        }
    })

    // Set maxLength to 3 to limit input to 999
    textField.setAttribute('maxlength', '3')
    textFieldNote.setAttribute('maxlength', '3')

    // Optional: use pattern attribute for native validation
    textField.setAttribute('pattern', '\\d{1,3}') // 1 to 3 digit numbers
    textFieldNote.setAttribute('pattern', '\\d{1,3}') // 1 to 3 digit numbers

    textField.addEventListener('input', (event) => {
        let value = (event.target as HTMLInputElement).value

        // Replace non-digit characters
        value = value.replace(/[^0-9]/g, '')

        // If number is greater than 999, set it to 999
        if (parseInt(value) > 999) {
            value = '999'
        }

        ;(event.target as HTMLInputElement).value = value
    })

    textFieldNote.addEventListener('input', (event) => {
        let value = (event.target as HTMLInputElement).value

        // Replace non-digit characters
        value = value.replace(/[^0-9]/g, '')

        // If number is greater than 999, set it to 999
        if (parseInt(value) > 999) {
            value = '999'
        }

        ;(event.target as HTMLInputElement).value = value
    })

    // Rewind Icon
    const rewindIcon = runtime.getURL('/img/historyYoutubeInjection.svg')
    const rewindIconEl = document.createElement('img')
    rewindIconEl.src = rewindIcon
    rewindIconEl.style.height = '18px'
    rewindIconEl.style.margin = '0 10px 0 10px'
    // Rewind Icon
    const rewindIcon2 = runtime.getURL('/img/historyYoutubeInjection.svg')
    const rewindIconEl2 = document.createElement('img')
    rewindIconEl2.src = rewindIcon2
    rewindIconEl2.style.height = '18px'
    rewindIconEl2.style.margin = '0 10px 0 10px'

    // TextField ADd NOTE Container
    const textFieldContainerNote = document.createElement('div')
    textFieldContainerNote.id = 'secondsInPastContainerNote'
    textFieldContainerNote.appendChild(rewindIconEl2)
    textFieldContainerNote.appendChild(textFieldNote)
    textFieldContainerNote.style.display = 'flex'
    textFieldContainerNote.style.alignItems = 'center'
    textFieldContainerNote.style.margin = '0 10px'
    textFieldContainerNote.style.borderRadius = '6px'
    textFieldContainerNote.style.outline = '1px solid #3E3F47'
    textFieldContainerNote.style.overflow = 'hidden'
    textFieldContainerNote.style.background = '#1E1F26'
    textFieldContainerNote.style.width = '84px'
    textFieldContainerNote.style.height = '26px'
    textFieldContainerNote.style.position = 'relative'

    textFieldContainerNote.addEventListener('click', (event) => {
        event.stopPropagation()
    })

    // TextField Smart Note Container
    const textFieldContainer = document.createElement('div')
    textFieldContainer.id = 'secondsInPastSettingContainer'
    textFieldContainer.appendChild(rewindIconEl)
    textFieldContainer.appendChild(textField)
    textFieldContainer.style.display = 'flex'
    textFieldContainer.style.alignItems = 'center'
    textFieldContainer.style.margin = '0 10px'
    textFieldContainer.style.borderRadius = '6px'
    textFieldContainer.style.outline = '1px solid #3E3F47'
    textFieldContainer.style.overflow = 'hidden'
    textFieldContainer.style.background = '#1E1F26'
    textFieldContainer.style.width = '84px'
    textFieldContainer.style.height = '26px'
    textFieldContainer.style.position = 'relative'

    textFieldContainer.addEventListener('click', (event) => {
        event.stopPropagation()
    })

    // AI timestamp Button
    const AItimeStampButton = document.createElement('div')
    AItimeStampButton.id = 'AItimeStampButton'
    AItimeStampButton.setAttribute('class', 'ytp-menuitem')

    AItimeStampButton.onclick = async () => {
        const secondsInPastField = document.getElementById(
            'secondsInPastSetting',
        ) as HTMLInputElement
        const secondsInPastSettingContainer = document.getElementById(
            'secondsInPastSettingContainer',
        ) as HTMLInputElement

        annotationsFunctions.createTimestampWithAISummary()(
            false,
            false,
            false,
            getTimestampNoteContentForYoutubeNotes(),
        )
    }
    AItimeStampButton.style.borderLeft = '1px solid #24252C'

    AItimeStampButton.style.display = 'flex'
    AItimeStampButton.style.alignItems = 'center'
    AItimeStampButton.style.cursor = 'pointer'

    AItimeStampButton.innerHTML = `<div class="ytp-menuitem-label"  id="AItimeStampButtonInner" style="font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on; font-family: Satoshi, sans-serif; font-size: 14px;padding: 0px 12 0 6px; align-items: center; justify-content: center; white-space: nowrap; display: flex; align-items: center">Smart Note</div>`
    AItimeStampButton.appendChild(textFieldContainer)
    annotateButton.appendChild(textFieldContainerNote)

    // dDisplay
    const memexIcon = runtime.getURL('/img/memex-icon.svg')
    const memexIconEl = document.createElement('img')
    memexIconEl.src = memexIcon
    memexButtons.appendChild(memexIconEl)
    memexIconEl.style.margin = '0 10px 0 15px'
    memexIconEl.style.height = '20px'

    // TimestampIcon
    const timestampIcon = runtime.getURL('/img/clockForYoutubeInjection.svg')
    const timeStampEl = document.createElement('img')
    timeStampEl.src = timestampIcon
    timeStampEl.style.height = '20px'
    timeStampEl.style.margin = '0 10px 0 10px'
    annotateButton.insertBefore(timeStampEl, annotateButton.firstChild)
    // TimestampIcon
    const cameraIcon = runtime.getURL('/img/cameraIcon.svg')
    const cameraIconEl = document.createElement('img')
    cameraIconEl.src = cameraIcon
    cameraIconEl.style.height = '20px'
    cameraIconEl.style.margin = '0 10px 0 10px'
    screenshotButton.insertBefore(cameraIconEl, screenshotButton.firstChild)

    // AI timestamp icon
    const AItimestampIcon = runtime.getURL('/img/starsYoutube.svg')
    const AItimestampIconEl = document.createElement('img')
    AItimestampIconEl.src = AItimestampIcon
    AItimestampIconEl.style.height = '20px'
    AItimestampIconEl.style.margin = '0 10px 0 10px'
    AItimeStampButton.insertBefore(
        AItimestampIconEl,
        AItimeStampButton.firstChild,
    )

    // SummarizeIcon
    const summarizeIcon = runtime.getURL(
        '/img/summarizeIconForYoutubeInjection.svg',
    )
    const summarizeIconEl = document.createElement('img')
    summarizeIconEl.src = summarizeIcon
    summarizeIconEl.style.height = '20px'
    summarizeIconEl.style.margin = '0 5px 0 10px'
    summarizeButton.insertBefore(summarizeIconEl, summarizeButton.firstChild)

    // Appending the right buttons
    memexButtons.appendChild(annotateButton)
    memexButtons.appendChild(AItimeStampButton)
    memexButtons.appendChild(summarizeButton)
    memexButtons.appendChild(screenshotButton)
    memexButtons.style.color = '#f4f4f4'
    memexButtons.style.width = 'fit-content'
    const aboveFold = document.getElementById('below')
    const existingButtons = document.getElementsByClassName(
        'memex-youtube-buttons',
    )[0]

    if (existingButtons) {
        existingButtons.remove()
    }

    aboveFold.insertAdjacentElement('afterbegin', memexButtons)
}
