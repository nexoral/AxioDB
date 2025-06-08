import React from 'react';
import { Users, GitPullRequest, Scale } from 'lucide-react';

const Community: React.FC = () => {
  return (
    <div>
      <section id="contributing" className="pt-12 scroll-mt-20">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <GitPullRequest className="h-8 w-8 text-blue-500" />
          Contributing
        </h2>

        <p className="text-gray-700 dark:text-gray-300 mb-6">
          We welcome contributions from the community! Whether it's code improvements, documentation updates, bug reports, or feature suggestions, your input helps make AxioDB better.
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-gray-700 mb-8">
          <h3 className="text-xl font-semibold mb-4">How to Contribute</h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">1. Fork the Repository</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Start by forking the repository on GitHub to your own account.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">2. Create a Branch</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Create a branch for your contribution with a descriptive name related to the changes you're making.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">3. Make Your Changes</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Implement your changes, following the project's coding standards and guidelines.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">4. Write Tests</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Add tests to cover your changes and ensure that all existing tests pass.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">5. Submit a Pull Request</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Open a pull request with a clear description of the changes and any relevant issue numbers.
              </p>
            </div>
          </div>
        </div>

        <p className="text-gray-700 dark:text-gray-300">
          For more detailed guidelines, please read the <a href="#" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">CONTRIBUTING.md</a> file in the project repository.
        </p>
      </section>

      <section id="license" className="pt-12 scroll-mt-20">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Scale className="h-8 w-8 text-green-500" />
          License
        </h2>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-gray-700 mb-6">
          <p className="text-gray-700 dark:text-gray-300">
            This project is licensed under the MIT License. The MIT License is a permissive license that allows for reuse with few restrictions. It permits users to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software.
          </p>

          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md mt-4 overflow-x-auto text-sm font-mono">
            {`MIT License

Copyright (c) 2023 AxioDB Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
          </pre>
        </div>

        <p className="text-gray-700 dark:text-gray-300">
          For more details, see the <a href="#" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">LICENSE</a> file in the project repository.
        </p>
      </section>

      <section id="acknowledgments" className="pt-12 scroll-mt-20">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Users className="h-8 w-8 text-purple-500" />
          Acknowledgments
        </h2>

        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Special thanks to all contributors and supporters of AxioDB. Your feedback and contributions make this project better!
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-100 dark:border-gray-700 mb-6">
          <h3 className="text-xl font-semibold mb-4">Contributors</h3>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <img src="https://github.com/ankansaha.png" alt="Ankan Saha" className="w-10 h-10 rounded-full" />
              <div className="flex flex-col">
                <a href="https://github.com/AnkanSaha" target="_blank" rel="noopener noreferrer">
                  <p className="font-medium text-gray-900 dark:text-white">Ankan Saha</p>
                </a>
                <p className="text-sm text-gray-500 dark:text-gray-400">Project Lead</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <Users className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Community Contributors</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Various Contributors</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-4 rounded-r-lg">
          <p className="text-gray-700 dark:text-gray-300">
            AxioDB is inspired by the best practices and patterns from popular databases like MongoDB, while bringing its own unique approach to the NoSQL database space. We're grateful to the broader open-source community for paving the way for projects like this.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Community;