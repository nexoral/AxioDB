import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_API_URL } from "../config/key";
import { ExchangeKeyStore, DBInfoStore } from "../store/store";

// Import our components
import CreateDatabaseModal from "../components/database/CreateDatabaseModal";
import DeleteDatabaseModal from "../components/database/DeleteDatabaseModal";
import DatabaseList from "../components/database/DatabaseList";

const Databases = () => {
  const [loading, setLoading] = useState(true);
  const [databases, setDatabases] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dbToDelete, setDbToDelete] = useState("");
  const { TransactionKey } = ExchangeKeyStore((state) => state);
  const { Rootname } = DBInfoStore((state) => state);

  useEffect(() => {
    // Fetch data from the real API
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${BASE_API_URL}/api/db/databases?transactiontoken=${TransactionKey}`,
        );
        if (response.status === 200) {
          setDatabases(response.data.data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching databases:", error);
        setLoading(false);
        setDatabases([]);
      }
    };

    if (TransactionKey) {
      fetchData();
    }
  }, [TransactionKey]);

  const handleDeleteClick = (dbName) => {
    setDbToDelete(dbName);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setDatabases((prevState) => ({
      ...prevState,
      ListOfDatabases: prevState.ListOfDatabases.filter(
        (db) => db !== dbToDelete,
      ),
      TotalDatabases: `${prevState.ListOfDatabases.length - 1} Databases`,
    }));

    setShowDeleteModal(false);
    setDbToDelete("");
  };

  const handleCreateDatabase = (newDbName) => {
    // Update the UI with the new database
    setDatabases((prevState) => ({
      ...prevState,
      ListOfDatabases: [...prevState.ListOfDatabases, newDbName],
      TotalDatabases: `${prevState.ListOfDatabases.length + 1} Databases`,
      AllDatabasesPaths: [
        ...prevState.AllDatabasesPaths,
        `${prevState.CurrentPath}/${newDbName}`,
      ],
    }));
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Databases</h1>
          <p className="text-gray-600">Manage your {Rootname} databases</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center transition-colors"
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
          Create Database
        </button>
      </div>

      {/* Database List Component */}
      <DatabaseList
        databases={databases}
        onDeleteClick={handleDeleteClick}
        loading={loading}
      />

      {/* Create Database Modal */}
      <CreateDatabaseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onDatabaseCreated={handleCreateDatabase}
      />

      {/* Delete Confirmation Modal */}
      <DeleteDatabaseModal
        isOpen={showDeleteModal}
        dbName={dbToDelete}
        onClose={() => setShowDeleteModal(false)}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
};

export default Databases;
