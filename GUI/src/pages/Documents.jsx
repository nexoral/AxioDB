/* eslint-disable no-unused-vars */
import axios from 'axios';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BASE_API_URL } from '../config/key';
import { DBInfoStore, ExchangeKeyStore } from '../store/store';
import InsertDocumentModal from '../components/document/InsertDocumentModal';
import UpdateDocumentModal from '../components/document/UpdateDocumentModal';
import DeleteDocumentModal from '../components/document/DeleteDocumentModal';
import AggregateModal from '../components/document/AggregateModal';

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
  const [showAggregateModal, setShowAggregateModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Search functionality states
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

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

  // Update filtered documents when documents or search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDocuments(documents);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      // Try to parse as JSON for advanced queries
      const jsonQuery = JSON.parse(searchQuery);
      const filtered = documents.filter(doc => {
        // Check each key-value pair in the query
        return Object.entries(jsonQuery).every(([key, value]) => {
          return doc[key] !== undefined &&
            JSON.stringify(doc[key]).toLowerCase().includes(
              JSON.stringify(value).toLowerCase()
            );
        });
      });
      setFilteredDocuments(filtered);
    } catch (e) {
      // Simple string search if not valid JSON
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = documents.filter(doc =>
        JSON.stringify(doc).toLowerCase().includes(lowercaseQuery)
      );
      setFilteredDocuments(filtered);
    }
  }, [documents, searchQuery]);

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
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAggregateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-5 rounded-lg flex items-center transition-colors shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Run Aggregate
            </button>
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
        </div>

        {/* Search Box (MongoDB Compass style) */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search documents... (e.g., "John" or {"name": "John"})`}
              className="pl-10 py-2 pr-4 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            {searchQuery && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          {searchQuery && (
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span className="mr-2">
                Found {filteredDocuments.length} matching {filteredDocuments.length === 1 ? 'document' : 'documents'}
              </span>
              {isSearching && documents.length > 0 && (
                <span className="text-indigo-600 font-medium">
                  {Math.round((filteredDocuments.length / documents.length) * 100)}% of total
                </span>
              )}
            </div>
          )}
        </div>

        {/* Card-based document view */}
        <div className="p-6">
          {loading && documents.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2 mb-2"></div>
                  <div className="h-20 bg-gray-100 rounded mb-3"></div>
                  <div className="flex justify-end">
                    <div className="h-8 bg-gray-200 rounded w-16 mr-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (searchQuery ? filteredDocuments : documents).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(searchQuery ? filteredDocuments : documents).map((doc, index) => (
                <div
                  key={doc.documentId}
                  ref={!searchQuery && index === documents.length - 1 ? lastDocumentElementRef : null}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <div className="font-mono text-indigo-700 font-semibold" title={doc.documentId}>
                          <span className="text-sm">ID: {doc.documentId}</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500" title={doc.updatedAt}>
                        {formatDate(doc.updatedAt)}
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded p-3 mb-3 h-48 overflow-y-auto">
                      <pre className="text-xs font-mono whitespace-pre-wrap break-words text-gray-800">
                        {JSON.stringify(
                          Object.fromEntries(
                            Object.entries(doc).filter(
                              ([key]) => !['documentId', 'updatedAt'].includes(key)
                            )
                          ),
                          null, 2
                        )}
                      </pre>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleUpdateClick(doc)}
                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md text-sm transition-colors"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => handleDeleteClick(doc)}
                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              {searchQuery ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-gray-500 mb-2">No documents match your search criteria</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 mb-2">No documents found in this collection</p>
                  <button
                    onClick={() => setShowInsertModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Insert Your First Document
                  </button>
                </>
              )}
            </div>
          )}

          {/* Loading state for infinite scroll - only show when not searching */}
          {loading && documents.length > 0 && !searchQuery && (
            <div className="flex justify-center items-center py-4">
              <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}

          {/* End of results message - only show when not searching */}
          {!loading && !hasMore && documents.length > 0 && !searchQuery && (
            <div className="text-center py-4 text-gray-500 text-sm border-t border-gray-100 mt-6">
              You've reached the end of the results.
            </div>
          )}
        </div>
      </div>

      {/* Insert Document Modal */}
      {showInsertModal && (
        <InsertDocumentModal
          isOpen={showInsertModal}
          onClose={() => setShowInsertModal(false)}
          onDocumentInserted={handleInsertDocument}
          databaseName={databaseName}
          collectionName={collectionName}
          onSuccess={() => fetchDocuments(1, true)} // Re-fetch documents after successful insertion
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

      {/* Aggregate Modal */}
      {showAggregateModal && (
        <AggregateModal
          isOpen={showAggregateModal}
          onClose={() => setShowAggregateModal(false)}
          databaseName={databaseName}
          collectionName={collectionName}
          onSuccess={() => fetchDocuments(1, true)}
        />
      )}
    </div>
  );
};

export default Documents;
