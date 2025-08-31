/* eslint-disable no-unused-vars */
import axios from 'axios'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BASE_API_URL } from '../config/key'
import { DBInfoStore } from '../store/store'
import InsertDocumentModal from '../components/document/InsertDocumentModal'
import UpdateDocumentModal from '../components/document/UpdateDocumentModal'
import DeleteDocumentModal from '../components/document/DeleteDocumentModal'
import AggregateModal from '../components/document/AggregateModal'

const Documents = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState([])
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const observer = useRef()
  const databaseName = searchParams.get('database')
  const collectionName = searchParams.get('collection')

  // Modal states
  const [showInsertModal, setShowInsertModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAggregateModal, setShowAggregateModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)

  // Add new state for aggregation
  const [isAggregationView, setIsAggregationView] = useState(false)
  const [aggregationPipeline, setAggregationPipeline] = useState([])
  const [aggregationResults, setAggregationResults] = useState([])

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [documentIdInput, setDocumentIdInput] = useState('')
  const searchTimeoutRef = useRef(null)
  const documentIdTimeoutRef = useRef(null)

  // Fetch documents function - regular API
  const fetchDocuments = useCallback(
    async (pageNum = 1, reset = false) => {
      try {
        setLoading(true)

        const response = await axios.get(
          `${BASE_API_URL}/api/operation/all/?dbName=${databaseName}&collectionName=${collectionName}&page=${pageNum}`
        )

        if (response.status === 200) {
          // Extract the documents from the nested response structure
          const fetchedDocuments = response.data.data.data.documents || []

          // Update documents state
          if (reset) {
            setDocuments(fetchedDocuments)
          } else {
            setDocuments((prev) => [...prev, ...fetchedDocuments])
          }

          // If we received fewer than 10 documents, we've reached the end
          setHasMore(fetchedDocuments.length === 10)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error fetching documents:', error)
        setLoading(false)
      }
    },
    [databaseName, collectionName]
  )

  // Fetch documents with query - query-based API
  const fetchDocumentsByQuery = useCallback(
    async (query, pageNum = 1, reset = false) => {
      try {
        setLoading(true)

        const response = await axios.post(
          `${BASE_API_URL}/api/operation/all/by-query/?dbName=${databaseName}&collectionName=${collectionName}&page=${pageNum}`,
          {
            query
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )

        if (response.status === 200) {
          // Extract the documents from the nested response structure
          const fetchedDocuments = response.data.data.data.documents || []

          // Update documents state
          if (reset) {
            setDocuments(fetchedDocuments)
          } else {
            setDocuments((prev) => [...prev, ...fetchedDocuments])
          }

          // If we received fewer than 10 documents, we've reached the end
          setHasMore(fetchedDocuments.length === 10)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error fetching documents by query:', error)
        setLoading(false)
      }
    },
    [databaseName, collectionName]
  )

  // Initialize document list
  useEffect(() => {
    if (!databaseName || !collectionName) {
      navigate('/collections')
      return
    }

    // Reset aggregation view when collection changes
    setIsAggregationView(false)
    setAggregationPipeline([])
    setIsSearchMode(false)
    setSearchQuery('')
    setSearchInput('')
    setDocumentIdInput('')

    // Clear any pending timeouts
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    if (documentIdTimeoutRef.current) {
      clearTimeout(documentIdTimeoutRef.current)
    }

    // Reset and fetch documents when collection changes
    setPage(1)
    setDocuments([])
    fetchDocuments(1, true)
  }, [databaseName, collectionName, navigate, fetchDocuments])

  // Infinite scroll implementation - only apply when not in aggregation view
  const lastDocumentElementRef = useCallback(
    (node) => {
      if (loading || isAggregationView) return // Don't apply infinite scroll in aggregation view
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1)
          // Use appropriate fetch function based on search mode
          if (isSearchMode && searchQuery) {
            fetchDocumentsByQuery(searchQuery, page + 1)
          } else {
            fetchDocuments(page + 1)
          }
        }
      })

      if (node) observer.current.observe(node)
    },
    [
      loading,
      hasMore,
      fetchDocuments,
      fetchDocumentsByQuery,
      page,
      isAggregationView,
      isSearchMode,
      searchQuery
    ]
  )

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      if (documentIdTimeoutRef.current) {
        clearTimeout(documentIdTimeoutRef.current)
      }
    }
  }, [])

  const handleBackToCollections = () => {
    navigate(`/collections?database=${databaseName}`)
  }

  const handleInsertDocument = (newDocument) => {
    setDocuments((prev) => [newDocument, ...prev])
  }

  const handleUpdateClick = (document) => {
    setSelectedDocument(document)
    setShowUpdateModal(true)
  }

  const handleDeleteClick = (document) => {
    setSelectedDocument(document)
    setShowDeleteModal(true)
  }

  // Add function to re-run aggregation query
  const rerunAggregation = async () => {
    try {
      setLoading(true)

      const response = await axios.post(
        `${BASE_API_URL}/api/operation/aggregate/?dbName=${databaseName}&collectionName=${collectionName}`,
        {
          aggregation: aggregationPipeline
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data && response.data.data) {
        setAggregationResults(
          response.data.data.documents || response.data.data
        )
      }

      setLoading(false)
    } catch (error) {
      console.error('Error re-running aggregation:', error)
      setLoading(false)
    }
  }

  const handleUpdateDocument = (updatedDoc) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.documentId === updatedDoc.documentId ? updatedDoc : doc
      )
    )

    // If we're in aggregation view, re-run the aggregation query
    if (isAggregationView) {
      rerunAggregation()
    }
  }

  const handleDeleteDocument = (deletedDocId) => {
    setDocuments((prev) =>
      prev.filter((doc) => doc.documentId !== deletedDocId)
    )

    // If we're in aggregation view, re-run the aggregation query
    if (isAggregationView) {
      rerunAggregation()
    }
  }

  // Add function to handle aggregation results
  const handleAggregationResults = (results, pipeline) => {
    setAggregationResults(results)
    setAggregationPipeline(pipeline)
    setIsAggregationView(true)
  }

  // Add function to clear aggregation and return to normal view
  const clearAggregation = () => {
    setIsAggregationView(false)
    setAggregationPipeline([])
    setAggregationResults([])
    // Refresh the document list based on current search state
    if (isSearchMode && searchQuery) {
      fetchDocumentsByQuery(searchQuery, 1, true)
    } else {
      fetchDocuments(1, true)
    }
  }

  // Debounced search functionality
  const handleSearchInputChange = (value) => {
    setSearchInput(value)

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value)
    }, 500) // 500ms debounce
  }

  // Debounced document ID search
  const handleDocumentIdInputChange = (value) => {
    setDocumentIdInput(value)

    // Clear existing timeout
    if (documentIdTimeoutRef.current) {
      clearTimeout(documentIdTimeoutRef.current)
    }

    // Set new timeout for debounced search
    documentIdTimeoutRef.current = setTimeout(() => {
      performDocumentIdSearch(value)
    }, 300) // 300ms debounce for ID search
  }

  // Perform search based on query input
  const performSearch = (input) => {
    try {
      if (!input.trim()) {
        // If search input is empty, switch to regular mode
        setIsSearchMode(false)
        setSearchQuery('')
        setIsAggregationView(false)
        setPage(1)
        setDocuments([])
        fetchDocuments(1, true)
        return
      }

      // Parse search input as JSON query
      const parsedQuery = JSON.parse(input)
      setSearchQuery(parsedQuery)
      setIsSearchMode(true)
      setIsAggregationView(false) // Clear aggregation view when searching
      setPage(1)
      setDocuments([])
      fetchDocumentsByQuery(parsedQuery, 1, true)
    } catch (error) {
      // If JSON parsing fails, treat as regular text and search in all fields
      console.warn('Invalid JSON query, treating as text search:', error)
      // You could implement a text search fallback here if needed
    }
  }

  // Perform document ID search
  const performDocumentIdSearch = (documentId) => {
    if (!documentId.trim()) {
      // If document ID is empty and no regular search, switch to regular mode
      if (!searchInput.trim()) {
        setIsSearchMode(false)
        setSearchQuery('')
        setIsAggregationView(false)
        setPage(1)
        setDocuments([])
        fetchDocuments(1, true)
      }
      return
    }

    // Create query for document ID search
    const documentIdQuery = { documentId: documentId.trim() }
    setSearchQuery(documentIdQuery)
    setIsSearchMode(true)
    setIsAggregationView(false)
    setPage(1)
    setDocuments([])
    fetchDocumentsByQuery(documentIdQuery, 1, true)
  }

  // Clear all search inputs and return to regular view
  const clearAllSearch = () => {
    setSearchInput('')
    setDocumentIdInput('')
    setSearchQuery('')
    setIsSearchMode(false)
    setIsAggregationView(false)
    setPage(1)
    setDocuments([])
    fetchDocuments(1, true)
  }

  // Format date for better readability
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Format aggregation pipeline for display
  const formatPipelineForDisplay = (pipeline) => {
    try {
      if (!Array.isArray(pipeline) || pipeline.length === 0) {
        return 'No conditions'
      }

      // Extract the most important parts of the pipeline for display
      const displayParts = pipeline
        .map((stage, index) => {
          const stageKey = Object.keys(stage)[0]
          return `${stageKey.replace('$', '')}: ${JSON.stringify(stage[stageKey]).substring(0, 30)}${JSON.stringify(stage[stageKey]).length > 30 ? '...' : ''}`
        })
        .join(', ')

      return displayParts
    } catch (error) {
      return 'Invalid pipeline'
    }
  }

  return (
    <div className='container mx-auto px-4 py-6 max-w-7xl'>
      <div className='bg-white rounded-lg shadow-lg overflow-hidden mb-8'>
        <div className='flex justify-between items-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200'>
          <div>
            <div className='flex items-center mb-2'>
              <button
                onClick={handleBackToCollections}
                className='text-blue-600 hover:text-blue-800 flex items-center transition-colors font-medium'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5 mr-1'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z'
                    clipRule='evenodd'
                  />
                </svg>
                Back to Collections
              </button>
            </div>
            <h1 className='text-2xl font-bold text-gray-900'>Documents</h1>
            <div className='flex items-center mt-1 text-gray-600'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5 mr-2 text-indigo-500'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path d='M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 002-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z' />
              </svg>
              <span className='font-medium'>{collectionName}</span>
              <span className='mx-2'>in</span>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5 mr-2 text-indigo-500'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path d='M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' />
              </svg>
              <span className='font-medium'>{databaseName}</span>
            </div>
          </div>
          <div className='flex space-x-3'>
            <button
              onClick={() => setShowAggregateModal(true)}
              className='bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-5 rounded-lg flex items-center transition-colors shadow-md'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5 mr-2'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z'
                  clipRule='evenodd'
                />
              </svg>
              Run Aggregate
            </button>
            <button
              onClick={() => setShowInsertModal(true)}
              className='bg-green-600 hover:bg-green-700 text-white py-2 px-5 rounded-lg flex items-center transition-colors shadow-md'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5 mr-2'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z'
                  clipRule='evenodd'
                />
              </svg>
              Insert Document
            </button>
          </div>
        </div>

        {/* Advanced Search Bar */}
        <div className='px-6 py-4 border-b border-gray-200 bg-gray-50'>
          <div className='max-w-6xl'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
              {/* JSON Query Search */}
              <div className='lg:col-span-2'>
                <label
                  htmlFor='search-query'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  <span className='flex items-center'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-4 w-4 mr-1 text-gray-500'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                      />
                    </svg>
                    JSON Query Search
                  </span>
                </label>
                <input
                  type='text'
                  id='search-query'
                  value={searchInput}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  placeholder='e.g., {"name": "John"}, {"age": {"$gte": 18}}, or {} for all'
                  className='w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono transition-colors'
                />
                <div className='mt-1 text-xs text-gray-500'>
                  Auto-searches as you type • MongoDB-style syntax • Leave empty
                  to show all
                </div>
              </div>

              {/* Document ID Search */}
              <div>
                <label
                  htmlFor='document-id-search'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  <span className='flex items-center'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-4 w-4 mr-1 text-gray-500'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M7 20l4-16m2 16l4-16M6 9h14M4 15h14'
                      />
                    </svg>
                    Document ID
                  </span>
                </label>
                <input
                  type='text'
                  id='document-id-search'
                  value={documentIdInput}
                  onChange={(e) => handleDocumentIdInputChange(e.target.value)}
                  placeholder='Enter document ID'
                  className='w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-mono transition-colors'
                />
                <div className='mt-1 text-xs text-gray-500'>
                  Find by specific ID
                </div>
              </div>
            </div>

            {/* Active Search Indicator */}
            {isSearchMode && (
              <div className='mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md'>
                <div className='flex items-center justify-between'>
                  <div className='text-sm text-blue-800'>
                    <span className='font-medium'>Active Search:</span>{' '}
                    <code className='bg-blue-100 px-2 py-1 rounded text-xs ml-1'>
                      {JSON.stringify(searchQuery)}
                    </code>
                  </div>
                  <button
                    onClick={clearAllSearch}
                    className='text-blue-600 hover:text-blue-800 text-sm flex items-center transition-colors'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-4 w-4 mr-1'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M6 18L18 6M6 6l12 12'
                      />
                    </svg>
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Aggregation Banner - Show when in aggregation view */}
        {isAggregationView && (
          <div className='bg-indigo-50 px-6 py-3 border-b border-indigo-100 flex justify-between items-center'>
            <div className='flex items-center'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5 text-indigo-600 mr-2'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 9l-7 7-7-7'
                />
              </svg>
              <div>
                <span className='text-sm font-medium text-indigo-800'>
                  Aggregation Results
                </span>
                <p className='text-xs text-indigo-600 mt-0.5'>
                  Pipeline: {formatPipelineForDisplay(aggregationPipeline)}
                </p>
              </div>
            </div>
            <button
              onClick={clearAggregation}
              className='text-indigo-700 hover:text-indigo-900 text-sm font-medium flex items-center'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-4 w-4 mr-1'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
              Clear Aggregation
            </button>
          </div>
        )}

        {/* Card-based document view */}
        <div className='p-6'>
          {/* When loading and no documents */}
          {loading && documents.length === 0 && !isAggregationView ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className='animate-pulse bg-white rounded-lg border border-gray-200 shadow-sm p-4'
                >
                  <div className='h-4 bg-gray-200 rounded w-3/4 mb-3' />
                  <div className='h-3 bg-gray-100 rounded w-1/2 mb-2' />
                  <div className='h-20 bg-gray-100 rounded mb-3' />
                  <div className='flex justify-end'>
                    <div className='h-8 bg-gray-200 rounded w-16 mr-2' />
                    <div className='h-8 bg-gray-200 rounded w-16' />
                  </div>
                </div>
              ))}
            </div>
          ) : isAggregationView ? (
            // Aggregation Results View
            aggregationResults.length > 0 ? (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {aggregationResults.map((doc, index) => (
                  <div
                    key={index}
                    className='bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden'
                  >
                    <div className='p-4'>
                      <div className='flex items-center justify-between mb-3'>
                        <div className='flex items-center'>
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='h-5 w-5 text-indigo-500 mr-2'
                            viewBox='0 0 20 20'
                            fill='currentColor'
                          >
                            <path
                              fillRule='evenodd'
                              d='M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z'
                              clipRule='evenodd'
                            />
                          </svg>
                          <div className='font-mono text-indigo-700 font-semibold'>
                            <span className='text-sm'>
                              {doc.documentId
                                ? `ID: ${doc.documentId}`
                                : `Result #${index + 1}`}
                            </span>
                          </div>
                        </div>
                        {doc.updatedAt && (
                          <span
                            className='text-xs text-gray-500'
                            title={doc.updatedAt}
                          >
                            {formatDate(doc.updatedAt)}
                          </span>
                        )}
                      </div>

                      <div className='bg-gray-50 rounded p-3 mb-3 h-48 overflow-y-auto'>
                        <pre className='text-xs font-mono whitespace-pre-wrap break-words text-gray-800'>
                          {JSON.stringify(
                            Object.fromEntries(
                              Object.entries(doc).filter(
                                ([key]) =>
                                  !['documentId', 'updatedAt'].includes(key)
                              )
                            ),
                            null,
                            2
                          )}
                        </pre>
                      </div>

                      {/* Add Update and Delete buttons if documentId exists */}
                      {doc.documentId && (
                        <div className='flex justify-end space-x-2'>
                          <button
                            onClick={() => handleUpdateClick(doc)}
                            className='text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md text-sm transition-colors'
                          >
                            Update
                          </button>
                          <button
                            onClick={() => handleDeleteClick(doc)}
                            className='text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm transition-colors'
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-12'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-16 w-16 text-gray-300 mx-auto mb-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
                <p className='text-gray-500 mb-2'>
                  No documents match your aggregation pipeline
                </p>
                <button
                  onClick={clearAggregation}
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                >
                  Clear Aggregation
                </button>
              </div>
            )
          ) // Normal Document View
            : documents.length > 0
              ? (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {documents.map((doc, index) => (
                    <div
                      key={doc.documentId}
                      ref={
                    !isAggregationView && index === documents.length - 1
                      ? lastDocumentElementRef
                      : null
                  }
                      className='bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden'
                    >
                      <div className='p-4'>
                        <div className='flex items-center justify-between mb-3'>
                          <div className='flex items-center'>
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              className='h-5 w-5 text-yellow-500 mr-2'
                              viewBox='0 0 20 20'
                              fill='currentColor'
                            >
                              <path
                  fillRule='evenodd'
                  d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
                  clipRule='evenodd'
                />
                            </svg>
                            <div
                              className='font-mono text-indigo-700 font-semibold'
                              title={doc.documentId}
                            >
                              <span className='text-sm'>ID: {doc.documentId}</span>
                            </div>
                          </div>
                          <span
                            className='text-xs text-gray-500'
                            title={doc.updatedAt}
                          >
                            {formatDate(doc.updatedAt)}
                          </span>
                        </div>

                        <div className='bg-gray-50 rounded p-3 mb-3 h-48 overflow-y-auto'>
                          <pre className='text-xs font-mono whitespace-pre-wrap break-words text-gray-800'>
                            {JSON.stringify(
                              Object.fromEntries(
                                Object.entries(doc).filter(
                                  ([key]) =>
                                    !['documentId', 'updatedAt'].includes(key)
                                )
                              ),
                              null,
                              2
                            )}
                          </pre>
                        </div>

                        <div className='flex justify-end space-x-2'>
                          <button
                            onClick={() => handleUpdateClick(doc)}
                            className='text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md text-sm transition-colors'
                          >
                            Update
                          </button>
                          <button
                            onClick={() => handleDeleteClick(doc)}
                            className='text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm transition-colors'
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )
              : (
                <div className='text-center py-12'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-16 w-16 text-gray-300 mx-auto mb-4'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                  <p className='text-gray-500 mb-4'>
                    {isSearchMode
                      ? 'No documents match your search query'
                      : 'No documents found in this collection'}
                  </p>
                  {isSearchMode
                    ? (
                      <div className='space-y-2'>
                        <button
                          onClick={clearAllSearch}
                          className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        >
                          Clear Search & Show All Documents
                        </button>
                        <p className='text-xs text-gray-400'>
                          Try adjusting your query or use {} to show all documents
                        </p>
                      </div>
                      )
                    : (
                      <button
                        onClick={() => setShowInsertModal(true)}
                        className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                      >
                        Insert Your First Document
                      </button>
                      )}
                </div>
                )}

          {/* Loading state for infinite scroll - only show when not in aggregation view */}
          {loading && documents.length > 0 && !isAggregationView && (
            <div className='flex justify-center items-center py-4'>
              <svg
                className='animate-spin h-6 w-6 text-indigo-500'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                />
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                />
              </svg>
            </div>
          )}

          {/* End of results message - only show when not in aggregation view */}
          {!loading &&
            !hasMore &&
            documents.length > 0 &&
            !isAggregationView && (
              <div className='text-center py-4 text-gray-500 text-sm border-t border-gray-100 mt-6'>
                You've reached the end of the results.
              </div>
          )}

          {/* Show count of aggregation results when in aggregation view */}
          {isAggregationView && aggregationResults.length > 0 && (
            <div className='text-center py-4 text-gray-500 text-sm border-t border-gray-100 mt-6'>
              Showing all {aggregationResults.length} aggregation results.
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

      {/* Aggregate Modal - Updated to pass results back to parent */}
      {showAggregateModal && (
        <AggregateModal
          isOpen={showAggregateModal}
          onClose={() => setShowAggregateModal(false)}
          databaseName={databaseName}
          collectionName={collectionName}
          onAggregationResults={handleAggregationResults}
        />
      )}
    </div>
  )
}

export default Documents
