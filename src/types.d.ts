type Container = Element & HTMLOrSVGElement & GlobalEventHandlers;
type DrawflowData = { "drawflow": { [module: string]: { "data": {[key: string]: INodeData}}}};

interface Class<T> {
  new(...args: any[]): T
}

interface IDrawflow {
  start(): void;
}

interface IDrawflowConfig {
  container: Container;
  events: {[key: string]: any};
  precanvas: HTMLElement | null;
  nodeId: number;
  ele_selected: Element | null;
  node_selected: Element | null;
  drag: boolean;
  reroute: boolean;
  reroute_fix_curvature: boolean;
  curvature: number;
  reroute_curvature_start_end: number;
  reroute_curvature: number;
  reroute_width: number;
  drag_point: boolean;
  editor_selected: boolean;
  connection: boolean;
  connection_ele: Element | null;
  connection_selected: Element | null;
  canvas_x: number;
  canvas_y: number;
  pos_x: number;
  pos_x_start: number;
  pos_y: number;
  pos_y_start: number;
  mouse_x: number;
  mouse_y: number;
  line_path: number;
  first_click: Element | null;
  force_first_input: boolean;
  draggable_inputs: boolean;
  useuuid: boolean;
  noderegister: {[key: string]: {html: {cloneNode: (value: boolean) => Node}, options: any, props: any }};
  drawflow: DrawflowData;
  evCache: PointerEvent[];
  prevDiff: number;
}

interface IUserConfig {
  module: string;
  editor_mode: string;
  zoom: number;
  zoom_max: number;
  zoom_min: number;
  zoom_value: number;
  zoom_last_value: number;
}

interface INodeData {
  id: number,
  name: string,
  data: {[key: string]: any},
  class: string,
  html: string,
  typenode: boolean,
  inputs: {[key: string]: INodeSocket};
  outputs: {[key: string]: INodeSocket};
  pos_x: number;
  pos_y: number;
}

interface INodeSocket {
  connections: {
    [key: string]: {
      points: INodeData[];
      node: Node,
      input: string,
      output: string
    }
  }
}
