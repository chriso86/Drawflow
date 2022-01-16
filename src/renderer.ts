import {DIContainer} from './drawflow';
import {Helper} from './helper';

export class Renderer {
  public addNodeImport(nodeData: INodeData, precanvas: HTMLElement) {
    const parent = document.createElement('div');
    const node = document.createElement('div');

    parent.classList.add("parent-node");

    node.innerHTML = "";
    node.classList.add("drawflow-node");
    node.setAttribute("id", "node-" + nodeData.id);

    if (nodeData.class != '') {
      node.classList.add(...nodeData.class.split(' '));
    }

    const inputs = Renderer.renderInputSockets(nodeData, precanvas);
    const outputs = Renderer.renderOutputSockets(nodeData);
    const content = Renderer.renderContent(nodeData);

    node.appendChild(inputs);
    node.appendChild(content);
    node.appendChild(outputs);

    node.style.top = nodeData.pos_y + "px";
    node.style.left = nodeData.pos_x + "px";

    parent.appendChild(node);
    precanvas.appendChild(parent);
  }

  public addRerouteImport(nodeData: INodeData) {
    const outputs = nodeData.outputs;

    for (const outputKey in outputs) {
      if (outputs.hasOwnProperty(outputKey)) {
        Renderer.addOutputSocketConnections(nodeData, outputKey);
      }
    }
  }

