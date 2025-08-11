/* eslint-disable no-unused-vars */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SchemaViewModal = ({ isOpen, onClose, schema, collectionName }) => {
  if (!isOpen) return null;

  // Function to get a readable type label with appropriate color
  const getTypeLabel = (type) => {
    const typeColors = {
      // Basic types
      string: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      number: 'bg-green-100 text-green-800 border-green-200',
      boolean: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      date: 'bg-purple-100 text-purple-800 border-purple-200',
      object: 'bg-blue-100 text-blue-800 border-blue-200',
      array: 'bg-pink-100 text-pink-800 border-pink-200',
      any: 'bg-gray-100 text-gray-800 border-gray-200',

      // Extended primitive types
      binary: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      symbol: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
      func: 'bg-rose-100 text-rose-800 border-rose-200',
      function: 'bg-rose-100 text-rose-800 border-rose-200',
      alternatives: 'bg-amber-100 text-amber-800 border-amber-200',
      link: 'bg-sky-100 text-sky-800 border-sky-200',

      // String specialized types
      uuid: 'bg-violet-100 text-violet-800 border-violet-200',
      guid: 'bg-violet-100 text-violet-800 border-violet-200',
      email: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      uri: 'bg-blue-100 text-blue-800 border-blue-200',
      url: 'bg-blue-100 text-blue-800 border-blue-200',
      hostname: 'bg-teal-100 text-teal-800 border-teal-200',
      ip: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      alphanum: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      token: 'bg-purple-100 text-purple-800 border-purple-200',
      hex: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
      base64: 'bg-blue-100 text-blue-800 border-blue-200',

      // Number specialized types
      integer: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      float: 'bg-green-100 text-green-800 border-green-200',
      precision: 'bg-lime-100 text-lime-800 border-lime-200',
      port: 'bg-teal-100 text-teal-800 border-teal-200',

      // Object specialized types
      pattern: 'bg-blue-100 text-blue-800 border-blue-200',
      schema: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      instance: 'bg-violet-100 text-violet-800 border-violet-200',
      ref: 'bg-amber-100 text-amber-800 border-amber-200',

      // Array specialized types
      items: 'bg-pink-100 text-pink-800 border-pink-200',
      ordered: 'bg-rose-100 text-rose-800 border-rose-200',
      tuple: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',

      // Advanced types
      lazy: 'bg-purple-100 text-purple-800 border-purple-200',
      custom: 'bg-red-100 text-red-800 border-red-200',
      extensions: 'bg-amber-100 text-amber-800 border-amber-200'
    };

    // Handle compound types (e.g., "string.email")
    if (type && type.includes('.')) {
      const parts = type.split('.');
      const baseType = parts[0];
      const subType = parts[1];

      // If we have a specific color for the subtype, use it
      if (typeColors[subType]) {
        return (
          <span className={`px-2 py-1 rounded-md text-xs font-medium border ${typeColors[subType]}`}>
            {type}
          </span>
        );
      }

      // Fall back to base type if available
      if (typeColors[baseType]) {
        return (
          <span className={`px-2 py-1 rounded-md text-xs font-medium border ${typeColors[baseType]}`}>
            {type}
          </span>
        );
      }
    }

    const color = typeColors[type] || typeColors.any;

    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${color}`}>
        {type}
      </span>
    );
  };

  // Function to get validation rules in a readable format
  const getValidationRules = (rules) => {
    if (!rules || !rules.length) return null;

    return (
      <div className="mt-2">
        <h6 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Validations</h6>
        <ul className="space-y-1">
          {rules.map((rule, index) => {
            let ruleText = rule.name;

            // Format args based on rule type
            if (rule.args) {
              if (rule.name === 'min' || rule.name === 'max' || rule.name === 'length') {
                ruleText += `: ${rule.args.limit}`;
              } else if (rule.name === 'email') {
                ruleText = 'must be a valid email';
              } else if (rule.name === 'pattern') {
                ruleText = `matches pattern: ${rule.args.regex}`;
              } else if (typeof rule.args === 'object') {
                try {
                  ruleText += `: ${JSON.stringify(rule.args)}`;
                } catch (e) {
                  // fallback if can't stringify
                  ruleText += ': has constraints';
                }
              }
            }

            return (
              <li key={index} className="flex items-center text-xs text-gray-600 pl-2 border-l-2 border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {ruleText}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  // Function to render a schema field
  const renderSchemaField = (fieldName, fieldSchema) => {
    let fieldType = fieldSchema.type || 'any';
    let required = fieldSchema._flags?.presence === 'required';

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        key={fieldName}
        className="mb-5 bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="font-bold text-gray-800 mr-2">{fieldName}</span>
              {required && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full border border-red-200">
                  required
                </span>
              )}
            </div>
            {getTypeLabel(fieldType)}
          </div>

          {getValidationRules(fieldSchema._rules)}

          {/* Show additional properties if available */}
          {fieldSchema._flags && Object.keys(fieldSchema._flags).length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <h6 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Properties</h6>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(fieldSchema._flags).map(([key, value]) => (
                  key !== 'presence' && (
                    <div key={key} className="text-xs text-gray-600">
                      <span className="font-medium">{key}:</span> {String(value)}
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Display any nested objects if they exist */}
          {fieldType === 'object' && fieldSchema.keys && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <h6 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Nested Fields</h6>
              <div className="pl-4 border-l-2 border-indigo-100">
                {Object.entries(fieldSchema.keys).map(([nestedKey, nestedSchema]) =>
                  renderSchemaField(nestedKey, nestedSchema)
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center backdrop-filter backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-gray-50 rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Collection Schema</span>
                <span className="ml-2 text-blue-600 font-normal">
                  <span className="mx-1">·</span> {collectionName}
                </span>
              </h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 focus:outline-none bg-white rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow">
              <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md text-blue-700 flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium mb-1">Schema Validation</p>
                  <p className="text-sm">This collection uses schema validation. Documents must conform to the structure defined below before they can be inserted.</p>
                </div>
              </div>

              {Object.keys(schema).length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-medium text-gray-800">Schema Fields</h4>
                    <span className="text-sm text-gray-500">{Object.keys(schema).length} fields defined</span>
                  </div>

                  {Object.entries(schema).map(([fieldName, fieldSchema]) =>
                    renderSchemaField(fieldName, fieldSchema)
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 mb-2 text-lg">No schema fields defined</p>
                  <p className="text-gray-400 text-sm">This collection has schema validation enabled but no fields are specified.</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-white flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm flex items-center"
              >
                <span>Close</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SchemaViewModal;
