import {DIContainer} from './drawflow';
import {ZoomHandler} from './zoom-handler';

export class MobileEventHandler {
  constructor(
    public evCache: PointerEvent[],
    public prevDiff: number
  ) {
  }

  public pointerdown_handler(event: PointerEvent) {
    this.evCache.push(event);
  }

  public pointermove_handler(event: PointerEvent) {
    const zoomHandler = DIContainer.GetService(ZoomHandler);

    this.evCache.forEach((e: PointerEvent, index: number, array: PointerEvent[]) => {
      if (event.pointerId == e.pointerId) {
        array[index] = event;
      }
    });

    if (this.evCache.length == 2) {
      // Calculate the distance between the two pointers
      const curDiff = Math.abs(this.evCache[0].clientX - this.evCache[1].clientX);

      if (this.prevDiff > 100) {
        if (curDiff > this.prevDiff) {
          // The distance between the two pointers has increased
          zoomHandler.zoom_in();
        }

        if (curDiff < this.prevDiff) {
          // The distance between the two pointers has decreased
          zoomHandler.zoom_out();
        }
      }
      this.prevDiff = curDiff;
    }
  }

  public pointerup_handler(event: PointerEvent) {
    this.remove_event(event);
    if (this.evCache.length < 2) {
      this.prevDiff = -1;
    }
  }

  public remove_event(event: PointerEvent) {
    const cache = this.evCache;
    const index = cache.findIndex(e => e.pointerId == event.pointerId);

    // Remove this event from the target's cache
    if (index > -1) {
      cache.splice(index, 1);
    }
  }
}
