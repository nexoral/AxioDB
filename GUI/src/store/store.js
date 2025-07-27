import axios from "axios";
import { create } from "zustand";
import { BASE_API_URL } from "../config/key";

const DBInfoStore = create((set) => ({
  Rootname: "",
  setRootname: (name) => set({ Rootname: name }),
}));

// Store for managing exchange keys
const ExchangeKeyStore = create((set) => ({
  TransactionKey: "",
  setTransactionKey: (key) => set({ TransactionKey: key }),
  loadKey: async () => {
    await axios
      .get(`${BASE_API_URL}/api/get-token`)
      .then((response) => {
        if (response.status === 200) {
          set({ TransactionKey: response.data?.data?.originSessionKey });
        }
      })
      .catch((error) => {
        console.error("Error fetching transaction key:", error);
      });
  },
}));

export { DBInfoStore, ExchangeKeyStore };
