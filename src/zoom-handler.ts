import {DIContainer} from './drawflow';
import {BaseEventHandler} from './base-event.handler';

export class ZoomHandler {
  public zoom_in() {
    const userConfig = DIContainer.userConfig;

    if(userConfig.zoom < userConfig.zoom_max) {
      userConfig.zoom += userConfig.zoom_value;
      this.zoom_refresh();
    }
  }

  public zoom_out() {
    const userConfig = DIContainer.userConfig;

    if(userConfig.zoom > userConfig.zoom_min) {
      userConfig.zoom -= userConfig.zoom_value;
      this.zoom_refresh();
    }
  }

  public zoom_reset(){
    const userConfig = DIContainer.userConfig;

    if(userConfig.zoom != 1) {
      userConfig.zoom = 1;
      this.zoom_refresh();
    }
  }

  zoom_refresh(){
    const config = DIContainer.config;
    const userConfig = DIContainer.userConfig;
    const eventHandler = DIContainer.GetService(BaseEventHandler);

    eventHandler.dispatch('zoom', userConfig.zoom);

    config.canvas_x = (config.canvas_x / userConfig.zoom_last_value) * userConfig.zoom;
    config.canvas_y = (config.canvas_y / userConfig.zoom_last_value) * userConfig.zoom;
    config.precanvas!.style.transform = "translate("+config.canvas_x+"px, "+config.canvas_y+"px) scale("+userConfig.zoom+")";
    userConfig.zoom_last_value = userConfig.zoom;
  }
}