  public updateNodeConnections(nodeId: string) {
    // Config Variables
    const config = DIContainer.config;
    const userConfig = DIContainer.userConfig;
    const container = config.container;
    const precanvas = config.precanvas!;
    const curvature = config.curvature;
    const rerouteCurvature = config.reroute_curvature;
    const rerouteCurvatureStartEnd = config.reroute_curvature_start_end;
    const rerouteFixCurvature = config.reroute_fix_curvature;
    const rerouteWidth = config.reroute_width;
    const zoom = userConfig.zoom;

    // Node Lookups
    const node = container.querySelector(`#${nodeId}`)! as HTMLElement;
    const nodeCoords = Renderer.getElementCoords(node);
    const idSearchIn = `node_in_${nodeId}`;
    const idSearchOut = `node_out_${nodeId}`;
    const inputNodeList = container.querySelectorAll(`.${idSearchIn}`);
    const outputNodeList = container.querySelectorAll(`.${idSearchOut}`);
    const inputLookupElements: Element[] = Array.from(inputNodeList);
    const outputLookupElements: Element[] = Array.from(outputNodeList);

    // Precanvas variables
    const precanvasWidthZoom = (precanvas.clientWidth / (precanvas.clientWidth * zoom)) ?? 0;
    const precanvasHeightZoom = (precanvas.clientHeight / (precanvas.clientHeight * zoom)) ?? 0;

    // Loop through all output connections (CLOSED CONNECTIONS)
    for (const outputLookupElement of outputLookupElements) {
      const extraConnectionPoints: NodeListOf<HTMLElement> = outputLookupElement.querySelectorAll('.point');
      const inputClass = Helper.GetClassContainingString(outputLookupElement.classList, 'input_');
      const outputClass = Helper.GetClassContainingString(outputLookupElement.classList, 'output_');
      const nodeIdSearchClass = Helper.GetClassContainingString(outputLookupElement.classList, 'node_in_')
        .replace('node_in_', '');
      const nodeElement = container.querySelector(`#${nodeIdSearchClass}`);
      const inputElement = nodeElement?.querySelectorAll(`.${inputClass}`).item(0) as HTMLElement;
      const outputElement = node?.querySelectorAll(`.${outputClass}`).item(0) as HTMLElement;

      // Calculation Variables (BB = BoundingBox)
      const inputElementCoords = Renderer.getElementCoords(inputElement);
      const outputElementCoords = Renderer.getElementCoords(outputElement);
      const precanvasCoords = Renderer.getElementCoords(precanvas);

      // Assignable variables (Defaults to values for NO extra connection points)
      let eX = inputElementCoords.cX + (inputElementCoords.x - precanvasCoords.x) * precanvasWidthZoom;
      let eY = inputElementCoords.cY + (inputElementCoords.y - precanvasCoords.y) * precanvasHeightZoom;
      let line_x = outputElementCoords.cX + (outputElementCoords.x - precanvasCoords.x) * precanvasWidthZoom;
      let line_y = outputElementCoords.cY + (outputElementCoords.y - precanvasCoords.y) * precanvasHeightZoom;

      // First line (Potentially the ONLY line if there are no extra connection points)
      if (!extraConnectionPoints.length) {
        const lineCurve = Renderer.createCurvature(line_x, line_y, eX, eY, curvature, 'openclose');

        outputElement.children[0].setAttributeNS(null, 'd', lineCurve);
      } else {
        // There ARE extra points added to the connection line

        const rerouteFix: string[] = []; // An array of SVG line coordinates
        let lineCurve = '';

        extraConnectionPoints.forEach((pointElement: HTMLElement, index: number, arr: NodeListOf<HTMLElement>) => {


          const nodeParentElement = pointElement.parentElement;
          const pointElementCoords = Renderer.getElementCoords(pointElement);
          let lineCurveSearch: string;

          if (!nodeParentElement) {
            throw new Error(`Could not locate the node parent for node index "${index}"`);
          }

          // There is only one extra connection point
          if (index === 0 && ((extraConnectionPoints.length - 1) === 0)) {

            // Draw first connection segment (Draw from output to point first)
            let eX = (pointElementCoords.x - precanvasCoords.x) * precanvasWidthZoom + rerouteWidth;
            let eY = (pointElementCoords.y - precanvasCoords.y) * precanvasHeightZoom + rerouteWidth;
            let line_x = outputElementCoords.cX + (outputElementCoords.x - precanvasCoords.x) * precanvasWidthZoom;
            let line_y = outputElementCoords.cY + (outputElementCoords.y - precanvasCoords.y) * precanvasHeightZoom;

            lineCurveSearch = Renderer.createCurvature(line_x, line_y, eX, eY, rerouteCurvatureStartEnd, 'open');

            // Draw second connection segment (Draw from connection point to input)
            const nodeIdSearchClass = Helper.GetClassContainingString(nodeParentElement.classList, 'node_in_')
              .replace('node_in_', '');
            const nodeElement = container.querySelector(`#${nodeIdSearchClass}`);
            const inputClass = Helper.GetClassContainingString(nodeParentElement.classList, 'input_');
            const inputElement = nodeElement?.querySelectorAll(`.${inputClass}`).item(0) as HTMLElement;
            const inputElementCoords = Renderer.getElementCoords(inputElement);

            eX = inputElementCoords.cX + (inputElementCoords.x - precanvasCoords.x) * precanvasWidthZoom;
            eY = inputElementCoords.cY + (inputElementCoords.y - precanvasCoords.y) * precanvasHeightZoom;
            line_x = (pointElementCoords.x - precanvasCoords.x) * precanvasWidthZoom + rerouteWidth;
            line_y = (pointElementCoords.y - precanvasCoords.y) * precanvasHeightZoom + rerouteWidth;

            lineCurveSearch = Renderer.createCurvature(line_x, line_y, eX, eY, rerouteCurvatureStartEnd, 'close');

          } else if (index === 0) {
            // There is more than one extra connection point, and this is the first one

            const outputClass = Helper.GetClassContainingString(nodeParentElement.classList, 'output_');
            const outputElement = nodeElement?.querySelectorAll(`.${outputClass}`).item(0) as HTMLElement;
            const outputElementCoords = Renderer.getElementCoords(outputElement);

            let eX = (pointElementCoords.x - precanvas.getBoundingClientRect().x) * precanvasWidthZoom + rerouteWidth;
            let eY = (pointElementCoords.y - precanvas.getBoundingClientRect().y) * precanvasHeightZoom + rerouteWidth;
            let line_x = outputElementCoords.cX + (outputElementCoords.x - precanvasCoords.x) * precanvasWidthZoom;
            let line_y = outputElementCoords.cY + (outputElementCoords.y - precanvasCoords.y) * precanvasHeightZoom;

            lineCurveSearch = Renderer.createCurvature(line_x, line_y, eX, eY, rerouteCurvatureStartEnd, 'open');

            // Get the next point and draw the final connection point line (For this iteration)
            const nextElement = arr.item(index + 1);
            const nextElementCoords = Renderer.getElementCoords(nextElement);

            eX = (nextElementCoords.x - precanvasCoords.x) * precanvasWidthZoom + rerouteWidth;
            eY = (nextElementCoords.y - precanvasCoords.y) * precanvasHeightZoom + rerouteWidth;
            line_x = (pointElementCoords.x - precanvasCoords.x) * precanvasWidthZoom + rerouteWidth;
            line_y = (pointElementCoords.y - precanvasCoords.y) * precanvasHeightZoom + rerouteWidth;
            lineCurveSearch = Renderer.createCurvature(line_x, line_y, eX, eY, rerouteCurvature, 'other');

          } else if (index === (arr.length - 1)) {
            // There is more than one extra connection point, and this is the last one

            const nodeIdSearchClass = Helper.GetClassContainingString(nodeParentElement.classList, 'node_in_')
              .replace('node_in_', '');
            const nodeElement = container.querySelector(`#${nodeIdSearchClass}`);
            const inputClass = Helper.GetClassContainingString(nodeParentElement.classList, 'input_');
            const inputElement = nodeElement?.querySelectorAll(`.${inputClass}`).item(0) as HTMLElement;
            const inputElementCoords = Renderer.getElementCoords(inputElement);

            const eX = inputElementCoords.cX + (inputElementCoords.x - precanvasCoords.x) * precanvasWidthZoom;
            const eY = inputElementCoords.cY + (inputElementCoords.y - precanvasCoords.y) * precanvasHeightZoom;
            const line_x = (nodeCoords.x - precanvasCoords.x) * precanvasWidthZoom + rerouteWidth;
            const line_y = (nodeCoords.y - precanvasCoords.y) * precanvasHeightZoom + rerouteWidth;
            lineCurveSearch = Renderer.createCurvature(line_x, line_y, eX, eY, rerouteCurvatureStartEnd, 'close');

          } else {
            // There is more than one extra connection point, and this is one of the middle ones

            const nextElement = arr.item(index + 1);
            const nextElementCoords = Renderer.getElementCoords(nextElement);

            const eX = (nextElementCoords.x - precanvasCoords.x) * precanvasWidthZoom + rerouteWidth;
            const eY = (nextElementCoords.y - precanvasCoords.y) * precanvasHeightZoom + rerouteWidth;
            const line_x = (pointElementCoords.x - precanvasCoords.x) * precanvasWidthZoom + rerouteWidth;
            const line_y = (pointElementCoords.y - precanvasCoords.y) * precanvasHeightZoom + rerouteWidth;
            lineCurveSearch = Renderer.createCurvature(line_x, line_y, eX, eY, rerouteCurvature, 'other');
          }

          lineCurve += lineCurveSearch;
          rerouteFix.push(lineCurveSearch);

        });
        if (rerouteFixCurvature) {
          rerouteFix.forEach((itempath, i) => {
            outputLookupElement.children[i].setAttributeNS(null, 'd', itempath);
          });

        } else {
          outputLookupElement.children[0].setAttributeNS(null, 'd', lineCurve);
        }

      }
    }

    // Loop through all input connections
    for (const inputLookupElement of inputLookupElements) {
      const extraConnectionPoints: NodeListOf<HTMLElement> = inputLookupElement.querySelectorAll('.point');
      const inputClass = Helper.GetClassContainingString(inputLookupElement.classList, 'input_');
      const outputClass = Helper.GetClassContainingString(inputLookupElement.classList, 'output_');
      const nodeIdSearchClass = Helper.GetClassContainingString(inputLookupElement.classList, 'node_out_')
        .replace('node_out_', '');
      const nodeElement = container.querySelector(`#${nodeIdSearchClass}`);
      const inputElement = nodeElement?.querySelectorAll(`.${inputClass}`).item(0) as HTMLElement;
      const outputElement = node?.querySelectorAll(`.${outputClass}`).item(0) as HTMLElement;

      // Calculation Variables (BB = BoundingBox)
      const inputElementCoords = Renderer.getElementCoords(inputElement);
      const outputElementCoords = Renderer.getElementCoords(outputElement);
      const precanvasCoords = Renderer.getElementCoords(precanvas);

      // Assignable variables (Defaults to values for NO extra connection points)
      let eX = inputElementCoords.cX + (inputElementCoords.x - precanvasCoords.x) * precanvasWidthZoom;
      let eY = inputElementCoords.cY + (inputElementCoords.y - precanvasCoords.y) * precanvasHeightZoom;
      let line_x = outputElementCoords.cX + (outputElementCoords.x - precanvasCoords.x) * precanvasWidthZoom;
      let line_y = outputElementCoords.cY + (outputElementCoords.y - precanvasCoords.y) * precanvasHeightZoom;

      // There are NO extra points, draw a direct connection line
      if (!extraConnectionPoints.length) {
        const lineCurve = Renderer.createCurvature(line_x, line_y, eX, eY, curvature, 'openclose');

        inputLookupElement.children[0].setAttributeNS(null, 'd', lineCurve);
      } else {
        // There ARE extra points added to the connection line

        const rerouteFix: string[] = []; // An array of SVG line coordinates
        let lineCurve = '';

        extraConnectionPoints.forEach((pointElement: HTMLElement, index: number, arr: NodeListOf<HTMLElement>) => {
          const nodeParentElement = pointElement.parentElement;
          const pointElementCoords = Renderer.getElementCoords(pointElement);

          if (!nodeParentElement) {
            throw new Error(`Could not locate the node parent for node index "${index}"`);
          }

          // There is only one extra connection point
          if (index === 0 && ((extraConnectionPoints.length - 1) === 0)) {

            // Draw first connection segment (Draw from output to point first)
            const inputClass = Helper.GetClassContainingString(nodeParentElement.classList, 'input_');
            const inputElement = node?.querySelectorAll(`.${inputClass}`).item(0) as HTMLElement;
            const inputElementCoords = Renderer.getElementCoords(inputElement);

            let eX = inputElementCoords.cX + (inputElementCoords.x - precanvasCoords.x) * precanvasWidthZoom;
            let eY = inputElementCoords.cY + (inputElementCoords.y - precanvasCoords.y) * precanvasHeightZoom;
            let line_x = (pointElementCoords.x - precanvasCoords.x) * precanvasWidthZoom + rerouteWidth;
            let line_y = (pointElementCoords.y - precanvasCoords.y) * precanvasHeightZoom + rerouteWidth;
            let lineCurveSearch = Renderer.createCurvature(line_x, line_y, eX, eY, rerouteCurvatureStartEnd, 'close');

            lineCurve += lineCurveSearch;
            rerouteFix.push(lineCurveSearch);

            const elemtsearchId_out = pointElement;
            const id_search = pointElement.parentElement.classList[2].replace('node_out_', '');
            const elemtsearchId = container.querySelector(`#${id_search}`);
            const elemtsearchOut = elemtsearchId.querySelectorAll('.' + pointElement.parentElement.classList[3])[0]

            line_x = elemtsearchOut.offsetWidth / 2 + (elemtsearchOut.getBoundingClientRect().x - precanvas.getBoundingClientRect().x) * precanvasWidthZoom;
            line_y = elemtsearchOut.offsetHeight / 2 + (elemtsearchOut.getBoundingClientRect().y - precanvas.getBoundingClientRect().y) * precanvasHeightZoom;
            eX = (elemtsearchId_out.getBoundingClientRect().x - precanvas.getBoundingClientRect().x) * precanvasWidthZoom + rerouteWidth;
            eY = (elemtsearchId_out.getBoundingClientRect().y - precanvas.getBoundingClientRect().y) * precanvasHeightZoom + rerouteWidth;
            lineCurveSearch = Renderer.createCurvature(line_x, line_y, x, y, rerouteCurvatureStartEnd, 'open');

            linecurve += lineCurveSearch;
            reoute_fix.push(lineCurveSearch);


          } else if (index === 0) {
            // FIRST
            const elemtsearchId_out = pointElement;
            const id_search = pointElement.parentElement.classList[2].replace('node_out_', '');
            const elemtsearchId = container.querySelector(`#${id_search}`);
            const elemtsearch = elemtsearchId.querySelectorAll('.' + pointElement.parentElement.classList[3])[0]
            const elemtsearchOut = elemtsearchId.querySelectorAll('.' + pointElement.parentElement.classList[3])[0]
            const line_x = elemtsearchOut.offsetWidth / 2 + (elemtsearchOut.getBoundingClientRect().x - precanvas.getBoundingClientRect().x) * precanvasWidthZoom;
            const line_y = elemtsearchOut.offsetHeight / 2 + (elemtsearchOut.getBoundingClientRect().y - precanvas.getBoundingClientRect().y) * precanvasHeightZoom;
            const eX = (elemtsearchId_out.getBoundingClientRect().x - precanvas.getBoundingClientRect().x) * precanvasWidthZoom + rerouteWidth;
            const eY = (elemtsearchId_out.getBoundingClientRect().y - precanvas.getBoundingClientRect().y) * precanvasHeightZoom + rerouteWidth;
            const x = eX;
            const y = eY;
            const lineCurveSearch = Renderer.createCurvature(line_x, line_y, x, y, rerouteCurvatureStartEnd, 'open');

            linecurve += lineCurveSearch;
            reoute_fix.push(lineCurveSearch);

            // SECOND
            const elemtsearchId_out = pointElement;
            const elemtsearch = points[index + 1];
            const eX = (elemtsearch.getBoundingClientRect().x - precanvas.getBoundingClientRect().x) * precanvasWidthZoom + rerouteWidth;
            const eY = (elemtsearch.getBoundingClientRect().y - precanvas.getBoundingClientRect().y) * precanvasHeightZoom + rerouteWidth;
            const line_x = (elemtsearchId_out.getBoundingClientRect().x - precanvas.getBoundingClientRect().x) * precanvasWidthZoom + rerouteWidth;
            const line_y = (elemtsearchId_out.getBoundingClientRect().y - precanvas.getBoundingClientRect().y) * precanvasHeightZoom + rerouteWidth;
            const x = eX;
            const y = eY;
            const lineCurveSearch = Renderer.createCurvature(line_x, line_y, x, y, rerouteCurvature, 'other');

            linecurve += lineCurveSearch;
            reoute_fix.push(lineCurveSearch);

          } else if (index === (points.length - 1)) {
            const elemtsearchId_out = pointElement;
            const id_search = pointElement.parentElement.classList[1].replace('node_in_', '');
            const elemtsearchId = container.querySelector(`#${id_search}`);
            const elemtsearch = elemtsearchId.querySelectorAll('.' + pointElement.parentElement.classList[4])[0]
            const elemtsearchIn = elemtsearchId.querySelectorAll('.' + pointElement.parentElement.classList[4])[0]
            const eX = elemtsearchIn.offsetWidth / 2 + (elemtsearchIn.getBoundingClientRect().x - precanvas.getBoundingClientRect().x) * precanvasWidthZoom;
            const eY = elemtsearchIn.offsetHeight / 2 + (elemtsearchIn.getBoundingClientRect().y - precanvas.getBoundingClientRect().y) * precanvasHeightZoom;
            const line_x = (elemtsearchId_out.getBoundingClientRect().x - precanvas.getBoundingClientRect().x) * precanvasWidthZoom + rerouteWidth;
            const line_y = (elemtsearchId_out.getBoundingClientRect().y - precanvas.getBoundingClientRect().y) * precanvasHeightZoom + rerouteWidth;
            const x = eX;
            const y = eY;
            const lineCurveSearch = Renderer.createCurvature(line_x, line_y, x, y, rerouteCurvatureStartEnd, 'close');

            linecurve += lineCurveSearch;
            reoute_fix.push(lineCurveSearch);

          } else {
            const elemtsearchId_out = pointElement;
            const elemtsearch = points[index + 1];
            const eX = (elemtsearch.getBoundingClientRect().x - precanvas.getBoundingClientRect().x) * precanvasWidthZoom + rerouteWidth;
            const eY = (elemtsearch.getBoundingClientRect().y - precanvas.getBoundingClientRect().y) * precanvasHeightZoom + rerouteWidth;
            const line_x = (elemtsearchId_out.getBoundingClientRect().x - precanvas.getBoundingClientRect().x) * precanvasWidthZoom + rerouteWidth;
            const line_y = (elemtsearchId_out.getBoundingClientRect().y - precanvas.getBoundingClientRect().y) * precanvasHeightZoom + rerouteWidth;
            const x = eX;
            const y = eY;
            const lineCurveSearch = Renderer.createCurvature(line_x, line_y, x, y, rerouteCurvature, 'other');

            linecurve += lineCurveSearch;
            reoute_fix.push(lineCurveSearch);
          }

        });
        if (rerouteFixCurvature) {
          reoute_fix.forEach((itempath, i) => {
            elems[item].children[i].setAttributeNS(null, 'd', itempath);
          });

        } else {
          elems[item].children[0].setAttributeNS(null, 'd', linecurve);
        }

      }

    }
  }

