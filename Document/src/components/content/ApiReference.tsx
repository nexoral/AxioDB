import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react';

interface ApiSection {
  title: string;
  methods: ApiMethod[];
}

interface ApiMethod {
  name: string;
  signature: string;
  description: string;
  example?: string;
  returns: string;
}

const ApiReference: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedMethods, setExpandedMethods] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const toggleMethod = (method: string) => {
    setExpandedMethods(prev => 
      prev.includes(method)
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };
  
  const apiSections: ApiSection[] = [
    {
      title: "AxioDB",
      methods: [
        {
          name: "createDB",
          signature: "createDB(dbName: string): Promise<Database>",
          description: "Creates a new database with the specified name.",
          example: "const db1 = await db.createDB('myDatabase');",
          returns: "Promise<Database>: A promise that resolves to a Database instance."
        },
        {
          name: "deleteDatabase",
          signature: "deleteDatabase(dbName: string): Promise<SuccessInterface | ErrorInterface>",
          description: "Deletes an existing database by name.",
          example: "const result = await db.deleteDatabase('myDatabase');",
          returns: "Promise<SuccessInterface | ErrorInterface>: A promise that resolves to a success or error object."
        },
      ]
    },
    {
      title: "Database",
      methods: [
        {
          name: "createCollection",
          signature: "createCollection(name: string, schema: object, crypto?: boolean, key?: string): Promise<Collection>",
          description: "Creates a new collection with an optional schema and encryption.",
          example: "const collection = await db1.createCollection('users', userSchema, true, 'secretKey');",
          returns: "Promise<Collection>: A promise that resolves to a Collection instance."
        },
        {
          name: "deleteCollection",
          signature: "deleteCollection(name: string): Promise<SuccessInterface | ErrorInterface>",
          description: "Deletes an existing collection by name.",
          example: "const result = await db1.deleteCollection('users');",
          returns: "Promise<SuccessInterface | ErrorInterface>: A promise that resolves to a success or error object."
        },
        {
          name: "getCollectionInfo",
          signature: "getCollectionInfo(): Promise<SuccessInterface>",
          description: "Retrieves information about all collections in the database.",
          example: "const info = await db1.getCollectionInfo();",
          returns: "Promise<SuccessInterface>: A promise that resolves to a success object with collection information."
        },
      ]
    },
    {
      title: "Collection",
      methods: [
        {
          name: "insert",
          signature: "insert(data: object): Promise<SuccessInterface | ErrorInterface>",
          description: "Inserts a document into the collection.",
          example: "const result = await collection.insert({ name: 'John', age: 30 });",
          returns: "Promise<SuccessInterface | ErrorInterface>: A promise that resolves to a success or error object."
        },
        {
          name: "query",
          signature: "query(query: object): Reader",
          description: "Initiates a query operation on the collection.",
          example: "const query = collection.query({ age: { $gt: 25 } });",
          returns: "Reader: A Reader instance for chaining query operations."
        },
        {
          name: "update",
          signature: "update(query: object): Updater",
          description: "Initiates an update operation on the collection.",
          example: "const updater = collection.update({ name: 'John' });",
          returns: "Updater: An Updater instance for chaining update operations."
        },
        {
          name: "delete",
          signature: "delete(query: object): Deleter",
          description: "Initiates a delete operation on the collection.",
          example: "const deleter = collection.delete({ age: { $lt: 18 } });",
          returns: "Deleter: A Deleter instance for chaining delete operations."
        },
        {
          name: "aggregate",
          signature: "aggregate(pipeline: object[]): Aggregation",
          description: "Initiates an aggregation operation on the collection.",
          example: "const agg = collection.aggregate([{ $match: { age: { $gt: 25 } } }]);",
          returns: "Aggregation: An Aggregation instance for chaining aggregation operations."
        },
      ]
    },
    {
      title: "Reader",
      methods: [
        {
          name: "Limit",
          signature: "Limit(limit: number): Reader",
          description: "Sets a limit on the number of documents to return.",
          example: "const query = collection.query({}).Limit(10);",
          returns: "Reader: The Reader instance for chaining."
        },
        {
          name: "Skip",
          signature: "Skip(skip: number): Reader",
          description: "Sets the number of documents to skip.",
          example: "const query = collection.query({}).Skip(10);",
          returns: "Reader: The Reader instance for chaining."
        },
        {
          name: "Sort",
          signature: "Sort(sort: object): Reader",
          description: "Sets the sort order for the query results.",
          example: "const query = collection.query({}).Sort({ age: -1 });",
          returns: "Reader: The Reader instance for chaining."
        },
        {
          name: "setCount",
          signature: "setCount(count: boolean): Reader",
          description: "Sets whether to return the count of documents.",
          example: "const query = collection.query({}).setCount(true);",
          returns: "Reader: The Reader instance for chaining."
        },
        {
          name: "setProject",
          signature: "setProject(project: object): Reader",
          description: "Sets the projection for the query results.",
          example: "const query = collection.query({}).setProject({ name: 1, age: 1 });",
          returns: "Reader: The Reader instance for chaining."
        },
        {
          name: "exec",
          signature: "exec(): Promise<SuccessInterface | ErrorInterface>",
          description: "Executes the query and returns the results.",
          example: "const results = await collection.query({}).exec();",
          returns: "Promise<SuccessInterface | ErrorInterface>: A promise that resolves to a success or error object."
        },
      ]
    },
  ];

  return (
    <section id="api-reference" className="pt-12 scroll-mt-20">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <BookOpen className="h-8 w-8 text-blue-500" />
        API Reference
      </h2>
      
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        This comprehensive API reference documents all the classes, methods, and interfaces available in AxioDB.
      </p>
      
      <div className="space-y-6">
        {apiSections.map((section) => (
          <div key={section.title} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
            <button
              className="flex items-center justify-between w-full p-4 text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => toggleSection(section.title)}
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{section.title}</h3>
              {expandedSections.includes(section.title) ? 
                <ChevronDown size={20} className="text-gray-500" /> : 
                <ChevronRight size={20} className="text-gray-500" />
              }
            </button>
            
            {expandedSections.includes(section.title) && (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {section.methods.map((method) => (
                  <div key={`${section.title}-${method.name}`} className="p-4">
                    <button
                      className="flex items-center justify-between w-full text-left mb-2"
                      onClick={() => toggleMethod(`${section.title}-${method.name}`)}
                    >
                      <div className="flex items-center">
                        <span className="font-mono text-blue-600 dark:text-blue-400 font-medium">{method.name}</span>
                      </div>
                      {expandedMethods.includes(`${section.title}-${method.name}`) ? 
                        <ChevronDown size={16} className="text-gray-500" /> : 
                        <ChevronRight size={16} className="text-gray-500" />
                      }
                    </button>
                    
                    <div className={`overflow-hidden transition-all duration-300 ${
                      expandedMethods.includes(`${section.title}-${method.name}`) ? 'max-h-[500px]' : 'max-h-0'
                    }`}>
                      <div className="pt-2 space-y-3">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Signature</h4>
                          <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded-md overflow-x-auto">
                            <code className="text-sm font-mono">{method.signature}</code>
                          </pre>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Description</h4>
                          <p className="text-gray-700 dark:text-gray-300">{method.description}</p>
                        </div>
                        
                        {method.example && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Example</h4>
                            <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded-md overflow-x-auto">
                              <code className="text-sm font-mono">{method.example}</code>
                            </pre>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Returns</h4>
                          <p className="text-gray-700 dark:text-gray-300">{method.returns}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <p className="text-gray-700 dark:text-gray-300">
          This API reference is continuously updated. For the most up-to-date information, refer to the official AxioDB documentation.
        </p>
      </div>
    </section>
  );
};

export default ApiReference;