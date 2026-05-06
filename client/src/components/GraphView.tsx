import ReactFlow, {Background, Controls} from "reactflow";
import type { Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";

type GraphData = {
    [key: string]: {
        imports: string[];
        dependents: string[];
    };
};

type Props = {
    graphData: GraphData | null;
    criticalFiles: string[];
    impactedFiles: string[];
    changedFiles: string[];
};

const NODE_WIDTH = 150;
const NODE_HEIGHT = 40;

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 50 });

    nodes.forEach(node => {
        g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    edges.forEach(edge => {
        g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    const layoutedNodes = nodes.map(node => {
        const { x, y } = g.node(node.id);
        return { ...node, position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 } };
    });

    return { nodes: layoutedNodes, edges };
}

function buildNodesAndEdges(graphData: GraphData, criticalFiles: string[], impactedFiles: string[], changedFiles: string[]) {
    const relevantFiles = new Set([
        ...changedFiles,
        ...impactedFiles,
        ...criticalFiles
    ]);

    const keys = Object.keys(graphData).filter(k => relevantFiles.has(k));

    const nodes: Node[] = keys.map(filePath => ({
        id: filePath,
        position: { x: 0, y: 0 },
        data: { label: filePath.split("/").pop() },
        style: changedFiles.includes(filePath)
            ? { background: "#4499ff", color: "white", border: "none" }
            : criticalFiles.includes(filePath)
            ? { background: "#ff4444", color: "white", border: "none" }
            : impactedFiles.includes(filePath)
            ? { background: "#ffaa00", color: "white", border: "none" }
            : {}
    }));

    const edges: Edge[] = [];
    for (const [file, node] of Object.entries(graphData)) {
        if (!relevantFiles.has(file)) continue;
        for (const imp of node.imports) {
            if (!relevantFiles.has(imp)) continue;
            edges.push({
                id: `${imp}->${file}`,
                source: imp,
                target: file
            });
        }
    }

    return getLayoutedElements(nodes, edges);
}

export default function GraphView({ graphData, criticalFiles, impactedFiles, changedFiles }: Props) {
    if (!graphData) return <div>No graph yet.</div>;

    const { nodes, edges } = buildNodesAndEdges(graphData, criticalFiles, impactedFiles, changedFiles);

    return (
        <div style={{ width: "100%", height: "600px" }}>
            <ReactFlow nodes={nodes} edges={edges} fitView>
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}