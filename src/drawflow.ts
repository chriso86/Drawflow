import {Config} from './config';
import {UserConfig} from './user-config';
import {MobileEventHandler} from './mobile-event.handler';
import {ServiceContainer} from './service.container';
import {Renderer} from './renderer';

export const DIContainer: ServiceContainer = ServiceContainer.getInstance();

export class Drawflow implements IDrawflow {
  /***
   * Construct the Drawflow component
   * @param {Container} container
   * @param {HTMLElement} parent
   * @param {IUserConfig} config
   */
  constructor(
    container: Container,
    parent: HTMLElement,
    config: IUserConfig
  ) {
    // Set up configurations
    const internalConfig = new Config(container);
    const userConfig = new UserConfig(
      config?.module,
      config?.editor_mode,
      config?.zoom,
      config?.zoom_max,
      config?.zoom_min,
      config?.zoom_value,
      config?.zoom_last_value
    );

    // Configure the DI Container
    DIContainer.Initialize(internalConfig, userConfig);
  }

  // Public Methods
  public start() {
    const config = DIContainer.config;
    const container = config.container;
    const precanvas = config.precanvas;

    Drawflow.configureDrawflow(container, precanvas);

    this.bindMobileEvents(container);
    this.bindMouseEvents(container);
    this.bindKeyEvents(container);

    this.load();
  }

  public load() {
    const renderer = DIContainer.GetService(Renderer);
    const config = DIContainer.config;
    const module = DIContainer.userConfig.module;
    const drawflow = config.drawflow;

    for (const key in drawflow.drawflow[module].data) {
      renderer.addNodeImport(drawflow.drawflow[module].data[key], config.precanvas!);
    }

    if (config.reroute) {
      for (const key in drawflow.drawflow[module].data) {
        renderer.addRerouteImport(drawflow.drawflow[module].data[key]);
      }
    }

    for (const key in drawflow.drawflow[module].data) {
      renderer.updateNodeConnections('node-' + key);
    }

    const editor = drawflow.drawflow;
    let number = 1;

    Object.keys(editor)
      .map((moduleName: string) => {
        Object.keys(editor[moduleName].data)
          .map((id: string) => {
            if (parseInt(id) >= number) {
              number = parseInt(id) + 1;
            }
          });
      });

    config.nodeId = number;
  }

  // Private Methods
  private static configureDrawflow(container: Container, precanvas: Element | null): void {
    container.classList.add("parent-drawflow");
    container.tabIndex = 0;
    precanvas = document.createElement('div');
    precanvas.classList.add("drawflow");
    container.appendChild(precanvas);
  }

  private bindKeyEvents(container: Container): void {
    container.addEventListener('keydown', this.key.bind(this));
    container.addEventListener('input', this.updateNodeValue.bind(this));
  }

  private bindMouseEvents(container: Container): void {
    /* Mouse Actions */
    container.addEventListener('mouseup', this.dragEnd.bind(this));
    container.addEventListener('mousemove', this.position.bind(this));
    container.addEventListener('mousedown', this.click.bind(this));
    container.addEventListener('contextmenu', this.contextmenu.bind(this));
    container.addEventListener('wheel', this.zoom_enter.bind(this));
    container.addEventListener('dblclick', this.dblclick.bind(this));
  }

  private bindMobileEvents(container: Container): void {
    const eventHandler = DIContainer.GetService(MobileEventHandler);

    /* Touch Actions */
    container.addEventListener('touchend', this.dragEnd.bind(this));
    container.addEventListener('touchmove', this.position.bind(this));
    container.addEventListener('touchstart', this.click.bind(this));

    /* Mobile zoom */
    container.onpointerdown = eventHandler.pointerdown_handler.bind(this);
    container.onpointermove = eventHandler.pointermove_handler.bind(this);
    container.onpointerup = eventHandler.pointerup_handler.bind(this);
    container.onpointercancel = eventHandler.pointerup_handler.bind(this);
    container.onpointerout = eventHandler.pointerup_handler.bind(this);
    container.onpointerleave = eventHandler.pointerup_handler.bind(this);
  }
}
