import { useEffect, useState } from 'react'
import axios from 'axios'
import { BASE_API_URL } from '../config/key'
import { ExchangeKeyStore } from '../store/store'

const Support = () => {
  const [authorInfo, setAuthorInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { TransactionKey } = ExchangeKeyStore((state) => state)

  useEffect(() => {
    const fetchAuthorInfo = async () => {
      try {
        const response = await axios.get(`${BASE_API_URL}/api/info`)
        if (response.status === 200) {
          setAuthorInfo(response.data.data)
        }
      } catch (err) {
        console.error('Error fetching author info:', err)
        setError('Failed to load author information')
      } finally {
        setLoading(false)
      }
    }

    fetchAuthorInfo()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Need Help with AxioDB?
          </h1>
          <p className="text-xl text-gray-600">
            Get in touch with the developer for support and assistance
          </p>
        </div>

        {/* Main Support Card */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          {/* Developer Info Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12 text-white">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white border-opacity-30">
                <img 
                  src={`https://github.com/${authorInfo?.AuthorDetails?.github?.split('/').pop()}.png`}
                  alt={`${authorInfo?.AuthorDetails?.name}'s GitHub Avatar`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="w-full h-full bg-white bg-opacity-20 rounded-full hidden items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {authorInfo?.AuthorDetails?.name || 'Loading...'}
                </h2>
                <p className="text-blue-100 text-lg">
                  {authorInfo?.AuthorDetails?.Designation || 'Software Engineer'}
                </p>
                <p className="text-blue-100">
                  {authorInfo?.AuthorDetails?.Country || 'India'} • Solo Developer
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="px-8 py-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Methods */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h3>
                <div className="space-y-4">
                  <a 
                    href={`mailto:${authorInfo?.AuthorDetails?.Email}`}
                    className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-gray-600">{authorInfo?.AuthorDetails?.Email}</p>
                    </div>
                  </a>

                  <a 
                    href={authorInfo?.AuthorDetails?.LinkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">LinkedIn</p>
                      <p className="text-gray-600">Connect on LinkedIn</p>
                    </div>
                  </a>

                  <a 
                    href={authorInfo?.AuthorDetails?.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">GitHub</p>
                      <p className="text-gray-600">View source code</p>
                    </div>
                  </a>
                </div>
              </div>

              {/* Project Information */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Project Details</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-900">Package Name</p>
                    <p className="text-blue-700">{authorInfo?.Package_Name || 'axiodb'}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="font-medium text-green-900">Version</p>
                    <p className="text-green-700">{authorInfo?.AxioDB_Version || '2.30.92'}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="font-medium text-purple-900">License</p>
                    <p className="text-purple-700">{authorInfo?.License || 'MIT'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Issue Reporting Section */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 mt-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-semibold text-yellow-900 mb-4">Reporting Issues</h3>
              <div className="prose text-yellow-800">
                <p className="mb-4">
                  If you encounter any issues with AxioDB, please help me resolve them quickly by providing detailed information:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li><strong>Detailed Description:</strong> What exactly happened and what did you expect?</li>
                  <li><strong>Steps to Reproduce:</strong> Please provide step-by-step instructions to reproduce the error</li>
                  <li><strong>Environment:</strong> Operating system, Node.js version, AxioDB version</li>
                  <li><strong>Error Messages:</strong> Copy the complete error message and stack trace</li>
                  <li><strong>Code Sample:</strong> Minimal code that reproduces the issue</li>
                </ul>
                <div className="bg-yellow-100 rounded-lg p-4 mt-4">
                  <p className="font-medium text-yellow-900">Note:</p>
                  <p className="text-yellow-800 mt-1">
                    As a solo developer, I appreciate your patience. I'll respond to issues as soon as possible 
                    and work diligently to resolve them. Your detailed bug reports help me fix issues faster!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Response Time Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold text-blue-900">Expected Response Time</h4>
              <p className="text-blue-700 mt-1">
                I typically respond within 24-48 hours. For critical issues, I'll prioritize and respond as soon as possible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Support