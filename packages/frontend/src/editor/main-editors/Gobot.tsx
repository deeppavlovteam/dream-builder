import React, { useState, useRef, useEffect, useContext } from "react";
import ReactFlow, { Handle, Controls, Background, updateEdge, addEdge, removeElements, OnLoadParams, Elements, NodeTypesType, Position, BackgroundVariant } from 'react-flow-renderer';
import { styled } from "goober";
import { nanoid } from "nanoid";

import {
  useCreateResourceMutation,
  useGetResourcesWithTypeQuery,
  useUpdateResourceMutation,
} from "../resourcesSlice";
import type { IntentResource, Resource } from "@dp-builder/api_types_ts"

interface FlowRes {
  type: "flow"
  resid?: string
  content: { el: Elements } 
}

interface NodeData {
  [k: string]: any;
}

const UpdateNodeDataContext = React.createContext((_: string, __: NodeData) => {})

const Dropdown = ({ options, onSelect, selected }: { options: string[], onSelect: (opt: string) => void, selected?: string }) => {
  if (!selected) selected = options[0]

  return (
    <select onChange={(ev) => onSelect(ev.target.value)} value={selected} style={{width: "100%"}}>
      {options.map((opt) => <option key={opt}>{opt}</option>)}
    </select>
  )
}

const UtteranceNode = ({ id, data: { selectedIntent } }: { id: string, data: NodeData }) => {
  const onDataChange = useContext(UpdateNodeDataContext)
  const { data: intents } = useGetResourcesWithTypeQuery("intent") as { data?: IntentResource[] };

  return (
    <NodeContainer>
      <NodeTitle>User Utterance</NodeTitle>
      <NodeBody>
        {(intents && intents.length > 0 &&
          <Dropdown options={intents.map((int) => int.content.name)} onSelect={(newOpt) => onDataChange(id, { selectedIntent: newOpt })} selected={selectedIntent}/>
          || "No intents to select, create one"
        )}
      </NodeBody>
      <Handle
        type="source"
        position={Position.Right}
        id="a"
        style={{ top: '50%', borderRadius: 0 }}
      />
    </NodeContainer>
  )
}

const ApiCallNode = ({ id, data }: { id: string, data: NodeData }) => {
  const onDataChange = useContext(UpdateNodeDataContext)
  const onInputChange = (field: string) => (ev: React.ChangeEvent<HTMLInputElement>) => onDataChange(id, { ...data, [field]: ev.target.value })

  return (
    <NodeContainer>
      <Handle
        type="target"
        position={Position.Left}
        id="a"
        style={{ top: '50%', borderRadius: 0 }}
      />

      <NodeTitle>Api Call</NodeTitle>
      <NodeBody>
        {["endpoint", "method", "payload"].map((n) => <div key={n}><span>{n.charAt(0).toUpperCase() + n.slice(1)}:</span> <input type="text" value={data[n] || ""} onChange={onInputChange(n)} style={{width: "100%"}}/></div>)}
      </NodeBody>
      <Handle
        type="source"
        position={Position.Right}
        id="b"
        style={{ top: '50%', borderRadius: 0 }}
      />
    </NodeContainer>
  )
}

const ResponseNode = ({ id, data: { respStr } }: { id: string, data: NodeData }) => {
  const onDataChange = useContext(UpdateNodeDataContext)
  const onInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => (onDataChange(id, { respStr: ev.target.value }), console.log('input', ev.target.value))

  return (
    <NodeContainer>
      <Handle
        type="target"
        position={Position.Left}
        id="a"
        style={{ top: '50%', borderRadius: 0 }}
      />

      <NodeTitle>Response</NodeTitle>
      <NodeBody>
        <input type="text" value={respStr || ""} onChange={onInputChange} style={{width: "100%"}}/>
      </NodeBody>
    </NodeContainer>
  )
}

const nodeTypes: NodeTypesType = {
  utterance: UtteranceNode,
  apicall: ApiCallNode,
  response: ResponseNode
}

const Palette = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <PaletteContainer>
      {Object.keys(nodeTypes).map((type) => (
        <DndNode key={type} onDragStart={(event) => onDragStart(event, type)} draggable>
          {type.replace(/^\w/, (c) => c.toUpperCase())} Node
        </DndNode>
      ))}
    </PaletteContainer>
  );
};

