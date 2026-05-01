import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";

type GraphData = {
    [key: string]: {
        imports: string[];
        dependents: string[];
    };
};

type Props = {
    graphData: GraphData | null;
};

function buildNodesAndEdges(graphData: GraphData) {
    const keys = Object.keys(graphData);

    const nodes = keys.map((filePath, index) => ({
        id: filePath,
        position: {
            x: (index % 4) * 250,
            y: Math.floor(index / 4) * 150
        },
        data: { label: filePath.split("/").pop() }
    }));

    const edges: { id: string; source: string; target: string }[] = [];
    for (const [file, node] of Object.entries(graphData)) {
        for (const imp of node.imports) {
            edges.push({
                id: `${imp}->${file}`,
                source: imp,
                target: file
            });
        }
    }

    return { nodes, edges };
}

export default function GraphView({ graphData }: Props) {
    if (!graphData) return <div>No graph yet.</div>;

    const { nodes, edges } = buildNodesAndEdges(graphData);

    return (
        <div style={{ width: "100%", height: "600px" }}>
            <ReactFlow nodes={nodes} edges={edges} fitView>
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}