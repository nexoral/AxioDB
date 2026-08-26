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
        return "bg-green-100/30 text-green-700 border-green-200";
      case "POST":
        return "bg-accent-100/30 text-accent-600 border-accent-200";
      case "PUT":
        return "bg-amber-100/30 text-amber-700 border-amber-200";
      case "PATCH":
        return "bg-purple-100/30 text-purple-700 border-purple-200";
      case "DELETE":
        return "bg-red-100/30 text-red-300 border-red-700";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
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
      <div className="relative overflow-hidden bg-gray-100 rounded-lg p-5 sm:p-8 lg:p-12 mb-12 border border-fuchsia-200 shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-100/40 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-fuchsia-500 rounded-xl shadow-lg">
              <Globe className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-accent-600">
                HTTP Server API Reference
              </h1>
              <p className="text-xl text-gray-600 font-light mt-2">
                RESTful API documentation for AxioDB GUI Server
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-lg text-gray-600 leading-relaxed">
              The AxioDB GUI Server provides a comprehensive RESTful API for managing databases, collections, and documents
              over HTTP. All endpoints return JSON responses and support standard HTTP status codes. Base URL: <code className="bg-fuchsia-100 text-fuchsia-800 px-2 py-1 rounded">http://localhost:27018</code>
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Every endpoint below except <code className="bg-fuchsia-100 text-fuchsia-800 px-2 py-1 rounded">/api/info</code>, <code className="bg-fuchsia-100 text-fuchsia-800 px-2 py-1 rounded">/api/health</code>, <code className="bg-fuchsia-100 text-fuchsia-800 px-2 py-1 rounded">/api/routes</code>, and <code className="bg-fuchsia-100 text-fuchsia-800 px-2 py-1 rounded">/api/auth/login</code> requires an authenticated session (see the <strong>Authentication &amp; Access Control</strong> section below) and is subject to role-based permission checks - expect <code className="bg-fuchsia-100 text-fuchsia-800 px-2 py-1 rounded">401</code> without a valid session cookie and <code className="bg-fuchsia-100 text-fuchsia-800 px-2 py-1 rounded">403</code> if the caller's role lacks the required permission.
            </p>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-fuchsia-100/30 rounded-lg p-4 border border-fuchsia-200">
                <h3 className="font-semibold text-fuchsia-700 mb-2 flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Base URL
                </h3>
                <code className="text-sm text-fuchsia-600 break-all">
                  http://localhost:27018
                </code>
              </div>

              <div className="bg-purple-100/30 rounded-lg p-4 border border-purple-200">
                <h3 className="font-semibold text-purple-700 mb-2">
                  Content-Type
                </h3>
                <code className="text-sm text-purple-700">
                  application/json
                </code>
              </div>

              <div className="bg-pink-100/30 rounded-lg p-4 border border-pink-200">
                <h3 className="font-semibold text-pink-700 mb-2">
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
            className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
          >
            <button
              className="flex items-center justify-between w-full p-6 text-left bg-gray-50 hover:bg-gray-100 transition-all"
              onClick={() => toggleCategory(category.title)}
            >
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {category.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {category.description}
                </p>
              </div>
              {expandedCategories.includes(category.title) ? (
                <ChevronDown size={24} className="text-gray-600" />
              ) : (
                <ChevronRight size={24} className="text-gray-600" />
              )}
            </button>

            {expandedCategories.includes(category.title) && (
              <div className="divide-y divide-gray-200">
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
                          <code className="font-mono text-gray-600 font-medium">
                            {endpoint.path}
                          </code>
                        </div>
                        {expandedEndpoints.includes(endpointId) ? (
                          <ChevronDown size={20} className="text-gray-600 flex-shrink-0" />
                        ) : (
                          <ChevronRight size={20} className="text-gray-600 flex-shrink-0" />
                        )}
                      </button>

                      <p className="text-gray-600 mb-4">
                        {endpoint.description}
                      </p>

                      {expandedEndpoints.includes(endpointId) && (
                        <div className="space-y-4 mt-4">
                          {/* Parameters */}
                          {endpoint.parameters && endpoint.parameters.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-600 mb-2">
                                Parameters
                              </h4>
                              <div className="bg-white rounded-lg p-4 space-y-3">
                                {endpoint.parameters.map((param, paramIdx) => (
                                  <div key={paramIdx} className="border-l-2 border-fuchsia-400 pl-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <code className="font-mono text-fuchsia-600 font-semibold">
                                        {param.name}
                                      </code>
                                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                                        {param.type}
                                      </span>
                                      <span className="text-xs text-gray-600">
                                        {param.dataType}
                                      </span>
                                      {param.required && (
                                        <span className="text-xs bg-red-100/30 text-red-400 px-2 py-0.5 rounded font-semibold">
                                          required
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
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
                              <h4 className="text-sm font-semibold text-gray-600 mb-2">
                                Request Body Example
                              </h4>
                              <pre className="bg-ink-950 p-3 sm:p-4 rounded-lg text-xs sm:text-sm overflow-x-auto overscroll-x-contain">
                                <code className="text-sm font-mono text-green-400">
                                  {endpoint.requestBody}
                                </code>
                              </pre>
                            </div>
                          )}

                          {/* Response Example */}
                          {endpoint.responseExample && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-600 mb-2">
                                Response Example
                              </h4>
                              <pre className="bg-ink-950 p-3 sm:p-4 rounded-lg text-xs sm:text-sm overflow-x-auto overscroll-x-contain">
                                <code className="text-sm font-mono text-cyan-400">
                                  {endpoint.responseExample}
                                </code>
                              </pre>
                            </div>
                          )}

                          {/* Status Codes */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-600 mb-2">
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
                                      ? "bg-green-100/30 text-green-600"
                                      : status.code >= 400 && status.code < 500
                                        ? "bg-amber-100/30 text-amber-700"
                                        : "bg-red-100/30 text-red-400"
                                      }`}
                                  >
                                    {status.code}
                                  </span>
                                  <span className="text-gray-600">
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
        <div className="bg-orange-50 rounded-lg p-6 border border-red-800">
          <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚠️</span> Error Response Format
          </h3>
          <p className="text-red-300 mb-3">
            All error responses follow this consistent format:
          </p>
          <pre className="bg-red-950 p-3 sm:p-4 rounded-lg text-xs sm:text-sm overflow-x-auto overscroll-x-contain">
            <code className="text-sm font-mono text-red-700">{`{
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
        <div className="bg-accent-50 rounded-lg p-6 border border-accent-200">
          <h3 className="text-xl font-bold text-accent-700 mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span> Usage Tips
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-accent-600">
            <li className="flex items-start gap-2">
              <span className="text-accent-600 mt-0.5">✓</span>
              <span className="text-sm">Set <code className="bg-accent-100 text-accent-800 px-1 rounded">Content-Type: application/json</code> for all requests</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-600 mt-0.5">✓</span>
              <span className="text-sm">Use pagination for large datasets (10 items per page)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-600 mt-0.5">✓</span>
              <span className="text-sm">Check status codes for proper error handling</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-600 mt-0.5">✓</span>
              <span className="text-sm">Use documentId queries for fastest lookups</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-600 mt-0.5">✓</span>
              <span className="text-sm">Export databases regularly for backups</span>
            </li>
          </ul>
        </div>

        {/* Final Note */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <p className="text-gray-600 flex items-center gap-2">
            <span className="text-fuchsia-600 text-xl">ℹ️</span>
            <span>
              The AxioDB GUI Server runs on <code className="bg-white px-2 py-1 rounded mx-1">localhost:27018</code> by default.
              All API endpoints are available when GUI is enabled in AxioDB initialization. For more details on the JavaScript/TypeScript API,
              see the <a href="/api-reference" className="text-fuchsia-600 hover:underline font-semibold">Core API Reference</a>.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ServerApiReference;
