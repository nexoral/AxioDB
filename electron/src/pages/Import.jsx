import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../api/client";
import authApi from "../api/authApi";
import { useConnectionStore } from "../store/connectionStore";
import { useDbStore } from "../store/dbStore";
import { formatBytes } from "../utils/format";

const Import = () => {
  const [selectedFile, setSelectedFile] = useState(null); // { name, size, filePath?, rawFile? }
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error' | null
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Export state
  const [exportingDb, setExportingDb] = useState(null);
  const [exportStatus, setExportStatus] = useState(null); // 'success' | 'error' | null
  const [exportError, setExportError] = useState("");
  const [exportSuccess, setExportSuccess] = useState("");

  const getBaseUrl = useConnectionStore((state) => state.getBaseUrl);
  const fetchDatabases = useDbStore((state) => state.fetchDatabases);
  const databases = useDbStore((state) => state.databases);
  const loadingDatabases = useDbStore((state) => state.loadingTree);

  const validateFile = (name) => {
    const allowed = [".zip", ".tar", ".tar.gz", ".tgz"];
    const lower = name.toLowerCase();
    const isValid = allowed.some((ext) => lower.endsWith(ext));
    if (!isValid) {
      setErrorMessage("Please select a valid database backup archive (.zip, .tar, .tar.gz, .tgz)");
      setUploadStatus("error");
      return false;
    }
    return true;
  };

  const handleNativeSelect = async () => {
    try {
      if (window.electronAPI?.selectImportFile) {
        const result = await window.electronAPI.selectImportFile();
        if (result) {
          setSelectedFile({
            name: result.name,
            size: result.size,
            filePath: result.filePath,
          });
          setUploadStatus(null);
          setErrorMessage("");
        }
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to open file picker");
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (validateFile(dropped.name)) {
        // In electron, dropped.path might be populated or webUtils
        const filePath = dropped.path || null;
        setSelectedFile({
          name: dropped.name,
          size: dropped.size,
          filePath,
          rawFile: dropped,
        });
        setUploadStatus(null);
        setErrorMessage("");
      }
    }
  }, []);

  const handleInputSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file.name)) {
      setSelectedFile({
        name: file.name,
        size: file.size,
        filePath: file.path || null,
        rawFile: file,
      });
      setUploadStatus(null);
      setErrorMessage("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select a database backup archive to import");
      setUploadStatus("error");
      return;
    }

    setUploading(true);
    setUploadStatus(null);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const baseUrl = getBaseUrl();
      const targetUrl = `${baseUrl.replace(/\/+$/, "")}/api/db/import-database/`;

      if (selectedFile.filePath && window.electronAPI?.uploadDatabase) {
        // Native streaming upload through Electron main process
        const res = await window.electronAPI.uploadDatabase(selectedFile.filePath, targetUrl);
        const msg = res.data?.message || "Database imported and initialized successfully!";
        setSuccessMessage(msg);
      } else if (selectedFile.rawFile) {
        // Browser / Web fallback with multipart FormData
        const formData = new FormData();
        formData.append("file", selectedFile.rawFile);
        const res = await apiClient.post("/api/db/import-database/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const msg = res.data?.message || "Database imported and initialized successfully!";
        setSuccessMessage(msg);
      } else {
        throw new Error("No file path or file payload available for upload");
      }

      setUploadStatus("success");
      setSelectedFile(null);
      // Immediately refresh the database tree in the explorer sidebar
      fetchDatabases();
    } catch (err) {
      setUploadStatus("error");
      setErrorMessage(
        err.response?.data?.message || err.message || "Failed to import database archive."
      );
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadStatus(null);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleExportDatabase = async (dbName) => {
    setExportingDb(dbName);
    setExportStatus(null);
    setExportError("");
    setExportSuccess("");

    try {
      const result = await authApi.exportDatabase(dbName);

      if (result.canceled) {
        return;
      }

      setExportStatus("success");
      setExportSuccess(`${dbName}.tar.gz exported successfully`);
    } catch (err) {
      setExportStatus("error");
      setExportError(
        err.message || "Failed to export database. Please try again."
      );
    } finally {
      setExportingDb(null);
    }
  };

  useEffect(() => {
    if (!databases.length && !loadingDatabases) {
      fetchDatabases();
    }
  }, [databases, loadingDatabases, fetchDatabases]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-3xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Import Database Archive</h1>
              <p className="text-xs text-slate-500 mt-1">
                Restore or clone an AxioDB database from a previously exported <span className="font-mono text-slate-700">.tar.gz</span> or <span className="font-mono text-slate-700">.zip</span> backup archive.
              </p>
            </div>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all bg-white shadow-sm ${
            dragActive
              ? "border-emerald-500 bg-emerald-50/40 ring-4 ring-emerald-500/10"
              : selectedFile
              ? "border-emerald-400 bg-emerald-50/20"
              : "border-slate-300 hover:border-slate-400"
          }`}
        >
          <input
            type="file"
            id="archive-input"
            className="hidden"
            accept=".zip,.tar,.tar.gz,.tgz"
            onChange={handleInputSelect}
            disabled={uploading}
          />

          <AnimatePresence mode="wait">
            {!selectedFile ? (
              <motion.div
                key="prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-4 space-y-4"
              >
                <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Drag and drop your database archive here
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports <span className="font-mono">.tar.gz</span>, <span className="font-mono">.tgz</span>, <span className="font-mono">.tar</span>, <span className="font-mono">.zip</span>
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleNativeSelect}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                    Browse Local File
                  </button>
                  <label
                    htmlFor="archive-input"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    Standard Picker
                  </label>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="selected"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-xs"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500 font-mono">
                      {formatBytes(selectedFile.size)}
                      {selectedFile.filePath && (
                        <span className="text-slate-400 ml-2">({selectedFile.filePath})</span>
                      )}
                    </p>
                  </div>
                </div>

                {!uploading && (
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {uploadStatus === "success" && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3"
            >
              <svg className="w-5 h-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-semibold text-emerald-900">Import Successful</p>
                <p className="text-emerald-700 mt-0.5">{successMessage}</p>
              </div>
            </motion.div>
          )}

          {uploadStatus === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-3"
            >
              <svg className="w-5 h-5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold text-red-900">Import Failed</p>
                <p className="text-red-700 mt-0.5">{errorMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Button */}
        <div>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Streaming Archive to AxioDB Server...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import Archive
              </>
            )}
          </button>
         </div>

        {/* Export Status */}
        <AnimatePresence>
          {exportStatus === "success" && exportSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3"
            >
              <svg className="w-5 h-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold text-emerald-900">{exportSuccess}</span>
            </motion.div>
          )}

          {exportStatus === "error" && exportError && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-3"
            >
              <svg className="w-5 h-5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-red-900">{exportError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Informational Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Guidelines & Behavior</h2>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">•</span>
              <span>Archives are extracted securely on the AxioDB server directly into the configured data directory.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">•</span>
              <span>Databases with existing names are preserved or handled per server safety policies.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">•</span>
              <span>Once import completes, the database tree in the Explorer sidebar automatically updates.</span>
            </li>
          </ul>
        </div>
      </motion.div>

      {/* Export Databases Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="max-w-3xl mx-auto mt-8 space-y-4"
      >
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12V2m0 0l-4 4m4-4l4 4M5 12h14" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Export Databases</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Download a compressed backup of any database as a <span className="font-mono text-slate-700">.tar.gz</span> archive.
              </p>
            </div>
          </div>

          {loadingDatabases ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : databases.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                </svg>
              </div>
              <p className="text-xs text-slate-500">No databases available for export.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {databases.map((dbName) => (
                <motion.div
                  key={dbName}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 * databases.indexOf(dbName) }}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-emerald-200 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <ellipse cx="12" cy="6" rx="8" ry="3" />
                        <path d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
                      </svg>
                    </div>
                    <span className="font-mono text-sm text-slate-900 truncate">{dbName}</span>
                  </div>
                  <button
                    onClick={() => handleExportDatabase(dbName)}
                    disabled={exportingDb === dbName}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {exportingDb === dbName ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12V2m0 0l-4 4m4-4l4 4M5 12h14" />
                        </svg>
                        Export
                      </>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Import;
