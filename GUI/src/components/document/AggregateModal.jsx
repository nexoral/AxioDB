/* eslint-disable no-unused-vars */
import { useState } from 'react';
import axios from 'axios';
import { ExchangeKeyStore } from '../../store/store';
import { BASE_API_URL } from '../../config/key';

const AggregateModal = ({ isOpen, onClose, databaseName, collectionName, onSuccess }) => {
  const [aggregatePipeline, setAggregatePipeline] = useState('[\n  {\n    "$match": {\n      \n    }\n  }\n]');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { TransactionKey } = ExchangeKeyStore((state) => state);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResults(null);

    try {
      // Validate JSON
      const parsedPipeline = JSON.parse(aggregatePipeline);
      setLoading(true);

      // Send to the API
      const response = await axios.post(
        `${BASE_API_URL}/api/operation/aggregate/?dbName=${databaseName}&collectionName=${collectionName}&transactiontoken=${TransactionKey}`,
        {
          pipeline: parsedPipeline
        }
      );

      if (response.status === 200) {
        // Set the results
        setResults(response.data.data || []);
        setLoading(false);
      } else {
        throw new Error('Failed to run aggregation');
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your input.');
      } else {
        setError(`Error running aggregation: ${error.message}`);
      }
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center backdrop-blur-sm">
      <div className="relative bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Run Aggregate Pipeline
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
          <div className="mb-4 flex items-center space-x-2 bg-indigo-50 p-3 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-indigo-700">
              Enter an aggregation pipeline in JSON format to run against <span className="font-semibold">{collectionName}</span>
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
                Aggregation Pipeline (JSON Array)
              </label>
              <textarea
                value={aggregatePipeline}
                onChange={(e) => setAggregatePipeline(e.target.value)}
                className="w-full h-48 p-3 border border-gray-300 rounded-md font-mono text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-inner bg-gray-50"
                placeholder="Enter aggregation pipeline as JSON array"
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                Example: [{'{'}$match: {'{'}field: "value"{'}'}{'}'}, {'{'}$sort: {'{'}field: 1{'}'}{'}'}]
              </p>
            </div>

            <div className="flex justify-end space-x-3 mt-6 mb-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white flex items-center ${loading ? 'bg-indigo-500' : 'bg-indigo-600 hover:bg-indigo-700'
                  } transition-colors shadow-md`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : 'Run Aggregate'}
              </button>
            </div>
          </form>

          {/* Results Section */}
          {results && (
            <div className="border-t pt-6">
              <h4 className="text-lg font-medium text-gray-800 mb-3">Aggregation Results</h4>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 overflow-auto max-h-80">
                <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-800">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AggregateModal;
