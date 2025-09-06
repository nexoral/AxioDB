import React from "react";
import {
  Users,
  GitPullRequest,
  Scale,
  Heart,
  Github,
  ExternalLink,
} from "lucide-react";

const Community: React.FC = () => {
  return (
    <div>
      <section id="contributing" className="pt-12 scroll-mt-20">
        {/* Contributing Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-900/20 dark:via-slate-800 dark:to-indigo-900/20 rounded-2xl p-8 lg:p-12 mb-16 border border-blue-200 dark:border-blue-800 shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg animate-glow">
                <GitPullRequest className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-800 via-indigo-700 to-purple-700 dark:from-blue-200 dark:via-indigo-300 dark:to-purple-200 bg-clip-text text-transparent">
                  Join Our Community
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 font-light mt-2">
                  Shape the future of AxioDB together
                </p>
              </div>
            </div>
            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
              Be part of a passionate community building the next generation of
              NoSQL databases. Whether you're contributing code, improving
              documentation, reporting bugs, or suggesting features, every
              contribution makes AxioDB stronger and more valuable for
              developers worldwide.
            </p>
          </div>
        </div>

        {/* Contributing Guide */}
        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 lg:p-10 mb-12 border border-slate-200 dark:border-slate-700">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                <GitPullRequest className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  Contribution Workflow
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Step-by-step guide to contributing
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                    1
                  </div>
                  <h4 className="font-bold text-blue-900 dark:text-blue-100">
                    Fork Repository
                  </h4>
                </div>
                <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                  Create your own copy of the AxioDB repository on GitHub to
                  start contributing safely.
                </p>
              </div>

              <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                    2
                  </div>
                  <h4 className="font-bold text-green-900 dark:text-green-100">
                    Feature Branch
                  </h4>
                </div>
                <p className="text-green-800 dark:text-green-200 leading-relaxed">
                  Create a descriptive branch name that clearly indicates your
                  feature or bug fix.
                </p>
              </div>

              <div className="relative bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                    3
                  </div>
                  <h4 className="font-bold text-purple-900 dark:text-purple-100">
                    Code Changes
                  </h4>
                </div>
                <p className="text-purple-800 dark:text-purple-200 leading-relaxed">
                  Follow coding standards and maintain consistency with existing
                  architecture patterns.
                </p>
              </div>

              <div className="relative bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                    4
                  </div>
                  <h4 className="font-bold text-yellow-900 dark:text-yellow-100">
                    Write Tests
                  </h4>
                </div>
                <p className="text-yellow-800 dark:text-yellow-200 leading-relaxed">
                  Add comprehensive unit tests for new functionality and ensure
                  all existing tests pass.
                </p>
              </div>

              <div className="relative bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-xl border border-indigo-200 dark:border-indigo-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                    5
                  </div>
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-100">
                    Pull Request
                  </h4>
                </div>
                <p className="text-indigo-800 dark:text-indigo-200 leading-relaxed">
                  Submit detailed PR with clear description, linked issues, and
                  testing instructions.
                </p>
              </div>

              <div className="relative bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-rose-200 dark:border-rose-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                    6
                  </div>
                  <h4 className="font-bold text-rose-900 dark:text-rose-100">
                    Review & Merge
                  </h4>
                </div>
                <p className="text-rose-800 dark:text-rose-200 leading-relaxed">
                  Collaborate with maintainers during review process and see
                  your contribution merged.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 lg:p-10 border-l-4 border-blue-500 shadow-xl mb-12">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl"></div>

          <div className="relative z-10 flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                <ExternalLink className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-3">
                Contributing Guidelines
              </h4>
              <p className="text-lg text-blue-800 dark:text-blue-200 leading-relaxed mb-4">
                Detailed contribution guidelines, coding standards, and project
                architecture documentation are available in our comprehensive
                CONTRIBUTING.md file.
              </p>
              <a
                href="https://github.com/Nexoral/AxioDB/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
              >
                <Github className="h-5 w-5" />
                View Contributing Guide
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="license" className="pt-12 scroll-mt-20">
        {/* License Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-green-900/20 dark:via-slate-800 dark:to-emerald-900/20 rounded-2xl p-8 lg:p-12 mb-16 border border-green-200 dark:border-green-800 shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg animate-glow">
                <Scale className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-800 via-emerald-700 to-teal-700 dark:from-green-200 dark:via-emerald-300 dark:to-teal-200 bg-clip-text text-transparent">
                  Open Source License
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 font-light mt-2">
                  Freedom to use, modify, and distribute
                </p>
              </div>
            </div>
            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
              AxioDB is proudly released under the MIT License, ensuring maximum
              flexibility for developers and organizations. Use it in commercial
              projects, modify it to fit your needs, and distribute it freely.
            </p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 lg:p-10 mb-12 border border-slate-200 dark:border-slate-700">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-emerald-50/30 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                <Scale className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  MIT License Overview
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                  AxioDB is released under the MIT License, one of the most
                  permissive and widely-adopted open source licenses. This
                  provides extensive freedom for commercial and non-commercial
                  use, modification, and distribution.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-slate-900 to-green-900 rounded-xl p-6 shadow-inner">
              <pre className="text-green-300 text-sm font-mono overflow-x-auto">
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

            <div className="mt-6 text-center">
              <a
                href="https://github.com/AnkanSaha/AxioDB/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
              >
                <Scale className="h-5 w-5" />
                View Full License
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="acknowledgments" className="pt-12 scroll-mt-20">
        {/* Acknowledgments Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-purple-900/20 dark:via-slate-800 dark:to-violet-900/20 rounded-2xl p-8 lg:p-12 mb-16 border border-purple-200 dark:border-purple-800 shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-400/10 to-violet-400/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl shadow-lg animate-glow">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-800 via-violet-700 to-pink-700 dark:from-purple-200 dark:via-violet-300 dark:to-pink-200 bg-clip-text text-transparent">
                  Community & Contributors
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 font-light mt-2">
                  Powered by amazing developers worldwide
                </p>
              </div>
            </div>
            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
              AxioDB thrives thanks to our vibrant community of contributors,
              supporters, and users. Every bug report, feature suggestion, code
              contribution, and piece of feedback helps make AxioDB better for
              developers around the world.
            </p>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 lg:p-10 mb-12 border border-slate-200 dark:border-slate-700">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-violet-50/30 dark:from-purple-900/10 dark:to-violet-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  Project Contributors
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Meet the people behind AxioDB
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="group relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <img
                    src="https://github.com/ankansaha.png"
                    alt="Ankan Saha - Project Lead"
                    className="w-16 h-16 rounded-full border-2 border-white shadow-lg group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="flex-1">
                    <a
                      href="https://github.com/AnkanSaha"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                    >
                      <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        Ankan Saha
                      </h4>
                    </a>
                    <p className="text-blue-600 dark:text-blue-400 font-semibold">
                      Project Lead & Creator
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Software Engineer | Node.js Expert
                    </p>
                  </div>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-6 rounded-xl border border-green-200 dark:border-green-700 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      Community Contributors
                    </h4>
                    <p className="text-green-600 dark:text-green-400 font-semibold">
                      Open Source Community
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Developers worldwide contributing to AxioDB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-violet-50 to-pink-50 dark:from-purple-900/20 dark:via-violet-900/20 dark:to-pink-900/20 rounded-2xl p-8 lg:p-10 border-l-4 border-purple-500 shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-violet-400/20 rounded-full blur-2xl"></div>

          <div className="relative z-10 flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                <Heart className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-3">
                Special Recognition
              </h4>
              <p className="text-lg text-purple-800 dark:text-purple-200 leading-relaxed">
                AxioDB is inspired by the best practices and patterns from
                popular databases like MongoDB, while bringing its own unique
                approach to the NoSQL database space. We're grateful to the
                broader open-source community for paving the way for innovative
                projects like this, and to every developer who chooses AxioDB
                for their applications.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Community;
