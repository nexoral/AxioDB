import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CreateCollectionModal from "../components/collection/CreateCollectionModal";
import DeleteCollectionModal from "../components/collection/DeleteCollectionModal";
import { BASE_API_URL } from "../config/key";
import { DBInfoStore, ExchangeKeyStore } from "../store/store";

const Collections = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState("");
  const databaseName = searchParams.get("database");
  const { TransactionKey } = ExchangeKeyStore((state) => state);
  const { Rootname } = DBInfoStore((state) => state);

  useEffect(() => {
    // If no database is specified, redirect to databases page
    if (!databaseName) {
      navigate("/databases");
      return;
    }

    // Fetch collections for the specified database
    const fetchCollections = async () => {
      try {
        const response = await axios.get(
          `${BASE_API_URL}/api/collection/all/?databaseName=${databaseName}&transactiontoken=${TransactionKey}`
        );
        if (response.status === 200) {
          const collectionData = response.data.data || {};

          // Transform the collection data to match our component's expected format
          if (collectionData.ListOfCollections && Array.isArray(collectionData.ListOfCollections)) {
            const collectionSizeMap = collectionData.CollectionSizeMap || [];

            const formattedCollections = collectionData.ListOfCollections.map(collectionName => {
              // Find the corresponding size info in CollectionSizeMap
              const sizeInfo = collectionSizeMap.find(item => {
                const pathParts = item.folderPath.split('/');
                const folderName = pathParts[pathParts.length - 1];
                return folderName === collectionName;
              });

              return {
                name: collectionName,
                documentCount: sizeInfo ? sizeInfo.fileCount : 0,
              };
            });

            setCollections(formattedCollections);
          } else {
            setCollections([]);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching collections:", error);
        setLoading(false);
        setCollections([]);
      }
    };

    if (TransactionKey) {
      fetchCollections();
    }
  }, [TransactionKey, databaseName, navigate]);

  const handleBackToDatabases = () => {
    navigate("/databases");
  };

  const handleCreateCollection = (newCollection) => {
    // Update the UI with the new collection
    setCollections((prevCollections) => [...prevCollections, newCollection]);
  };

  const handleDeleteClick = (collectionName) => {
    setCollectionToDelete(collectionName);
    setShowDeleteModal(true);
  };

  const handleCollectionDeleted = (collectionName) => {
    // Update the UI by removing the deleted collection
    setCollections((prevCollections) =>
      prevCollections.filter(collection => collection.name !== collectionName)
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center mb-2">
            <button
              onClick={handleBackToDatabases}
              className="text-blue-600 hover:text-blue-800 mr-3"
            >
              ← Back to Databases
            </button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
          <p className="text-gray-600">
            Collections in database:{" "}
            <span className="font-medium">{databaseName}</span>
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center transition-colors">
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
          Create Collection
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            Collections in {databaseName}
          </h3>
          <p className="text-sm text-gray-500">
            Total:{" "}
            {loading
              ? "Loading..."
              : collections.length > 0
                ? `${collections.length} Collections`
                : "0 Collections"}
          </p>
        </div>

        {loading ? (
          <div className="p-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse flex items-center justify-between py-4 border-b border-gray-100"
              >
                <div>
                  <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-32" />
                </div>
                <div className="h-8 bg-gray-200 rounded w-24" />
              </div>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {collections.length > 0 ? (
              collections.map((collection) => (
                <li
                  key={collection.name}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {collection.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {collection.documentCount} documents
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-200 hover:border-blue-400 transition-colors">
                      View Documents
                    </button>
                    <button
                      onClick={() => handleDeleteClick(collection.name)}
                      className="text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-200 hover:border-red-400 transition-colors">
                      Delete
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-6 py-8 text-center text-gray-500">
                No collections found in this database. Click "Create Collection"
                to add one.
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Create Collection Modal */}
      <CreateCollectionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCollectionCreated={handleCreateCollection}
        databaseName={databaseName}
      />

      {/* Delete Collection Modal */}
      <DeleteCollectionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onCollectionDeleted={handleCollectionDeleted}
        databaseName={databaseName}
        collectionName={collectionToDelete}
      />
    </div>
  );
};

export default Collections;
