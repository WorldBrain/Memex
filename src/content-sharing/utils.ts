export function getListShareUrl(options: { remoteListId: string }) {
	console.log(process.env.NODE_ENV)

	if (process.env.NODE_ENV === 'production') {
    	return `https://memex.social/c/${options.remoteListId}`
	} else {
    	return `https://staging.memex.social/c/${options.remoteListId}`
    }
}