import { ServerIcon } from "@heroicons/react/outline";
import { useEffect, useState } from "react";

/**
 * Component to display the total storage used in the AxioDB system
 */
const StorageUsageCard = ({ storageInfo }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with dummy data
    const fetchData = () => {
      setTimeout(() => {
        setLoading(false);
      }, 800);
    };

    fetchData();
  }, []);

  // Calculate percentage of storage used
  const usagePercentage = (storageInfo?.total / storageInfo?.machine) * 100;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between mb-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Storage Used</h3>
          {loading ? (
            <div className="h-8 mt-2 bg-gray-200 rounded animate-pulse w-24" />
          ) : (
            <p className="text-3xl font-bold text-green-600 mt-2">
                {storageInfo?.total} <span className="text-lg">{storageInfo?.matrixUnit}</span>
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            of {storageInfo?.machine} {storageInfo?.matrixUnit} available
          </p>
        </div>
        <div className="p-3 bg-green-100 rounded-full">
          <ServerIcon className="h-8 w-8 text-green-600" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
        <div
          className="bg-green-600 h-2.5 rounded-full"
          style={{ width: `${loading ? 0 : usagePercentage}%` }}
        />
      </div>
    </div>
  );
};

export default StorageUsageCard;
