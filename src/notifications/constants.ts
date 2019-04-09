export const NOTIFICATIONS_PAGE_SIZE: number = 20
export const BACKUP_STATUS_MESSAGES: any = {
    successful_backup:
        'Your last backup was successful. Backup again ',
    unsuccessful_backup_internet:
        'Your last backup was unsuccessful.',
    unsuccessful_backup_auto_enabled:
        'Your last backup was unsuccessful. Retrying soon.',
    unsuccessful_backup_drive_size:
        'Your last backup was unsuccessfull as there was no space in your google drive. Please clear some space and try again.',
    subscription_expiration:
        'Your Memex subscription has expired. Renew your subscription else Backups will have to be done manually.',
    upgraded_but_no_first_backup:
        'Great! You upgraded to automatic backups. However you will have to do your first backup manually.',
    unknown_error:
        'Your last backup was unsuccessful due to some unknown error. Please try again.',
    backup_only_local:
        'Your data is only stored on your computer. Back it up locally or to any cloud storage for free.',
    automatic_backup_message:
        'Automatic backups every 15 minutes. Worry-free.',
    automatic_backup_disabled_first_backup_done:
        'All data is only stored on your computer. Remember to regularly back it up.',
}
