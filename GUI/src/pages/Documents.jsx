import axios from 'axios';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BASE_API_URL } from '../config/key';
import { DBInfoStore, ExchangeKeyStore } from '../store/store';
import InsertDocumentModal from '../components/document/InsertDocumentModal';
import UpdateDocumentModal from '../components/document/UpdateDocumentModal';
import DeleteDocumentModal from '../components/document/DeleteDocumentModal';

const Documents = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const observer = useRef();
  const databaseName = searchParams.get('database');
  const collectionName = searchParams.get('collection');
  const { TransactionKey } = ExchangeKeyStore((state) => state);

  // Modal states
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Fetch documents function
  const fetchDocuments = useCallback(async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${BASE_API_URL}/api/operation/all/?dbName=${databaseName}&collectionName=${collectionName}&page=${pageNum}&transactiontoken=${TransactionKey}`
      );

      if (response.status === 200) {
        // Extract the documents from the nested response structure
        const fetchedDocuments = response.data.data.data.documents || [];

        // Update documents state
        if (reset) {
          setDocuments(fetchedDocuments);
        } else {
          setDocuments(prev => [...prev, ...fetchedDocuments]);
        }

        // If we received fewer than 10 documents, we've reached the end
        setHasMore(fetchedDocuments.length === 10);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setLoading(false);
    }
  }, [databaseName, collectionName, TransactionKey]);

  // Initialize document list
  useEffect(() => {
    if (!databaseName || !collectionName) {
      navigate('/collections');
      return;
    }

    // Reset and fetch documents when collection changes
    setPage(1);
    setDocuments([]);
    fetchDocuments(1, true);
  }, [databaseName, collectionName, navigate, fetchDocuments]);

  // Infinite scroll implementation
  const lastDocumentElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
        fetchDocuments(page + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore, fetchDocuments, page]);

  const handleBackToCollections = () => {
    navigate(`/collections?database=${databaseName}`);
  };

  const handleInsertDocument = (newDocument) => {
    setDocuments(prev => [newDocument, ...prev]);
  };

  const handleUpdateClick = (document) => {
    setSelectedDocument(document);
    setShowUpdateModal(true);
  };

  const handleDeleteClick = (document) => {
    setSelectedDocument(document);
    setShowDeleteModal(true);
  };

  const handleUpdateDocument = (updatedDoc) => {
    setDocuments(prev =>
      prev.map(doc => doc.documentId === updatedDoc.documentId ? updatedDoc : doc)
    );
  };

  const handleDeleteDocument = (deletedDocId) => {
    setDocuments(prev => prev.filter(doc => doc.documentId !== deletedDocId));
  };

  // Format date for better readability
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div>
            <div className="flex items-center mb-2">
              <button
                onClick={handleBackToCollections}
                className="text-blue-600 hover:text-blue-800 flex items-center transition-colors font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Collections
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
            <div className="flex items-center mt-1 text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 002-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              <span className="font-medium">{collectionName}</span>
              <span className="mx-2">in</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="font-medium">{databaseName}</span>
            </div>
          </div>
          <button
            onClick={() => setShowInsertModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-5 rounded-lg flex items-center transition-colors shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Insert Document
          </button>
        </div>

        {/* Documents table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated At
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document Data
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc, index) => (
                <tr
                  key={doc.documentId}
                  ref={index === documents.length - 1 ? lastDocumentElementRef : null}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-indigo-700 font-semibold">{doc.documentId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(doc.updatedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div className="bg-gray-50 p-2 rounded border border-gray-100 max-w-lg overflow-x-auto">
                        {Object.entries(doc)
                          .filter(([key]) => !['documentId', 'updatedAt'].includes(key))
                          .map(([key, value]) => (
                            <div key={key} className="flex items-start mb-1 last:mb-0">
                              <span className="text-indigo-600 font-medium mr-2">{key}:</span>
                              <span className="text-gray-800">{typeof value === 'object' ? JSON.stringify(value) : value.toString()}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleUpdateClick(doc)}
                      className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md mr-2 transition-colors"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleDeleteClick(doc)}
                      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {/* Loading state for infinite scroll */}
              {loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-4">
                    <div className="flex justify-center items-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-indigo-500">Loading documents...</span>
                    </div>
                  </td>
                </tr>
              )}

              {/* No documents state */}
              {!loading && documents.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">
                    <div className="text-center py-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
                      </svg>
                      <p className="text-gray-500 mb-2">No documents found in this collection</p>
                      <button
                        onClick={() => setShowInsertModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Insert Your First Document
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* End of results message */}
        {!loading && !hasMore && documents.length > 0 && (
          <div className="text-center py-4 text-gray-500 text-sm border-t border-gray-100">
            You've reached the end of the results.
          </div>
        )}
      </div>

      {/* Insert Document Modal */}
      {showInsertModal && (
        <InsertDocumentModal
          isOpen={showInsertModal}
          onClose={() => setShowInsertModal(false)}
          onDocumentInserted={handleInsertDocument}
          databaseName={databaseName}
          collectionName={collectionName}
        />
      )}

      {/* Update Document Modal */}
      {showUpdateModal && selectedDocument && (
        <UpdateDocumentModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          onDocumentUpdated={handleUpdateDocument}
          document={selectedDocument}
          databaseName={databaseName}
          collectionName={collectionName}
        />
      )}

      {/* Delete Document Modal */}
      {showDeleteModal && selectedDocument && (
        <DeleteDocumentModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDocumentDeleted={handleDeleteDocument}
          documentId={selectedDocument.documentId}
          databaseName={databaseName}
          collectionName={collectionName}
        />
      )}
    </div>
  );
};

export default Documents;
