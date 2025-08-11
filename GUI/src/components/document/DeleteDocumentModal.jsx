import { useState } from 'react';
import axios from 'axios';
import { ExchangeKeyStore } from '../../store/store';
import { BASE_API_URL } from '../../config/key';

const DeleteDocumentModal = ({ isOpen, onClose, onDocumentDeleted, documentId, databaseName, collectionName }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { TransactionKey } = ExchangeKeyStore((state) => state);

  const handleDelete = async () => {
    try {
      setLoading(true);

      // Send to the API using the correct endpoint structure
      const response = await axios.delete(
        `${BASE_API_URL}/api/operation/delete/?dbName=${databaseName}&collectionName=${collectionName}&documentId=${documentId}&transactiontoken=${TransactionKey}`
      );

      if (response.status === 200) {
        onDocumentDeleted(documentId);
        onClose();
      } else {
        throw new Error('Failed to delete document');
      }
    } catch (error) {
      setError(`Error deleting document: ${error.message}`);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center backdrop-blur-sm">
      <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Document
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="bg-red-50 p-4 rounded-md mb-5">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Are you sure you want to delete this document?</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>This action cannot be undone.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-5">
            <p className="text-gray-700 mb-2">
              <span className="font-medium">Document ID:</span>
            </p>
            <div className="bg-gray-50 p-2 rounded border border-gray-200 font-mono text-sm break-all">
              {documentId}
            </div>
          </div>

          <div className="mb-5">
            <p className="text-gray-700 mb-1">
              <span className="font-medium">Collection:</span> {collectionName}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Database:</span> {databaseName}
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
              <p>{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className={`px-4 py-2 rounded-md text-white flex items-center ${loading ? 'bg-red-500' : 'bg-red-600 hover:bg-red-700'
                } transition-colors shadow-md`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : 'Delete Document'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteDocumentModal;
