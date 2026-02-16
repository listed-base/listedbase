import type { Duct, Event, Msg, Handler, Unsubscribe } from "./types";

export class DefaultDuct implements Duct {
  private listeners = new Map<Event, Set<Handler>>()

  send(event: Event, msg: Msg): void {
    const set = this.listeners.get(event)
    if (!set) return

    for (const handler of set) {
      handler(msg)
    }
  }

  on(event: Event, handler: Handler): Unsubscribe {
    let set = this.listeners.get(event)
    if (!set) {
      set = new Set<Handler>()
      this.listeners.set(event, set)
    }

    set.add(handler)

    return () => {
      set.delete(handler)
    }
  }
}
