export type Route = { page: "catalog" } | { page: "game"; puzzleId: string };
export function parseRoute(hash: string, puzzleIds: readonly string[]): Route {
  const match = /^#\/jugar\/([^/]+)$/.exec(hash);
  if (match && puzzleIds.includes(match[1]))
    return { page: "game", puzzleId: match[1] };
  return { page: "catalog" };
}
