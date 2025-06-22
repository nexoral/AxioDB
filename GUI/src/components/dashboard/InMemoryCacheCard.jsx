import { ChipIcon } from "@heroicons/react/outline";
import { useEffect, useState } from "react";

/**
 * Component to display the total in-memory cache size in the AxioDB system
 */
const InMemoryCacheCard = () => {
  // In a real application, this would come from an API
  const [cacheSize, setCacheSize] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with dummy data
    const fetchData = () => {
      setTimeout(() => {
        setCacheSize(512); // MB
        setTotalSize(1024); // MB
        setLoading(false);
      }, 800);
    };

    fetchData();
  }, []);

  // Calculate percentage of cache used
  const usagePercentage = (cacheSize / totalSize) * 100;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between mb-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900">In-Memory Cache</h3>
          {loading ? (
            <div className="h-8 mt-2 bg-gray-200 rounded animate-pulse w-24" />
          ) : (
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {cacheSize} <span className="text-lg">MB</span>
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            of {totalSize} MB allocated
          </p>
        </div>
        <div className="p-3 bg-orange-100 rounded-full">
          <ChipIcon className="h-8 w-8 text-orange-600" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
        <div
          className="bg-orange-600 h-2.5 rounded-full"
          style={{ width: `${loading ? 0 : usagePercentage}%` }}
        />
      </div>
    </div>
  );
};

export default InMemoryCacheCard;
