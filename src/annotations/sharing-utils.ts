import * as icons from 'src/common-ui/components/design-library/icons'

// TODO: Properly differentiate all 4 cases
export function getShareButtonData(
    isShared: boolean,
    isBulkShareProtected: boolean,
): { icon: string; label: string } {
    if (isBulkShareProtected && isShared) {
        return { icon: icons.shared, label: 'Note shared and protected' }
    } else if (isShared) {
        return { icon: icons.shared, label: 'Note shared' }
    } else if (isBulkShareProtected) {
        return { icon: icons.lock, label: 'Note protected' }
    }
    return { icon: icons.person, label: 'Note not yet shared' }
}
