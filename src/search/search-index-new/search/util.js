/**
 * @param {SearchResult[]} resultEntries Map entries (2-el KVP arrays) of URL keys to latest times
 * @param {number} [args.skip=0]
 * @param {number} [args.limit=10]
 * @return {SearchResult[]} Sorted and trimmed version of `resultEntries` input.
 */
export const paginate = (resultEntries, { skip = 0, limit = 10 }) =>
    [...resultEntries].sort(([, a], [, b]) => b - a).slice(skip, skip + limit)

/**
 * @param {Map<string, number>} urlScoreMap Map of URL keys to score multipliers.
 * @param {Map<string, number>} latestVisitsMap Map of URL keys to latest event timestamp.
 * @return {Map<string, number>} Map of URL keys to derived score (multiplier * latest event timestamp).
 */
export const applyScores = (urlScoreMap, latestVisitsMap) =>
    new Map(
        [...urlScoreMap]
            // Visits may be filtered down by time; only keep URLs appearing in visits Map
            .filter(([url]) => latestVisitsMap.has(url))
            .map(([url, multi]) => [
                url,
                Math.trunc(latestVisitsMap.get(url) * multi),
            ]),
    )
