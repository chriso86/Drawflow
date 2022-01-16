import {MobileEventHandler} from './mobile-event.handler';
import {BaseEventHandler} from './base-event.handler';
import {ZoomHandler} from './zoom-handler';
import {Renderer} from './renderer';

export class ServiceContainer {
  private static _instance: ServiceContainer;
  private _state!: { config: IDrawflowConfig, userConfig: IUserConfig };
  private _services: {[key: string]: any} = {};

  get config(): IDrawflowConfig {
    return this._state.config;
  }

  get userConfig(): IUserConfig {
    return this._state.userConfig;
  }

  protected constructor() {
  }

  public static getInstance() {
    if (this._instance) {
      return this._instance;
    } else {
      const instance = new ServiceContainer();

      this._instance = instance;
      return instance;
    }
  }

  public GetService<T>(Service: Class<T>, ...args: any[]): T {
    const key = typeof Service;
    const existingService = this._services[key];
    const result = existingService ?? new Service(...args);

    if (!existingService) {
      this._services[key] = result;
    }

    return result;
  }

  public Initialize(drawflowConfig: IDrawflowConfig, userConfig: IUserConfig) {
    if (!drawflowConfig) {
      throw ServiceContainer.panic('Failed to initialize the service container - Drawflow config is missing.');
    }

    if (!userConfig) {
      throw ServiceContainer.panic('Failed to initialize the service container - User config is missing.');
    }

    this._state.config = drawflowConfig;
    this._state.userConfig = userConfig;

    // Set up services for injection
    const mobileEventHandlers = new MobileEventHandler(
      this.config.evCache,
      this.config.prevDiff
    );
    const baseEventHandler = new BaseEventHandler();
    const zoomHandler = new ZoomHandler();
    const renderer = new Renderer();

    this.StoreService('MobileEventHandlers', mobileEventHandlers);
    this.StoreService('BaseEventHandler', baseEventHandler);
    this.StoreService('ZoomHandler', zoomHandler);
    this.StoreService('Renderer', renderer);
  }

  private StoreService(key: string, ref: any) {
    if (!key && !ref) {
      throw ServiceContainer.panic('Invalid key or service reference while trying to store service');
    }

    this._services[key] = ref;
  }

  public static panic(error: string) {
    throw new Error(error);
  }
}
