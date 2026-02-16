export type Event = 'provider:change' | 'engine:change';

export type Operation = 'add' | 'update' | 'delete';

export type Item = {
  _id: string;
  [key: string]: any;
};

export interface ChangePayload {
  list: string;
  op: Operation;
  data: Item;
}

/** الرسالة = مجموعة تغييرات */
export type Msg = ChangePayload[];



export type Handler = (msg: Msg) => void

export type Unsubscribe = () => void
/**
 * Target interface (Adapter Pattern)
 * أي Adapter يجب أن يطبّق هذا العقد
 */
export interface Duct {
  send(event: Event, msg: Msg): void
  on(event: Event, handler: Handler): Unsubscribe
}

