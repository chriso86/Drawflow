import {Helper} from './helper';

export class Stage {

  stage() {

    // Loop through all of the output connections (CLOSED CONNECTIONS)
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

      // There are NO extra points, draw a direct connection line
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
            let lineCurveSearch = Renderer.createCurvature(line_x, line_y, eX, eY, rerouteCurvatureStartEnd, 'open');

            lineCurve += lineCurveSearch;
            rerouteFix.push(lineCurveSearch);

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

            lineCurve += lineCurveSearch;
            rerouteFix.push(lineCurveSearch);

          } else if (index === 0) {
            // There is more than one extra connection point, and this is the first one

            const outputClass = Helper.GetClassContainingString(nodeParentElement.classList, 'output_');
            const outputElement = nodeElement?.querySelectorAll(`.${outputClass}`).item(0) as HTMLElement;
            const outputElementCoords = Renderer.getElementCoords(outputElement);

            let eX = (pointElementCoords.x - precanvas.getBoundingClientRect().x) * precanvasWidthZoom + rerouteWidth;
            let eY = (pointElementCoords.y - precanvas.getBoundingClientRect().y) * precanvasHeightZoom + rerouteWidth;
            let line_x = outputElementCoords.cX + (outputElementCoords.x - precanvasCoords.x) * precanvasWidthZoom;
            let line_y = outputElementCoords.cY + (outputElementCoords.y - precanvasCoords.y) * precanvasHeightZoom;
            let lineCurveSearch = Renderer.createCurvature(line_x, line_y, eX, eY, rerouteCurvatureStartEnd, 'open');

            lineCurve += lineCurveSearch;
            rerouteFix.push(lineCurveSearch);

            // Get the next point and draw the final connection point line (For this iteration)
            const nextElement = arr.item(index + 1);
            const nextElementCoords = Renderer.getElementCoords(nextElement);

            eX = (nextElementCoords.x - precanvasCoords.x) * precanvasWidthZoom + rerouteWidth;
            eY = (nextElementCoords.y - precanvasCoords.y) * precanvasHeightZoom + rerouteWidth;
            line_x = (pointElementCoords.x - precanvasCoords.x) * precanvasWidthZoom + rerouteWidth;
            line_y = (pointElementCoords.y - precanvasCoords.y) * precanvasHeightZoom + rerouteWidth;
            lineCurveSearch = Renderer.createCurvature(line_x, line_y, eX, eY, rerouteCurvature, 'other');

            lineCurve += lineCurveSearch;
            rerouteFix.push(lineCurveSearch);

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
            const line_x = (nodeCoords.x - precanvasCoords.x) * (precanvas.clientWidth / (precanvas.clientWidth * zoom)) + rerouteWidth;
            const line_y = (nodeCoords.y - precanvasCoords.y) * (precanvas.clientHeight / (precanvas.clientHeight * zoom)) + rerouteWidth;
            const lineCurveSearch = Renderer.createCurvature(line_x, line_y, eX, eY, rerouteCurvatureStartEnd, 'close');

            lineCurve += lineCurveSearch;
            rerouteFix.push(lineCurveSearch);

          } else {
            // There is more than one extra connection point, and this is one of the middle ones

            const nextElement = arr.item(index + 1);
            const nextElementCoords = Renderer.getElementCoords(nextElement);

            const eX = (nextElementCoords.x - precanvasCoords.x) * (precanvas.clientWidth / (precanvas.clientWidth * zoom)) + rerouteWidth;
            const eY = (nextElementCoords.y - precanvasCoords.y) * (precanvas.clientHeight / (precanvas.clientHeight * zoom)) + rerouteWidth;
            const line_x = (pointElementCoords.x - precanvasCoords.x) * (precanvas.clientWidth / (precanvas.clientWidth * zoom)) + rerouteWidth;
            const line_y = (pointElementCoords.y - precanvasCoords.y) * (precanvas.clientHeight / (precanvas.clientHeight * zoom)) + rerouteWidth;
            const lineCurveSearch = Renderer.createCurvature(line_x, line_y, eX, eY, rerouteCurvature, 'other');

            lineCurve += lineCurveSearch;
            rerouteFix.push(lineCurveSearch);
          }

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

  }

}
