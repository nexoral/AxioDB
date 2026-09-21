import { create } from "zustand";

const DBInfoStore = create((set) => ({
  Rootname: "AxioDB",
  setRootname: (name) => set({ Rootname: name }),
}));

export { DBInfoStore };