  // Private Methods
  private static renderInputSockets(nodeData: INodeData, precanvas: HTMLElement): HTMLElement {
    const inputSocketGroupElement = document.createElement('div');

    inputSocketGroupElement.classList.add("inputs");

    for (const inputKey in nodeData.inputs) {
      if (nodeData.inputs.hasOwnProperty(inputKey)) {
        const inputSocketElement = document.createElement('div');

        inputSocketElement.classList.add("input");
        inputSocketElement.classList.add(inputKey);

        inputSocketGroupElement.appendChild(inputSocketElement);

        Renderer.addInputSocketConnections(nodeData, precanvas, inputKey)
      }
    }

    return inputSocketGroupElement;
  }

  private static renderOutputSockets(nodeData: INodeData): HTMLElement {
    const outputSocketGroupElement = document.createElement('div');

    outputSocketGroupElement.classList.add("outputs");

    for (const key in nodeData.outputs) {
      const output = document.createElement('div');
      output.classList.add("output");
      output.classList.add("output_" + (+key + 1));
      outputSocketGroupElement.appendChild(output);
    }

    return outputSocketGroupElement;
  }

  private static addInputSocketConnections(nodeData: INodeData, precanvas: HTMLElement, inputSocketKey: string) {
    const inputSocket = nodeData.inputs[inputSocketKey];

    for (const outputKey in inputSocket.connections) {
      if (inputSocket.connections.hasOwnProperty(outputKey)) {
        const outputConnection = nodeData.inputs[inputSocketKey].connections[inputSocketKey];
        const connection = document.createElementNS('http://www.w3.org/2000/svg', "svg");
        const path = document.createElementNS('http://www.w3.org/2000/svg', "path");

        path.classList.add("main-path");
        path.setAttributeNS(null, 'd', '');

        connection.classList.add("connection");
        connection.classList.add(`node_in_node-${nodeData.id}`);
        connection.classList.add(`node_out_node-${outputConnection.node}`);
        connection.classList.add(outputConnection.input);
        connection.classList.add(inputSocketKey);

        connection.appendChild(path);
        precanvas.appendChild(connection);
      }
    }
  }

