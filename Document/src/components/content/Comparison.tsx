import React from 'react';
import { Zap, Server, GitCompare } from 'lucide-react';

const Comparison: React.FC = () => {
  return (
    <section id="comparison" className="pt-12 scroll-mt-20">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <GitCompare className="h-8 w-8 text-purple-500" />
        Performance Comparison
      </h2>

      <p className="text-gray-700 dark:text-gray-300 mb-8">
        AxioDB stands out from other NPM-based database management systems through its innovative architecture and performance optimizations.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-red-500">Other NPM DBMSs</h3>
          <ul className="space-y-3 list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>Single JSON file storage leading to heavy Read/Write I/O operations</li>
            <li>No built-in caching mechanism</li>
            <li>Linear search for document retrieval</li>
            <li>Performance degrades with larger datasets</li>
            <li>No document ID indexing system</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-green-500">AxioDB Advantages</h3>
          <ul className="space-y-3 list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>Tree-structured storage for optimized data management</li>
            <li>InMemoryCache strategy for faster queries</li>
            <li>Auto-indexed documentId for lightning-fast searches</li>
            <li>Maintains performance with large datasets</li>
            <li>Efficient data distribution and retrieval</li>
          </ul>
        </div>
      </div>

      <div className="overflow-x-auto mb-8">
        <table className="table-auto w-full border-collapse border border-gray-200 dark:border-gray-700">
          <thead>
            <tr className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">Feature</th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">AxioDB</th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">MongoDB</th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">Redis</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-gray-50 dark:bg-gray-900">
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">Ease of Setup</td>
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-green-500 font-semibold">Very Easy</td>
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-yellow-500 font-semibold">Moderate</td>
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-blue-500 font-semibold">Easy</td>
            </tr>
            <tr>
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">Performance (Small Datasets)</td>
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-green-500 font-semibold">High</td>
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-yellow-500 font-semibold">Moderate</td>
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-green-500 font-semibold">High</td>
            </tr>
            <tr className="bg-gray-50 dark:bg-gray-900">
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">Memory Usage</td>
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-green-500 font-semibold">Optimized</td>
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-yellow-500 font-semibold">Moderate</td>
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-red-500 font-semibold">High</td>
            </tr>
            <tr>
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">Query Speed</td>
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-green-500 font-semibold">Fast</td>
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-yellow-500 font-semibold">Moderate</td>
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-green-500 font-semibold">Fast</td>
            </tr>
            <tr className="bg-gray-50 dark:bg-gray-900">
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">Best Use Case</td>
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-green-500 font-semibold">Small Projects</td>
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-yellow-500 font-semibold">Scalable Applications</td>
              <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-blue-500 font-semibold">Caching</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-8 mb-12">
        <div className="flex items-start gap-6 flex-col md:flex-row">
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Server className="h-6 w-6 text-blue-500" />
              Coming Soon: AxioDB Docker
            </h3>

            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We're extending AxioDB's power beyond JavaScript with our upcoming Docker image, featuring:
            </p>

            <ul className="space-y-2 mb-6 list-disc pl-6 text-gray-700 dark:text-gray-300">
              <li>Multiple connection protocols:
                <ul className="pl-4 mt-2 space-y-1">
                  <li>TCP Port</li>
                  <li>HTTP Port</li>
                  <li>gRPC Port</li>
                  <li>WebSocket Port</li>
                </ul>
              </li>
              <li>Multi-user system with authentication</li>
              <li>Web-based GUI Management Dashboard</li>
              <li>Cross-language compatibility</li>
            </ul>
          </div>

          <div className="flex flex-col gap-4 min-w-[300px]">
            <a href="https://hub.docker.com/r/theankansaha/axiodb"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <img src="https://images.icon-icons.com/2530/PNG/512/dockerhub_button_icon_151899.png"
                alt="Docker Hub"
                className="h-8 w-8 object-contain dark:invert" />
              <div>
                <h4 className="font-semibold">Docker Hub</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Official Docker Image</p>
              </div>
            </a>

            <a href="https://github.com/AnkanSaha/AxioDB-Docker/pkgs/container/axiodb"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                alt="GitHub Packages"
                className="h-8 w-8 object-contain dark:invert" />
              <div>
                <h4 className="font-semibold">GitHub Packages</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Container Registry</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-500" />
          Performance Metrics
        </h4>
        <p className="text-gray-700 dark:text-gray-300">
          In benchmark tests with 1 million documents, AxioDB's documentId search performed up to 10x faster than traditional JSON-based DBMSs, thanks to its tree structure and auto-indexing system.
        </p>
      </div>
    </section>
  );
};

export default Comparison;