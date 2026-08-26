import React from "react";
import {
  Users,
  GitPullRequest,
  Scale,
  Heart,
  Github,
  ExternalLink,
} from "lucide-react";
import Seo from "../ui/Seo";

const Community: React.FC = () => {
  return (
    <div>
      <Seo
        title="AxioDB Community - Join, Contribute & Get Support"
        description="Contribute to AxioDB, join the community, and find support resources and acknowledgments."
        path="/community"
      />
      <section id="contributing" className="pt-12 scroll-mt-20">
        {/* Contributing Hero Header */}
        <div className="relative overflow-hidden bg-gray-100 rounded-lg p-5 sm:p-8 lg:p-12 mb-16 border border-accent-200 shadow-md">
          <div className="absolute top-0 right-0 w-48 h-48 bg-accent-100/40 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-accent-500 rounded-xl shadow-lg animate-glow">
                <GitPullRequest className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-accent-600">
                  Join Our Community
                </h1>
                <p className="text-xl text-gray-600 font-light mt-2">
                  Shape the future of AxioDB together
                </p>
              </div>
            </div>
            <p className="text-lg text-gray-600 leading-relaxed">
              Be part of a passionate community building the next generation of
              NoSQL databases. Whether you're contributing code, improving
              documentation, reporting bugs, or suggesting features, every
              contribution makes AxioDB stronger and more valuable for
              developers worldwide.
            </p>
          </div>
        </div>

        {/* Contributing Guide */}
        <div className="group relative bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-8 lg:p-10 mb-12 border border-gray-200">
          <div className="absolute inset-0 bg-accent-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-accent-500 rounded-xl shadow-lg">
                <GitPullRequest className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Contribution Workflow
                </h3>
                <p className="text-gray-600">
                  Step-by-step guide to contributing
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="relative bg-accent-50 p-6 rounded-xl border border-accent-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-accent-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                    1
                  </div>
                  <h4 className="font-bold text-accent-700">
                    Fork Repository
                  </h4>
                </div>
                <p className="text-accent-700 leading-relaxed">
                  Create your own copy of the AxioDB repository on GitHub to
                  start contributing safely.
                </p>
              </div>

              <div className="relative bg-green-50 p-6 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                    2
                  </div>
                  <h4 className="font-bold text-green-700">
                    Feature Branch
                  </h4>
                </div>
                <p className="text-green-700 leading-relaxed">
                  Create a descriptive branch name that clearly indicates your
                  feature or bug fix.
                </p>
              </div>

              <div className="relative bg-accent-50 p-6 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                    3
                  </div>
                  <h4 className="font-bold text-purple-700">
                    Code Changes
                  </h4>
                </div>
                <p className="text-purple-700 leading-relaxed">
                  Follow coding standards and maintain consistency with existing
                  architecture patterns.
                </p>
              </div>

              <div className="relative bg-orange-50 p-6 rounded-xl border border-yellow-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-yellow-500 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                    4
                  </div>
                  <h4 className="font-bold text-amber-700">
                    Write Tests
                  </h4>
                </div>
                <p className="text-amber-700 leading-relaxed">
                  Add comprehensive unit tests for new functionality and ensure
                  all existing tests pass.
                </p>
              </div>

              <div className="relative bg-accent-50 p-6 rounded-xl border border-fuchsia-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-fuchsia-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                    5
                  </div>
                  <h4 className="font-bold text-fuchsia-700">
                    Pull Request
                  </h4>
                </div>
                <p className="text-fuchsia-700 leading-relaxed">
                  Submit detailed PR with clear description, linked issues, and
                  testing instructions.
                </p>
              </div>

              <div className="relative bg-accent-50 p-6 rounded-xl border border-rose-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-rose-500 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                    6
                  </div>
                  <h4 className="font-bold text-rose-700">
                    Review & Merge
                  </h4>
                </div>
                <p className="text-rose-700 leading-relaxed">
                  Collaborate with maintainers during review process and see
                  your contribution merged.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-accent-50 rounded-lg p-8 lg:p-10 border-l-4 border-accent-500 shadow-md mb-12">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-100/40 rounded-full blur-2xl"></div>

          <div className="relative z-10 flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-accent-500 rounded-xl shadow-lg">
                <ExternalLink className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-2xl font-bold text-accent-700 mb-3">
                Contributing Guidelines
              </h4>
              <p className="text-lg text-accent-700 leading-relaxed mb-4">
                Detailed contribution guidelines, coding standards, and project
                architecture documentation are available in our comprehensive
                CONTRIBUTING.md file.
              </p>
              <a
                href="https://github.com/nexoral/AxioDB/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-accent-600 hover:bg-accent-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-300"
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
        <div className="relative overflow-hidden bg-gray-100 rounded-lg p-5 sm:p-8 lg:p-12 mb-16 border border-green-200 shadow-md">
          <div className="absolute top-0 right-0 w-48 h-48 bg-accent-100/40 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green-500 rounded-xl shadow-lg animate-glow">
                <Scale className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-green-600">
                  Open Source License
                </h2>
                <p className="text-xl text-gray-600 font-light mt-2">
                  Freedom to use, modify, and distribute
                </p>
              </div>
            </div>
            <p className="text-lg text-gray-600 leading-relaxed">
              AxioDB is proudly released under the MIT License, ensuring maximum
              flexibility for developers and organizations. Use it in commercial
              projects, modify it to fit your needs, and distribute it freely.
            </p>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-8 lg:p-10 mb-12 border border-gray-200">
          <div className="absolute inset-0 bg-green-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 mb-6">
              <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                <Scale className="h-8 w-8 text-white" />
              </div>
              <div className="w-full min-w-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  MIT License Overview
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  AxioDB is released under the MIT License, one of the most
                  permissive and widely-adopted open source licenses. This
                  provides extensive freedom for commercial and non-commercial
                  use, modification, and distribution.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <pre className="text-green-700 text-xs sm:text-sm font-mono overflow-x-auto overscroll-x-contain">
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
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-300"
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
        <div className="relative overflow-hidden bg-gray-100 rounded-lg p-5 sm:p-8 lg:p-12 mb-16 border border-purple-200 shadow-md">
          <div className="absolute top-0 right-0 w-48 h-48 bg-accent-100/40 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-purple-500 rounded-xl shadow-lg animate-glow">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-accent-600">
                  Community & Contributors
                </h2>
                <p className="text-xl text-gray-600 font-light mt-2">
                  Powered by amazing developers worldwide
                </p>
              </div>
            </div>
            <p className="text-lg text-gray-600 leading-relaxed">
              AxioDB thrives thanks to our vibrant community of contributors,
              supporters, and users. Every bug report, feature suggestion, code
              contribution, and piece of feedback helps make AxioDB better for
              developers around the world.
            </p>
          </div>
        </div>

        <div className="group relative bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-8 lg:p-10 mb-12 border border-gray-200">
          <div className="absolute inset-0 bg-accent-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Project Contributors
                </h3>
                <p className="text-gray-600">
                  Meet the people behind AxioDB
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="group relative bg-accent-50 p-6 rounded-xl border border-accent-200 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
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
                      className="hover:text-accent-600 transition-colors duration-200"
                    >
                      <h4 className="text-xl font-bold text-gray-900">
                        Ankan Saha
                      </h4>
                    </a>
                    <p className="text-accent-600 font-semibold">
                      Project Lead & Creator
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Software Engineer | Node.js Expert
                    </p>
                  </div>
                </div>
              </div>

              <div className="group relative bg-green-50 p-6 rounded-xl border border-green-200 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-teal-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900">
                      Community Contributors
                    </h4>
                    <p className="text-green-600 font-semibold">
                      Open Source Community
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Developers worldwide contributing to AxioDB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-accent-50 rounded-lg p-8 lg:p-10 border-l-4 border-purple-500 shadow-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-100/40 rounded-full blur-2xl"></div>

          <div className="relative z-10 flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                <Heart className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-2xl font-bold text-purple-700 mb-3">
                Special Recognition
              </h4>
              <p className="text-lg text-purple-700 leading-relaxed">
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