const getId = () => nanoid()

export default () => {
  const [elements, setElements] = useState<Elements>([]);
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<OnLoadParams | null>(null);

  const { data: flowsRes } = useGetResourcesWithTypeQuery("flow") as { data?: FlowRes[] };
  const [currentFlowRes, setCurrentFlowRes] = useState<FlowRes | undefined>()
  const [createRes] = useCreateResourceMutation();
  const [updateRes] = useUpdateResourceMutation();

  useEffect(() => {
    if (flowsRes) {
      if (flowsRes.length === 0) createRes({ type: "flow", content: { el: []  } })
      else (setCurrentFlowRes(flowsRes[0]), setElements(flowsRes[0].content.el))
    }
  }, [flowsRes])

  useEffect(() => {
    if (currentFlowRes)
    updateRes(({ ...currentFlowRes, content: { el: elements } } as unknown) as Resource);
  }, [elements])

  const onElementsRemove = (elementsToRemove: any) =>
    setElements((els) => removeElements(elementsToRemove, els) as any);
  const onEdgeUpdate = (oldEdge: any, newConnection: any) =>
    setElements((els) => updateEdge(oldEdge, newConnection, els) as any);
  const onConnect = (params: any) => setElements((els) => addEdge(params, els) as any);

  const onDataChange = (nodeId: string, newData: object) => (console.log('update', nodeId, newData), setElements(
    (els) => els.map((el) => {
      if (el.id === nodeId) return { ...el, data: { ...newData } }
      else return el
    })
  ))

  const onLoad = (reactFlowInstance: OnLoadParams) => {
    setReactFlowInstance(reactFlowInstance)
    reactFlowInstance.fitView();
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (event: React.DragEvent) => {
    if (!reactFlowWrapper.current || !reactFlowInstance) return;
    event.preventDefault();

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow');
    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    const id = getId()
    const newNode = {
      id,
      type,
      position,
      sourcePosition: 'right',
      targetPosition: 'left',
      data: {},
    } as Elements[number];

    setElements((es) => es.concat(newNode));
  };

  return (
    <ColumnsContainer>
      <Column>
        <UpdateNodeDataContext.Provider value={onDataChange}>
          <FlowWrapper ref={reactFlowWrapper}>
            <ReactFlow
              snapToGrid
              zoomOnScroll={false}
              preventScrolling={false}
              nodeTypes={nodeTypes}
              elements={elements}
              onLoad={onLoad}
              onEdgeUpdate={onEdgeUpdate}
              onConnect={onConnect}
              onElementsRemove={onElementsRemove}
              onDragOver={onDragOver}
              onDrop={onDrop}
            >
              <Controls />
              <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1}
                color="#81818a88"
                />
            </ReactFlow>
          </FlowWrapper>
        </UpdateNodeDataContext.Provider>
      </Column>

      <Column maxwidth="300px">
        <Palette/>
      </Column>
    </ColumnsContainer>
  );
};

const NodeContainer = styled("div")(({ theme }) => ({
  width: "250px",
  borderRadius: "15px",
  backgroundColor: 'white',
  border: `1px solid ${theme.logoBg}`,
}))

const NodeTitle = styled("div")(({ theme }) => ({
  padding: "15px",
  width: "100%",
  textAlign: "center",
  borderRadius: "15px",
  borderBottom: `1px solid ${theme.logoBg}`,
}))

const NodeBody = styled("div")({
  padding: "10px",
  width: "100%",
})

const DndNode = styled(NodeContainer)({
  padding: "15px",
  width: "100%",
  marginBottom: "20px",
  cursor: "grab"
})

const PaletteContainer = styled("aside")({
  padding: "15px"
})

const FlowWrapper = styled("div", React.forwardRef)({
  width: "100%",
  height: "100%"
})

const ColumnsContainer = styled("div")({
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "row",
  alignItems: "stretch",
});

const Column = styled("div")(
  ({ maxwidth = "unset" }: { maxwidth?: string }) => ({
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    maxWidth: maxwidth,
    "&:not(:last-child)": {
      borderRight: "#DDDDDD 1px solid",
    },
  })
);