  private static addOutputSocketConnections(nodeData: INodeData, outputSocketKey: string) {
    const config = DIContainer.config;
    const reroute_width = config.reroute_width.toString();
    const reroute_fix_curvature = config.reroute_fix_curvature
    const container = config.container;
    const outputSocket = nodeData.inputs[outputSocketKey];

    for (const inputKey in outputSocket.connections) {
      const inputConnection = nodeData.outputs[outputSocketKey].connections[inputKey];
      const points = inputConnection.points;

      if (points !== undefined) {
        points.forEach((node: INodeData, index: number) => {
          const inputId = inputConnection.node;
          const inputClass = inputConnection.output;
          const connectorElement = container.querySelector(`.connection.node_in_node-${inputId}.node_out_node-${nodeData.id}.${outputSocketKey}.${inputClass}`);

          if (!connectorElement) {
            throw new Error(`Could not locate the connector element for input ID "${inputId}" - node ID "${nodeData.id}" - output socket "${outputSocketKey}" - input class "${inputClass}"`);
          }

          if (reroute_fix_curvature) {
            // If first connection then draw connector line
            if (index === 0) {
              points.forEach(_ => {
                const path = document.createElementNS('http://www.w3.org/2000/svg', "path");

                path.classList.add("main-path");
                path.setAttributeNS(null, 'd', '');

                connectorElement.appendChild(path);
              });
            }
          }

          const point = document.createElementNS('http://www.w3.org/2000/svg', "circle");
          const pos_x = node.pos_x.toString();
          const pos_y = node.pos_y.toString();

          point.classList.add("point");

          point.setAttributeNS(null, 'cx', pos_x);
          point.setAttributeNS(null, 'cy', pos_y);
          point.setAttributeNS(null, 'r', reroute_width);

          connectorElement.appendChild(point);
        });
      }
    }
  }

