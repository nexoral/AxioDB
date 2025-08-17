/* eslint-disable no-unused-vars */
import { useState } from 'react';
import axios from 'axios';
import { BASE_API_URL } from '../../config/key';
import { ExchangeKeyStore } from '../../store/store';

const AggregateModal = ({ isOpen, onClose, databaseName, collectionName, onAggregationResults }) => {
  const [aggregationPipeline, setAggregationPipeline] = useState('[{ "$match": {} }]');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { TransactionKey } = ExchangeKeyStore((state) => state);

  // Run the aggregation pipeline
  const handleRunAggregation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Parse the pipeline to ensure it's valid JSON
      const parsedPipeline = JSON.parse(aggregationPipeline);

      // Make the API call
      const response = await axios.post(
        `${BASE_API_URL}/api/operation/aggregate/?dbName=${databaseName}&collectionName=${collectionName}`,
        {
          aggregation: parsedPipeline
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TransactionKey}`
          }
        }
      );

      // Process and pass the results to parent component
      if (response.data && response.data.data) {
        const documents = response.data.data.documents || response.data.data;
        onAggregationResults(documents, parsedPipeline);
        onClose(); // Close the modal after successful aggregation
      }
    } catch (err) {
      console.error('Aggregation error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to run aggregation');
    } finally {
      setLoading(false);
    }
  };

  // Close the modal
  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50">
          <h3 className="text-lg font-medium text-gray-900">
            Run Aggregation Pipeline
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Enter your MongoDB aggregation pipeline as a JSON array. Example:
            </p>
            <div className="bg-gray-50 p-3 rounded-md text-xs font-mono mb-4 border border-gray-200">
              [&#123; "$match": &#123; "field": "value" &#125; &#125;, &#123; "$sort": &#123; "field": 1 &#125; &#125;]
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Running on <span className="font-semibold">{collectionName}</span> in database <span className="font-semibold">{databaseName}</span>
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aggregation Pipeline
            </label>
            <textarea
              className="w-full h-64 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              value={aggregationPipeline}
              onChange={(e) => setAggregationPipeline(e.target.value)}
              placeholder='[{ "$match": {} }]'
            ></textarea>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md mr-3"
          >
            Cancel
          </button>

          <button
            onClick={handleRunAggregation}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
          >
            {loading ? (
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
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Run Aggregation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};



export default AggregateModal;
