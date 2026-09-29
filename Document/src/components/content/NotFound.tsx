import React from "react";
import { Head } from "vite-react-ssg";

const NotFound: React.FC = () => (
  <section className="pt-12 scroll-mt-20 text-center">
    <Head>
      <meta name="robots" content="noindex" />
    </Head>
    <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
    <p className="text-lg text-gray-600 mb-8">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <a
      href="/"
      className="inline-block px-6 py-3 bg-accent-600 text-white rounded-[3px] font-semibold hover:bg-accent-700 transition-colors"
    >
      Back to Documentation
    </a>
  </section>
);

export default NotFound;