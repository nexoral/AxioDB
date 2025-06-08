import React from 'react';
import { Database, Zap, Shield, Code } from 'lucide-react';

const PainPoints: React.FC = () => {
    return (
        <section id="pain-points" className="pt-12 scroll-mt-20 relative">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
                <Zap className="h-8 w-8 text-red-500" />
                Pain Points as a Node.js Backend Engineer
            </h2>
            <ul className="space-y-6">
                <li className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <Zap className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Heavyweight NoSQL Databases</h3>
                        <p className="text-gray-700 dark:text-gray-300">
                            Using databases like MongoDB for small to medium-sized projects felt excessive and inefficient.
                        </p>
                    </div>
                </li>
                <li className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <Database className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Complex Setup</h3>
                        <p className="text-gray-700 dark:text-gray-300">
                            Setting up and managing traditional databases required significant time and effort.
                        </p>
                    </div>
                </li>
                <li className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <Shield className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tree Structure</h3>
                        <p className="text-gray-700 dark:text-gray-300">
                            AxioDB's JSON-native approach allows for hierarchical tree structures, making data organization intuitive and efficient.
                        </p>
                    </div>
                </li>
                <li className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <Code className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Improved Data Structure & Algorithm Learning</h3>
                        <p className="text-gray-700 dark:text-gray-300">
                            Building AxioDB helped me deepen my understanding of data structures and algorithms, enhancing my problem-solving skills.
                        </p>
                    </div>
                </li>
                <li className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <Database className="h-6 w-6 text-teal-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Node.js File System I/O Operations</h3>
                        <p className="text-gray-700 dark:text-gray-300">
                            This project helped me gain hands-on experience with Node.js File System I/O operations, crucial for efficient file-based storage.
                        </p>
                    </div>
                </li>
                <li className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <Zap className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Node.js Streams</h3>
                        <p className="text-gray-700 dark:text-gray-300">
                            Implementing Node.js Streams in AxioDB allowed me to handle large datasets efficiently in real-world scenarios.
                        </p>
                    </div>
                </li>
                <li className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <Shield className="h-6 w-6 text-pink-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Memory Management with InMemoryCache</h3>
                        <p className="text-gray-700 dark:text-gray-300">
                            Designing the InMemoryCache strategy enhanced my understanding of memory management and optimization techniques.
                        </p>
                    </div>
                </li>
            </ul>

            {/* Stylized Signature */}
            <div className="absolute bottom-[-50px] right-0 text-right pr-4 pb-4">
                <p className="italic text-lg text-gray-700 dark:text-gray-300" style={{ fontFamily: "'Dancing Script', cursive" }}>
                    Ankan Saha
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Project Lead</p>
            </div>
        </section>
    );
};

export default PainPoints;
