import { useState } from 'react';

const DatabaseList = ({ databases, onDeleteClick, loading }) => {
  // State for animation when items are added or removed
  const [animatingItems, setAnimatingItems] = useState({});

  // This would be used if we wanted entrance animations for newly added databases
  const handleItemAnimationEnd = (dbName) => {
    setAnimatingItems(prev => ({
      ...prev,
      [dbName]: false
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <h3 className="text-lg font-medium text-gray-900">Your Databases</h3>
        <p className="text-sm text-gray-500">
          Total: {loading ? "Loading..." : databases.TotalDatabases}
        </p>
      </div>

      {loading ? (
        // Loading animation for database list
        <div className="p-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center justify-between py-4 border-b border-gray-100">
              <div>
                <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-32"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {databases.ListOfDatabases && databases.ListOfDatabases.length > 0 ? (
            databases.ListOfDatabases.map((dbName, index) => (
              <li
                key={dbName}
                className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all duration-300 ${animatingItems[dbName] ? 'animate-slideIn' : 'animate-fadeIn'
                  }`}
                onAnimationEnd={() => handleItemAnimationEnd(dbName)}
              >
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{dbName}</h4>
                  <p className="text-sm text-gray-500">Path: {databases.AllDatabasesPaths[index]}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-200 hover:border-blue-400 transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onDeleteClick(dbName)}
                    className="text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-200 hover:border-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li className="px-6 py-8 text-center text-gray-500">
              No databases found. Click "Create Database" to add one.
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default DatabaseList;
