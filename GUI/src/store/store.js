import { create } from 'zustand'

const DBInfoStore = create((set) => ({
  Rootname: '',
  setRootname: (name) => set({ Rootname: name })
}))

export { DBInfoStore }
