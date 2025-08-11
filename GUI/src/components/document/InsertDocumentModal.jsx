import { useState } from 'react';
import axios from 'axios';
import { ExchangeKeyStore } from '../../store/store';
import { BASE_API_URL } from '../../config/key';

const InsertDocumentModal = ({ isOpen, onClose, onDocumentInserted, databaseName, collectionName, onSuccess }) => {
  const [documentData, setDocumentData] = useState('{\n  \n}');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { TransactionKey } = ExchangeKeyStore((state) => state);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Validate JSON
      const parsedData = JSON.parse(documentData);
      setLoading(true);

      // Send to the API using the correct endpoint structure
      const response = await axios.post(
        `${BASE_API_URL}/api/operation/create/?dbName=${databaseName}&collectionName=${collectionName}&transactiontoken=${TransactionKey}`,
        {
          ...parsedData
        }
      );

      if (response.status === 200 || response.status === 201) {
        // Extract the documentId from the response
        const documentId = response.data.data?.documentId;

        // Construct the inserted document with the returned documentId
        const insertedDocument = {
          ...parsedData,
          documentId: documentId || `doc_${Date.now()}`,
          updatedAt: new Date().toISOString()
        };

        // Call the callback with the inserted document
        onDocumentInserted(insertedDocument);

        // Close the modal
        onClose();

        // Re-fetch documents to ensure the list is up to date
        if (typeof onSuccess === 'function') {
          onSuccess();
        }
      } else {
        throw new Error('Failed to insert document');
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your input.');
      } else {
        setError(`Error inserting document: ${error.message}`);
      }
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center backdrop-blur-sm">
      <div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Insert New Document
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

        <div className="p-6 overflow-y-auto flex-grow">
          <div className="mb-4 flex items-center space-x-2 bg-blue-50 p-3 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-blue-700">
              Enter the document data in JSON format to insert into <span className="font-semibold">{collectionName}</span>
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Data (JSON)
              </label>
              <textarea
                value={documentData}
                onChange={(e) => setDocumentData(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm focus:ring-blue-500 focus:border-blue-500 shadow-inner bg-gray-50"
                placeholder="Enter JSON document data"
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                The documentId and updatedAt fields will be automatically generated.
              </p>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white flex items-center ${loading ? 'bg-green-500' : 'bg-green-600 hover:bg-green-700'
                  } transition-colors shadow-md`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Inserting...
                  </>
                ) : 'Insert Document'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InsertDocumentModal;