  private static renderContent(nodeData: INodeData): HTMLElement {
    const config = DIContainer.config;
    const content = document.createElement('div');
    const dataObject = nodeData.data;

    content.classList.add("drawflow_content_node");

    if (!nodeData.typenode) {
      content.innerHTML = nodeData.html;
    } else if (nodeData.typenode) {
      content.appendChild(config.noderegister[nodeData.html].html.cloneNode(true));
    }

    Renderer.insertObjectKeys(nodeData, content, dataObject);

    return content;
  }

  private static insertObjectKeys(
    nodeData: INodeData,
    content: HTMLElement,
    object?: {[key: string]: any},
    completeName?: string
  ) {
    if (!Helper.IsNullOrUndefined(object)) {
      for (const key in object) {
        if (object.hasOwnProperty(key)) {
          const value = object[key];

          if (typeof value === 'object') {
            Renderer.insertObjectKeys(nodeData, content, value, `${completeName}-${key}`);
          } else {
            const elementClassKey = !Helper.IsNullOrUndefined(completeName)
              ? `[df-${completeName}-${key}]`
              : `[df-${key}]`;
            const contentElements: NodeList = content.querySelectorAll(elementClassKey);
            const elementArray: HTMLInputElement[] = Array.from(contentElements)
              .map(el => el as HTMLInputElement); // Type cast NodeList elements as HTMLInputElements

            for (const element of elementArray) {
              element.value = value;

              if (element.isContentEditable) {
                element.innerText = value;
              }
            }
          }
        }
      }
    }
  }

