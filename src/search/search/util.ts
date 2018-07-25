import { SearchParams, SearchResult, PageResultsMap } from '..'

/**
 * @param resultEntries Map entries (2-el KVP arrays) of URL keys to latest times
 * @return Sorted and trimmed version of `resultEntries` input.
 */
export const paginate = (
    resultEntries: PageResultsMap,
    { skip = 0, limit = 10 }: Partial<SearchParams>,
): SearchResult[] =>
    [...resultEntries].sort(([, a], [, b]) => b - a).slice(skip, skip + limit)

/**
 * @param urlScoreMap Map of URL keys to score multipliers.
 * @param latestVisitsMap Map of URL keys to latest event timestamp.
 * @return Map of URL keys to derived score (multiplier * latest event timestamp).
 */
export const applyScores = (
    urlScoreMap: PageResultsMap,
    latestVisitsMap: PageResultsMap,
): PageResultsMap =>
    new Map(
        [...urlScoreMap]
            // Visits may be filtered down by time; only keep URLs appearing in visits Map
            .filter(([url]) => latestVisitsMap.has(url))
            .map(
                ([url, multi]): [string, number] => [
                    url,
                    Math.trunc(latestVisitsMap.get(url) * multi),
                ],
            ),
    )
