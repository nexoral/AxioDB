import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import CodeBlock from '../ui/CodeBlock';
import Button from '../ui/Button';

const Usage: React.FC = () => {
  const [step, setStep] = useState<'selectCodeType' | 'selectExampleType' | 'showExample'>('selectCodeType');
  const [codeType, setCodeType] = useState<'commonjs' | 'es6' | null>(null);
  const [exampleType, setExampleType] = useState<'read' | 'write' | 'update' | 'delete' | 'aggregate' | 'fastRetrieval' | null>(null);

  const examples = {
    commonjs: {
      read: `const documents = await collection.query({ age: { $gt: 20 } }).exec();
console.log(documents);`,
      write: `const saveStatus = await collection.insert({ name: "Ankan", age: 21, email: "ankan@example.com" });
console.log(saveStatus);`,
      update: `const updatedDocuments = await collection.update({ name: { $regex: "Ankan" } }).UpdateOne({ name: "Ankan Saha", age: 22 });
console.log(updatedDocuments);`,
      delete: `const deletedDocuments = await collection.delete({ name: { $regex: "Ankan" } }).deleteOne();
console.log(deletedDocuments);`,
      aggregate: `const response = await collection.aggregate([
  { $match: { age: { $gt: 20 }, name: { $regex: "Ankan" } } }, // Filter documents
  { $group: { _id: "$age", count: { $sum: 1 } } }, // Group by age and count occurrences
  { $sort: { count: -1 } }, // Sort by count in descending order
  { $project: { _id: 0, age: "$_id", count: 1 } }, // Project specific fields
  { $limit: 10 }, // Limit the number of results
  { $skip: 0 } // Skip a certain number of results
]).exec();
console.log(response);`,
      fastRetrieval: `// Retrieve a single document by documentId
const singleDocument = await collection.query({ documentId: "S4ACDVS6SZ4S6VS" }).exec();
console.log(singleDocument);

// Retrieve multiple documents by an array of documentIds
const multipleDocuments = await collection.query({ documentId: ["S4ACDVS6SZ4S6VS", "S4ACDVS6SZ4S6VA"] }).exec();
console.log(multipleDocuments);

// Retrieve documents with additional filters
const filteredDocuments = await collection.query({
  documentId: ["S4ACDVS6SZ4S6VS", "S4ACDVS6SZ4S6VA"],
  age: { $gt: 20 }
}).exec();
console.log(filteredDocuments);

// Retrieve documents with projection
const projectedDocuments = await collection.query({
  documentId: ["S4ACDVS6SZ4S6VS", "S4ACDVS6SZ4S6VA"]
}).setProject({ name: 1, age: 1 }).exec();
console.log(projectedDocuments);

// Retrieve documents with sorting
const sortedDocuments = await collection.query({
  documentId: ["S4ACDVS6SZ4S6VS", "S4ACDVS6SZ4S6VA"]
}).Sort({ age: -1 }).exec();
console.log(sortedDocuments);

// Retrieve documents with pagination
const paginatedDocuments = await collection.query({
  documentId: ["S4ACDVS6SZ4S6VS", "S4ACDVS6SZ4S6VA"]
}).Limit(2).Skip(1).exec();
console.log(paginatedDocuments);`,
    },
    es6: {
      read: `const documents = await collection.query({ age: { $gt: 20 } }).exec();
console.log(documents);`,
      write: `const saveStatus = await collection.insert({ name: "Ankan", age: 21, email: "ankan@example.com" });
console.log(saveStatus);`,
      update: `const updatedDocuments = await collection.update({ name: { $regex: "Ankan" } }).UpdateOne({ name: "Ankan Saha", age: 22 });
console.log(updatedDocuments);`,
      delete: `const deletedDocuments = await collection.delete({ name: { $regex: "Ankan" } }).deleteOne();
console.log(deletedDocuments);`,
      aggregate: `const response = await collection.aggregate([
  { $match: { age: { $gt: 20 }, name: { $regex: "Ankan" } } }, // Filter documents
  { $group: { _id: "$age", count: { $sum: 1 } } }, // Group by age and count occurrences
  { $sort: { count: -1 } }, // Sort by count in descending order
  { $project: { _id: 0, age: "$_id", count: 1 } }, // Project specific fields
  { $limit: 10 }, // Limit the number of results
  { $skip: 0 } // Skip a certain number of results
]).exec();
console.log(response);`,
      fastRetrieval: `// Retrieve a single document by documentId
const singleDocument = await collection.query({ documentId: "S4ACDVS6SZ4S6VS" }).exec();
console.log(singleDocument);

// Retrieve multiple documents by an array of documentIds
const multipleDocuments = await collection.query({ documentId: ["S4ACDVS6SZ4S6VS", "S4ACDVS6SZ4S6VA"] }).exec();
console.log(multipleDocuments);

// Retrieve documents with additional filters
const filteredDocuments = await collection.query({
  documentId: ["S4ACDVS6SZ4S6VS", "S4ACDVS6SZ4S6VA"],
  age: { $gt: 20 }
}).exec();
console.log(filteredDocuments);

// Retrieve documents with projection
const projectedDocuments = await collection.query({
  documentId: ["S4ACDVS6SZ4S6VS", "S4ACDVS6SZ4S6VA"]
}).setProject({ name: 1, age: 1 }).exec();
console.log(projectedDocuments);

// Retrieve documents with sorting
const sortedDocuments = await collection.query({
  documentId: ["S4ACDVS6SZ4S6VS", "S4ACDVS6SZ4S6VA"]
}).Sort({ age: -1 }).exec();
console.log(sortedDocuments);

// Retrieve documents with pagination
const paginatedDocuments = await collection.query({
  documentId: ["S4ACDVS6SZ4S6VS", "S4ACDVS6SZ4S6VA"]
}).Limit(2).Skip(1).exec();
console.log(paginatedDocuments);`,
    },
  };

  return (
    <section id="usage" className="pt-12 scroll-mt-20">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <BookOpen className="h-8 w-8 text-green-500" />
        Basic Usage
      </h2>

      {step === 'selectCodeType' && (
        <div className="flex flex-col items-center">
          <p className="text-gray-700 dark:text-gray-300 mb-4">Select the code type you want to see:</p>
          <div className="flex gap-4">
            <Button variant="primary" onClick={() => { setCodeType('commonjs'); setStep('selectExampleType'); }}>
              CommonJS
            </Button>
            <Button variant="primary" onClick={() => { setCodeType('es6'); setStep('selectExampleType'); }}>
              ES6 Modules
            </Button>
          </div>
        </div>
      )}

      {step === 'selectExampleType' && (
        <div className="flex flex-col items-center">
          <p className="text-gray-700 dark:text-gray-300 mb-4">Select the example usage you want to see:</p>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => { setExampleType('read'); setStep('showExample'); }}>Read</Button>
            <Button variant="outline" onClick={() => { setExampleType('write'); setStep('showExample'); }}>Write</Button>
            <Button variant="outline" onClick={() => { setExampleType('update'); setStep('showExample'); }}>Update</Button>
            <Button variant="outline" onClick={() => { setExampleType('delete'); setStep('showExample'); }}>Delete</Button>
            <Button variant="outline" onClick={() => { setExampleType('aggregate'); setStep('showExample'); }}>Aggregate</Button>
            <Button variant="outline" onClick={() => { setExampleType('fastRetrieval'); setStep('showExample'); }}>Fast Retrieval</Button>
          </div>
        </div>
      )}

      {step === 'showExample' && codeType && exampleType && (
        <div className="flex flex-col items-center">
          <p className="text-gray-700 dark:text-gray-300 mb-4">Here is the {exampleType} example for {codeType}:</p>
          <CodeBlock code={examples[codeType][exampleType]} language="javascript" />
          <Button variant="outline" className="mt-4" onClick={() => setStep('selectExampleType')}>
            Back to Example Selection
          </Button>
        </div>
      )}
    </section>
  );
};

export default Usage;