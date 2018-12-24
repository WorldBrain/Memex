import { Position } from './components/tooltip'

/**
 * Given a selector, calculate and returns a position near the bottom center
 * of the element with that selelctor.
 * Used to position overview tooltips.
 * @param selector Selector of an element.
 * @param offsetTop Offset to add/subtract to/from the calculated top value.
 * @param offsetLeft Offset to add/subtract to/from the calculated left value.
 */
export const getBottomCenter = (
    selector: string,
    offsetTop = 0,
    offsetLeft = 0,
): Position => {
    const $element = document.querySelector(selector)
    if ($element === null) {
        console.log(`ERROR: Element with selector '${selector}' not found.`)
        return
    }
    const rect = $element.getBoundingClientRect()
    return {
        top: rect.top + rect.height + offsetTop,
        left: rect.left + offsetLeft,
    }
}
