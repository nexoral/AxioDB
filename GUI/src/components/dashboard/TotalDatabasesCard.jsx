import { DatabaseIcon } from "@heroicons/react/outline";
import { useEffect, useState } from "react";

/**
 * Component to display the total number of databases in the AxioDB system
 */
const TotalDatabasesCard = () => {
  // In a real application, this would come from an API
  const [totalDatabases, setTotalDatabases] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with dummy data
    const fetchData = () => {
      setTimeout(() => {
        setTotalDatabases(12);
        setLoading(false);
      }, 500);
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Total Databases</h3>
          {loading ? (
            <div className="h-8 mt-2 bg-gray-200 rounded animate-pulse w-16" />
          ) : (
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {totalDatabases}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">Across all instances</p>
        </div>
        <div className="p-3 bg-blue-100 rounded-full">
          <DatabaseIcon className="h-8 w-8 text-blue-600" />
        </div>
      </div>
    </div>
  );
};

export default TotalDatabasesCard;
