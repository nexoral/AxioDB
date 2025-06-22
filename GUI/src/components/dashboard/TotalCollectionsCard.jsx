import { CollectionIcon } from "@heroicons/react/outline";
import { useEffect, useState } from "react";

/**
 * Component to display the total number of collections in the AxioDB system
 */
const TotalCollectionsCard = () => {
  // In a real application, this would come from an API
  const [totalCollections, setTotalCollections] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with dummy data
    const fetchData = () => {
      setTimeout(() => {
        setTotalCollections(67);
        setLoading(false);
      }, 600);
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Total Collections
          </h3>
          {loading ? (
            <div className="h-8 mt-2 bg-gray-200 rounded animate-pulse w-16" />
          ) : (
            <p className="text-3xl font-bold text-indigo-600 mt-2">
              {totalCollections}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">Across all databases</p>
        </div>
        <div className="p-3 bg-indigo-100 rounded-full">
          <CollectionIcon className="h-8 w-8 text-indigo-600" />
        </div>
      </div>
    </div>
  );
};

export default TotalCollectionsCard;
