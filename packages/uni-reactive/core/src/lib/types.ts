export interface IReactive {
  value: unknown
  modify: (next: (prev: unknown) => unknown | unknown) => void
}