import {DIContainer} from './drawflow';

export class BaseEventHandler {
  public dispatch (event: string, details: any): boolean | void {
    const events = DIContainer.config.events;

    // Check if this event not exists
    if (events[event] === undefined) {
      return false;
    }

    for (let listener of events[event].listeners) {
      listener(details);
    }
  }
}
