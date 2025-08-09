import axios from "axios";
import { useState } from "react";
import { BASE_API_URL } from "../../config/key";
import { ExchangeKeyStore } from "../../store/store";

const DeleteCollectionModal = ({ isOpen, onClose, onCollectionDeleted, databaseName, collectionName }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { TransactionKey } = ExchangeKeyStore((state) => state);

  // Reset form state when modal is opened/closed
  const handleClose = () => {
    setError("");
    setIsSubmitting(false);
    onClose();
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      // Make API call to delete collection
      const response = await axios.delete(
        `${BASE_API_URL}/api/collection/delete-collection/?dbName=${databaseName}&collectionName=${collectionName}&transactiontoken=${TransactionKey}`
      );

      if (response.data.statusCode === 200) {
        onCollectionDeleted(collectionName);
        handleClose();
      } else {
        throw new Error("Failed to delete collection");
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
      setError(
        error.response?.data?.message ||
        "Failed to delete collection. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Delete Collection
        </h3>

        <p className="mb-6 text-gray-600">
          Are you sure you want to delete the collection <span className="font-semibold">{collectionName}</span> from database <span className="font-semibold">{databaseName}</span>? This action cannot be undone.
        </p>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

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
            type="button"
            onClick={handleDelete}
            className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center ${isSubmitting ? "opacity-75 cursor-not-allowed" : ""
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
                Deleting...
              </>
            ) : (
              "Delete Collection"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCollectionModal;
