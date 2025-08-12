import { DatabaseIcon, FolderIcon } from '@heroicons/react/outline'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/solid'
import { useEffect, useState } from 'react'

/**
 * Component to display a tree view of databases and collections
 */
const DatabaseTreeView = ({ treeDB }) => {
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [databaseTree, setDatabaseTree] = useState([])

  // Toggle expansion of a tree node
  const toggleExpand = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  useEffect(() => {
    const processTreeData = () => {
      if (!treeDB || !Array.isArray(treeDB)) {
        setDatabaseTree([])
        setLoading(false)
        return
      }

      // Transform treeDB into the expected format
      const formattedData = treeDB.map((db, dbIndex) => {
        const dbId = `db${dbIndex + 1}`
        return {
          id: dbId,
          name: db.name,
          type: 'database',
          children: Array.isArray(db.collections)
            ? db.collections.map((collection, colIndex) => ({
              id: `${dbId}_col${colIndex + 1}`,
              name: collection.name || collection, // Handle both new (object) and old (string) formats
              type: 'collection',
              documentCount: collection.documentCount || 0,
              size: '0 MB'
            }))
            : []
        }
      })

      // Expand the first database by default if it exists
      if (formattedData.length > 0) {
        setExpanded({ [formattedData[0].id]: true })
      }

      setDatabaseTree(formattedData)
      setLoading(false)
    }

    // Short timeout to simulate loading (can be removed if not needed)
    setTimeout(() => {
      processTreeData()
    }, 500)
  }, [treeDB])

  // Render a tree node (database or collection)
  const renderTreeNode = (node) => {
    const isExpanded = expanded[node.id]

    return (
      <div key={node.id}>
        <div
          className={`flex items-center py-2 px-3 ${
            node.type === 'database'
              ? 'bg-blue-50 hover:bg-blue-100 border-b border-blue-100'
              : 'hover:bg-gray-50 pl-10'
          } cursor-pointer transition-colors`}
          onClick={() => node.children && toggleExpand(node.id)}
        >
          {node.children
            ? (
              <div className='mr-1'>
                {isExpanded
                  ? (
                    <ChevronDownIcon className='h-4 w-4 text-gray-500' />
                    )
                  : (
                    <ChevronRightIcon className='h-4 w-4 text-gray-500' />
                    )}
              </div>
              )
            : (
              <div className='w-4 mr-1' />
              )}

          {node.type === 'database'
            ? (
              <DatabaseIcon className='h-5 w-5 text-blue-600 mr-2' />
              )
            : (
              <FolderIcon className='h-5 w-5 text-yellow-600 mr-2' />
              )}

          <div className='flex-grow'>
            <span className='font-medium'>{node.name}</span>
          </div>

          {node.type === 'collection' && (
            <div className='text-xs text-gray-500'>
              <span className='mr-2'>{node.documentCount} docs</span>
            </div>
          )}
        </div>

        {node.children && isExpanded && (
          <div className='border-l border-gray-200 ml-5'>
            {node.children.map(renderTreeNode)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow'>
      <div className='border-b border-gray-200 py-4 px-6'>
        <h3 className='text-lg font-medium text-gray-900'>
          Database Structure
        </h3>
        <p className='text-sm text-gray-500 mt-1'>
          Overview of databases and collections
        </p>
      </div>

      <div className='overflow-y-auto' style={{ maxHeight: '400px' }}>
        {loading
          ? (
            <div className='p-6 space-y-3'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='animate-pulse'>
                  <div className='h-6 bg-gray-200 rounded w-3/4 mb-2' />
                  <div className='pl-6 space-y-2'>
                    <div className='h-5 bg-gray-100 rounded w-2/3' />
                    <div className='h-5 bg-gray-100 rounded w-2/3' />
                    <div className='h-5 bg-gray-100 rounded w-2/3' />
                  </div>
                </div>
              ))}
            </div>
            )
          : (
            <div>{databaseTree.map(renderTreeNode)}</div>
            )}
      </div>
    </div>
  )
}

export default DatabaseTreeView
