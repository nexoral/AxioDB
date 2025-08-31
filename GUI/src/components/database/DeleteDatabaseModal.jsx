import { useState } from "react";
import axios from "axios";
import { BASE_API_URL } from "../../config/key";

const DeleteDatabaseModal = ({ isOpen, dbName, onClose, onConfirmDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      // Make actual API call to delete database
      const response = await axios.delete(
        `${BASE_API_URL}/api/db/delete-database`,
        {
          params: {
            dbName,
          },
        },
      );

      if (response.status === 200) {
        console.log("Database deleted successfully:", response.data);
        onConfirmDelete();
      } else {
        throw new Error("Failed to delete database");
      }
    } catch (error) {
      console.error("Error deleting database:", error);
      alert(
        error.response?.data?.message ||
          "Failed to delete database. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 animate-fadeIn">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Confirm Deletion
        </h3>
        <p className="text-gray-700 mb-6">
          Are you sure you want to delete the database "{dbName}"? This action
          cannot be undone.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center ${
              isDeleting ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {isDeleting ? (
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
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDatabaseModal;
