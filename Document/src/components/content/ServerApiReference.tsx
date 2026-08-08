import { Globe, Server, ChevronDown, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import Seo from "../ui/Seo";
import { apiCategories } from "../../data/serverApi";

const ServerApiReference: React.FC = () => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [expandedEndpoints, setExpandedEndpoints] = useState<string[]>([]);


  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const toggleEndpoint = (endpoint: string) => {
    setExpandedEndpoints((prev) =>
      prev.includes(endpoint)
        ? prev.filter((e) => e !== endpoint)
        : [...prev, endpoint],
    );
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-900/30 text-green-300 border-green-700";
      case "POST":
        return "bg-blue-900/30 text-blue-300 border-blue-700";
      case "PUT":
        return "bg-amber-900/30 text-amber-300 border-amber-700";
      case "PATCH":
        return "bg-purple-900/30 text-purple-300 border-purple-700";
      case "DELETE":
        return "bg-red-900/30 text-red-300 border-red-700";
      default:
        return "bg-gray-900/30 text-gray-300 border-gray-700";
    }
  };

  return (
    <section id="server-api-reference" className="pt-12 scroll-mt-20">
      <Seo
        title="AxioDB Server API Reference - Comprehensive Guide to RESTful Endpoints"
        description="REST API reference for the AxioDB Control Server: authentication, database, collection, index, and document endpoints."
        path="/server-api"
      />
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900/20 via-slate-800 to-purple-900/20 rounded-2xl p-5 sm:p-8 lg:p-12 mb-12 border border-indigo-800 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
              <Globe className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-200 via-purple-300 to-pink-200 bg-clip-text text-transparent">
                HTTP Server API Reference
              </h1>
              <p className="text-xl text-slate-300 font-light mt-2">
                RESTful API documentation for AxioDB GUI Server
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-lg text-slate-300 leading-relaxed">
              The AxioDB GUI Server provides a comprehensive RESTful API for managing databases, collections, and documents
              over HTTP. All endpoints return JSON responses and support standard HTTP status codes. Base URL: <code className="bg-indigo-900 px-2 py-1 rounded">http://localhost:27018</code>
            </p>
            <p className="text-lg text-slate-300 leading-relaxed">
              Every endpoint below except <code className="bg-indigo-900 px-2 py-1 rounded">/api/info</code>, <code className="bg-indigo-900 px-2 py-1 rounded">/api/health</code>, <code className="bg-indigo-900 px-2 py-1 rounded">/api/routes</code>, and <code className="bg-indigo-900 px-2 py-1 rounded">/api/auth/login</code> requires an authenticated session (see the <strong>Authentication &amp; Access Control</strong> section below) and is subject to role-based permission checks - expect <code className="bg-indigo-900 px-2 py-1 rounded">401</code> without a valid session cookie and <code className="bg-indigo-900 px-2 py-1 rounded">403</code> if the caller's role lacks the required permission.
            </p>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-indigo-900/30 rounded-lg p-4 border border-indigo-700">
                <h3 className="font-semibold text-indigo-200 mb-2 flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Base URL
                </h3>
                <code className="text-sm text-indigo-300 break-all">
                  http://localhost:27018
                </code>
              </div>

              <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-700">
                <h3 className="font-semibold text-purple-200 mb-2">
                  Content-Type
                </h3>
                <code className="text-sm text-purple-300">
                  application/json
                </code>
              </div>

              <div className="bg-pink-900/30 rounded-lg p-4 border border-pink-700">
                <h3 className="font-semibold text-pink-200 mb-2">
                  Authentication
                </h3>
                <p className="text-sm text-pink-300">
                  Session cookie (httpOnly) via <code>/api/auth/login</code>, RBAC-enforced
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Categories */}
      <div className="space-y-6">
        {apiCategories.map((category) => (
          <div
            key={category.title}
            className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 overflow-hidden"
          >
            <button
              className="flex items-center justify-between w-full p-6 text-left bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 transition-all"
              onClick={() => toggleCategory(category.title)}
            >
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {category.title}
                </h3>
                <p className="text-sm text-slate-400">
                  {category.description}
                </p>
              </div>
              {expandedCategories.includes(category.title) ? (
                <ChevronDown size={24} className="text-slate-500" />
              ) : (
                <ChevronRight size={24} className="text-slate-500" />
              )}
            </button>

            {expandedCategories.includes(category.title) && (
              <div className="divide-y divide-slate-700">
                {category.endpoints.map((endpoint, idx) => {
                  const endpointId = `${category.title}-${idx}`;
                  return (
                    <div key={endpointId} className="p-6">
                      <button
                        className="flex items-center justify-between w-full text-left mb-4"
                        onClick={() => toggleEndpoint(endpointId)}
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <span
                            className={`px-3 py-1 rounded-lg font-bold text-sm border ${getMethodColor(endpoint.method)}`}
                          >
                            {endpoint.method}
                          </span>
                          <code className="font-mono text-slate-300 font-medium">
                            {endpoint.path}
                          </code>
                        </div>
                        {expandedEndpoints.includes(endpointId) ? (
                          <ChevronDown size={20} className="text-slate-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight size={20} className="text-slate-500 flex-shrink-0" />
                        )}
                      </button>

                      <p className="text-slate-300 mb-4">
                        {endpoint.description}
                      </p>

                      {expandedEndpoints.includes(endpointId) && (
                        <div className="space-y-4 mt-4">
                          {/* Parameters */}
                          {endpoint.parameters && endpoint.parameters.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-slate-400 mb-2">
                                Parameters
                              </h4>
                              <div className="bg-slate-900 rounded-lg p-4 space-y-3">
                                {endpoint.parameters.map((param, paramIdx) => (
                                  <div key={paramIdx} className="border-l-2 border-indigo-400 pl-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <code className="font-mono text-indigo-400 font-semibold">
                                        {param.name}
                                      </code>
                                      <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">
                                        {param.type}
                                      </span>
                                      <span className="text-xs text-slate-400">
                                        {param.dataType}
                                      </span>
                                      {param.required && (
                                        <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded font-semibold">
                                          required
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1">
                                      {param.description}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Request Body */}
                          {endpoint.requestBody && (
                            <div>
                              <h4 className="text-sm font-semibold text-slate-400 mb-2">
                                Request Body Example
                              </h4>
                              <pre className="bg-slate-950 p-3 sm:p-4 rounded-lg text-xs sm:text-sm overflow-x-auto overscroll-x-contain">
                                <code className="text-sm font-mono text-green-400">
                                  {endpoint.requestBody}
                                </code>
                              </pre>
                            </div>
                          )}

                          {/* Response Example */}
                          {endpoint.responseExample && (
                            <div>
                              <h4 className="text-sm font-semibold text-slate-400 mb-2">
                                Response Example
                              </h4>
                              <pre className="bg-slate-950 p-3 sm:p-4 rounded-lg text-xs sm:text-sm overflow-x-auto overscroll-x-contain">
                                <code className="text-sm font-mono text-cyan-400">
                                  {endpoint.responseExample}
                                </code>
                              </pre>
                            </div>
                          )}

                          {/* Status Codes */}
                          <div>
                            <h4 className="text-sm font-semibold text-slate-400 mb-2">
                              Status Codes
                            </h4>
                            <div className="space-y-2">
                              {endpoint.statusCodes.map((status, statusIdx) => (
                                <div
                                  key={statusIdx}
                                  className="flex items-start gap-3 text-sm"
                                >
                                  <span
                                    className={`px-2 py-1 rounded font-mono font-semibold ${status.code >= 200 && status.code < 300
                                      ? "bg-green-900/30 text-green-400"
                                      : status.code >= 400 && status.code < 500
                                        ? "bg-amber-900/30 text-amber-400"
                                        : "bg-red-900/30 text-red-400"
                                      }`}
                                  >
                                    {status.code}
                                  </span>
                                  <span className="text-slate-300">
                                    {status.description}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-12 space-y-6">
        {/* Error Response Format */}
        <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-lg p-6 border border-red-800">
          <h3 className="text-xl font-bold text-red-200 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚠️</span> Error Response Format
          </h3>
          <p className="text-red-300 mb-3">
            All error responses follow this consistent format:
          </p>
          <pre className="bg-red-950 p-3 sm:p-4 rounded-lg text-xs sm:text-sm overflow-x-auto overscroll-x-contain">
            <code className="text-sm font-mono text-red-200">{`{
  "statusCode": 400,
  "status": "error",
  "message": "Detailed error message",
  "error": {
    // Additional error details (optional)
  }
}`}</code>
          </pre>
        </div>

        {/* Usage Tips */}
        <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-lg p-6 border border-blue-800">
          <h3 className="text-xl font-bold text-blue-200 mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span> Usage Tips
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-blue-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">✓</span>
              <span className="text-sm">Set <code className="bg-blue-900 px-1 rounded">Content-Type: application/json</code> for all requests</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">✓</span>
              <span className="text-sm">Use pagination for large datasets (10 items per page)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">✓</span>
              <span className="text-sm">Check status codes for proper error handling</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">✓</span>
              <span className="text-sm">Use documentId queries for fastest lookups</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">✓</span>
              <span className="text-sm">Export databases regularly for backups</span>
            </li>
          </ul>
        </div>

        {/* Final Note */}
        <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
          <p className="text-slate-300 flex items-center gap-2">
            <span className="text-indigo-400 text-xl">ℹ️</span>
            <span>
              The AxioDB GUI Server runs on <code className="bg-slate-800 px-2 py-1 rounded mx-1">localhost:27018</code> by default.
              All API endpoints are available when GUI is enabled in AxioDB initialization. For more details on the JavaScript/TypeScript API,
              see the <a href="/api-reference" className="text-indigo-400 hover:underline font-semibold">Core API Reference</a>.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ServerApiReference;
