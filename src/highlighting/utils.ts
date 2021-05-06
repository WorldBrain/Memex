import type { SelectorDescriptorType, Anchor } from './types'

// TODO: Support other selector descriptor types
export const getAnchorSelector = (
    anchor: Anchor,
    selector: 'TextPositionSelector',
): { start: number } =>
    anchor.descriptor.content.find((content) => content.type === selector) ?? {
        start: 0,
    }
