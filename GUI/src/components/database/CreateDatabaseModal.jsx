import { useState } from "react";
import axios from "axios";
import { BASE_API_URL } from "../../config/key";

const CreateDatabaseModal = ({ isOpen, onClose, onDatabaseCreated }) => {
  const [databaseName, setDatabaseName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset form state when modal is opened/closed
  const handleClose = () => {
    setDatabaseName("");
    setError("");
    setIsSubmitting(false); // Ensure submission state is reset when closing
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate input
    if (!databaseName.trim()) {
      setError("Database name is required");
      return;
    }

    // Alphanumeric validation (plus underscores)
    if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
      setError(
        "Database name can only contain letters, numbers, and underscores",
      );
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Make actual API call to create database
      const response = await axios.post(
        `${BASE_API_URL}/api/db/create-database`,
        { name: databaseName }
      );

      if (
        response.data.statusCode === 200 ||
        response.data.statusCode === 201
      ) {
        onDatabaseCreated(databaseName);
        setIsSubmitting(false); // Reset submission state on success
        handleClose();
      } else {
        setIsSubmitting(false); // Reset submission state on success
        throw new Error("Failed to create database");
      }
    } catch (error) {
      console.error("Error creating database:", error);
      setError(
        error.response?.data?.message ||
          "Failed to create database. Please try again.",
      );
      setIsSubmitting(false);
    }
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Create New Database
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
              onChange={(e) => setDatabaseName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter database name"
              disabled={isSubmitting}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

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
              className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center ${isSubmitting ? "opacity-75 cursor-not-allowed" : ""}`}
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
                "Create Database"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDatabaseModal;
