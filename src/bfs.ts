export type AdjacencyList = Map<string, Set<string>>;

export function buildUndirectedGraph(edges: [string, string][]): AdjacencyList {
    const graph: AdjacencyList = new Map();
    for (const [u, v] of edges) {
        if (!graph.has(u)) { graph.set(u, new Set()); }
        if (!graph.has(v)) { graph.set(v, new Set()); }
        graph.get(u)!.add(v);
        graph.get(v)!.add(u);
    }
    return graph;
}

export function singleSourceShortestPathLength(
    graph: AdjacencyList,
    source: string
): Map<string, number> {
    if (!graph.has(source)) { return new Map(); }
    const distances = new Map<string, number>();
    distances.set(source, 0);
    const queue: string[] = [source];
    while (queue.length > 0) {
        const node = queue.shift()!;
        const dist = distances.get(node)!;
        for (const neighbor of graph.get(node) || []) {
            if (!distances.has(neighbor)) {
                distances.set(neighbor, dist + 1);
                queue.push(neighbor);
            }
        }
    }
    return distances;
}

export function computeRank(
    edges: [string, string][],
    roots: string[],
    first: string | null,
    last: string | null,
    isTop: boolean
): Record<string, number> {
    let effectiveRoots = roots.slice();

    if (effectiveRoots.length === 0) {
        if (isTop && first) { effectiveRoots = [first]; }
        else if (!isTop && last) { effectiveRoots = [last]; }
        else { return {}; }
    }

    const graph = buildUndirectedGraph(edges);

    if (effectiveRoots.length === 1) {
        const source = effectiveRoots[0];
        if (!graph.has(source)) { return {}; }
        const distances = singleSourceShortestPathLength(graph, source);
        const result: Record<string, number> = {};
        distances.forEach((v, k) => { result[k] = v; });
        return result;
    }

    const rank: Record<string, number> = {};
    for (const root of effectiveRoots) {
        rank[root] = 0;
    }
    for (const root of effectiveRoots) {
        if (!graph.has(root)) { continue; }
        const distances = singleSourceShortestPathLength(graph, root);
        distances.forEach((v, k) => {
            if (rank[k] === undefined) {
                rank[k] = v;
            } else {
                rank[k] = Math.min(rank[k], v);
            }
        });
    }
    return rank;
}
