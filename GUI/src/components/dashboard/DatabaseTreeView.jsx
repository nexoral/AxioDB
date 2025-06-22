import { DatabaseIcon, FolderIcon } from "@heroicons/react/outline";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/solid";
import { useEffect, useState } from "react";

/**
 * Component to display a tree view of databases and collections
 */
const DatabaseTreeView = () => {
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [databaseTree, setDatabaseTree] = useState([]);

  // Toggle expansion of a tree node
  const toggleExpand = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    // Simulate API call with dummy data
    const fetchData = () => {
      setTimeout(() => {
        // Create dummy data structure for database tree
        const dummyData = [
          {
            id: "db1",
            name: "UsersDB",
            type: "database",
            children: [
              {
                id: "db1_col1",
                name: "accounts",
                type: "collection",
                documentCount: 1250,
                size: "2.3 MB",
              },
              {
                id: "db1_col2",
                name: "profiles",
                type: "collection",
                documentCount: 1200,
                size: "4.1 MB",
              },
              {
                id: "db1_col3",
                name: "sessions",
                type: "collection",
                documentCount: 5400,
                size: "1.8 MB",
              },
            ],
          },
          {
            id: "db2",
            name: "ProductsDB",
            type: "database",
            children: [
              {
                id: "db2_col1",
                name: "inventory",
                type: "collection",
                documentCount: 850,
                size: "3.2 MB",
              },
              {
                id: "db2_col2",
                name: "categories",
                type: "collection",
                documentCount: 45,
                size: "0.3 MB",
              },
              {
                id: "db2_col3",
                name: "suppliers",
                type: "collection",
                documentCount: 120,
                size: "0.7 MB",
              },
            ],
          },
          {
            id: "db3",
            name: "AnalyticsDB",
            type: "database",
            children: [
              {
                id: "db3_col1",
                name: "events",
                type: "collection",
                documentCount: 4250,
                size: "8.5 MB",
              },
              {
                id: "db3_col2",
                name: "metrics",
                type: "collection",
                documentCount: 1850,
                size: "4.2 MB",
              },
              {
                id: "db3_col3",
                name: "reports",
                type: "collection",
                documentCount: 320,
                size: "1.5 MB",
              },
            ],
          },
        ];

        // Expand the first database by default
        setExpanded({ db1: true });
        setDatabaseTree(dummyData);
        setLoading(false);
      }, 1000);
    };

    fetchData();
  }, []);

  // Render a tree node (database or collection)
  const renderTreeNode = (node) => {
    const isExpanded = expanded[node.id];

    return (
      <div key={node.id}>
        <div
          className={`flex items-center py-2 px-3 ${
            node.type === "database"
              ? "bg-blue-50 hover:bg-blue-100 border-b border-blue-100"
              : "hover:bg-gray-50 pl-10"
          } cursor-pointer transition-colors`}
          onClick={() => node.children && toggleExpand(node.id)}
        >
          {node.children ? (
            <div className="mr-1">
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-500" />
              )}
            </div>
          ) : (
            <div className="w-4 mr-1" />
          )}

          {node.type === "database" ? (
            <DatabaseIcon className="h-5 w-5 text-blue-600 mr-2" />
          ) : (
            <FolderIcon className="h-5 w-5 text-yellow-600 mr-2" />
          )}

          <div className="flex-grow">
            <span className="font-medium">{node.name}</span>
          </div>

          {node.type === "collection" && (
            <div className="text-xs text-gray-500">
              <span className="mr-2">{node.documentCount} docs</span>
              <span>{node.size}</span>
            </div>
          )}
        </div>

        {node.children && isExpanded && (
          <div className="border-l border-gray-200 ml-5">
            {node.children.map(renderTreeNode)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="border-b border-gray-200 py-4 px-6">
        <h3 className="text-lg font-medium text-gray-900">
          Database Structure
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Overview of databases and collections
        </p>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="pl-6 space-y-2">
                  <div className="h-5 bg-gray-100 rounded w-2/3" />
                  <div className="h-5 bg-gray-100 rounded w-2/3" />
                  <div className="h-5 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>{databaseTree.map(renderTreeNode)}</div>
        )}
      </div>
    </div>
  );
};

export default DatabaseTreeView;
