import { remoteFunction } from 'src/util/webextensionRPC'
import ConfirmModal, { overlayId } from './Confirm'

/**
 * Handles injecting a modal into current page to get user confirmation regarding
 * whether they want to delete recently blacklisted data.
 *
 * @param {string} url The URL being blacklisted.
 */
export default function quickBlacklistConfirm(url) {
    const deleteInBg = remoteFunction('cleanupBlacklist')

    const unmount = () => document.body.removeChild(document.getElementById(overlayId))
    const performDelete = () => {
        unmount()
        deleteInBg(url)
    }

    document.body.appendChild(ConfirmModal({
        text: `Do you want to delete all data matching site:\n${url}`,
        confirmText: 'Delete',
        cancelText: 'No',
        onConfirm: performDelete,
        onCancel: unmount,
    }))
}
