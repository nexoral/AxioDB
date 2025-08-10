import axios from "axios";
import { useState } from "react";
import { BASE_API_URL } from "../../config/key";
import { ExchangeKeyStore } from "../../store/store";

const CreateCollectionModal = ({
  isOpen,
  onClose,
  onCollectionCreated,
  databaseName,
}) => {
  const [collectionName, setCollectionName] = useState("");
  const [enableCrypto, setEnableCrypto] = useState(false);
  const [cryptoKey, setCryptoKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { TransactionKey } = ExchangeKeyStore((state) => state);

  // Reset form state when modal is opened/closed
  const handleClose = () => {
    setCollectionName("");
    setEnableCrypto(false);
    setCryptoKey("");
    setError("");
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate input
    if (!collectionName.trim()) {
      setError("Collection name is required");
      return;
    }

    // Alphanumeric validation (plus underscores)
    if (!/^[a-zA-Z0-9_]+$/.test(collectionName)) {
      setError(
        "Collection name can only contain letters, numbers, and underscores",
      );
      return;
    }

    // Validate crypto key if crypto is enabled
    if (enableCrypto && !cryptoKey.trim()) {
      setError("Encryption key is required when encryption is enabled");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Make API call to create collection
      const response = await axios.post(
        `${BASE_API_URL}/api/collection/create-collection`,
        {
          dbName: databaseName,
          collectionName,
          crypto: enableCrypto,
          key: enableCrypto ? cryptoKey : "",
        },
        { params: { transactiontoken: TransactionKey } },
      );

      if (
        response.data.statusCode === 200 ||
        response.data.statusCode === 201
      ) {
        // Format the new collection to match the format used in Collections.jsx
        onCollectionCreated({
          name: collectionName,
          documentCount: 0, // New collections start with 0 documents
          size: "N/A", // We don't have size info yet
        });
        handleClose();
      } else {
        throw new Error("Failed to create collection");
      }
    } catch (error) {
      console.error("Error creating collection:", error);
      setError(
        error.response?.data?.message ||
          "Failed to create collection. Please try again.",
      );
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Create New Collection
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="databaseName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Database Name
            </label>
            <input
              type="text"
              id="databaseName"
              value={databaseName}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
              disabled
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="collectionName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Collection Name
            </label>
            <input
              type="text"
              id="collectionName"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter collection name"
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between">
              <label
                htmlFor="enableCrypto"
                className="text-sm font-medium text-gray-700"
              >
                Enable Encryption
              </label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  id="enableCrypto"
                  checked={enableCrypto}
                  onChange={() => setEnableCrypto(!enableCrypto)}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="enableCrypto"
                  className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                    enableCrypto ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              </div>
            </div>
          </div>

          {enableCrypto && (
            <div className="mb-4">
              <label
                htmlFor="cryptoKey"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Encryption Key
              </label>
              <input
                type="password"
                id="cryptoKey"
                value={cryptoKey}
                onChange={(e) => setCryptoKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter encryption key"
                disabled={isSubmitting}
              />
            </div>
          )}

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center ${
                isSubmitting ? "opacity-75 cursor-not-allowed" : ""
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating...
                </>
              ) : (
                "Create Collection"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCollectionModal;