  private static createCurvature(
    start_pos_x: number,
    start_pos_y: number,
    end_pos_x: number,
    end_pos_y: number,
    curvature_value: number,
    type: 'open' | 'close' | 'other' | 'openclose'
  ): string {
    const line_x = start_pos_x;
    const line_y = start_pos_y;
    const x = end_pos_x;
    const y = end_pos_y;
    const curvature = curvature_value;
    let hx1 = 0;
    let hx2 = 0;

    switch (type) {
      case 'open':

        if(start_pos_x >= end_pos_x) {
          hx1 = line_x + Math.abs(x - line_x) * curvature;
          hx2 = x - Math.abs(x - line_x) * (curvature*-1);
        } else {
          hx1 = line_x + Math.abs(x - line_x) * curvature;
          hx2 = x - Math.abs(x - line_x) * curvature;
        }
        return ' M '+ line_x +' '+ line_y +' C '+ hx1 +' '+ line_y +' '+ hx2 +' ' + y +' ' + x +'  ' + y;

      case 'close':

        if(start_pos_x >= end_pos_x) {
          hx1 = line_x + Math.abs(x - line_x) * (curvature*-1);
          hx2 = x - Math.abs(x - line_x) * curvature;
        } else {
          hx1 = line_x + Math.abs(x - line_x) * curvature;
          hx2 = x - Math.abs(x - line_x) * curvature;
        }
        return ' M '+ line_x +' '+ line_y +' C '+ hx1 +' '+ line_y +' '+ hx2 +' ' + y +' ' + x +'  ' + y;

      case 'other':

        if(start_pos_x >= end_pos_x) {
          hx1 = line_x + Math.abs(x - line_x) * (curvature*-1);
          hx2 = x - Math.abs(x - line_x) * (curvature*-1);
        } else {
          hx1 = line_x + Math.abs(x - line_x) * curvature;
          hx2 = x - Math.abs(x - line_x) * curvature;
        }
        return ' M '+ line_x +' '+ line_y +' C '+ hx1 +' '+ line_y +' '+ hx2 +' ' + y +' ' + x +'  ' + y;

      default:

        // No extra connection points
        hx1 = line_x + Math.abs(x - line_x) * curvature;
        hx2 = x - Math.abs(x - line_x) * curvature;

        return ' M '+ line_x +' '+ line_y +' C '+ hx1 +' '+ line_y +' '+ hx2 +' ' + y +' ' + x +'  ' + y;

    }

  }

  private static getElementCoords(element: HTMLElement) {
    return {
      cX: element.offsetWidth / 2,
      cY: element.offsetHeight / 2,
      x: element.getBoundingClientRect().x,
      y: element.getBoundingClientRect().y
    };
  }
}
