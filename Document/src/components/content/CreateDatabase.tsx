import React from "react";
import CodeBlock from "../ui/CodeBlock";
import Seo from "../ui/Seo";

const CreateDatabase: React.FC = () => {
  const codeExamples = {
    defaultInstance: `
const { AxioDB } = require("axiodb");

// Create AxioDB instance with GUI enabled (most common)
const db = new AxioDB({ GUI: true });
console.log("AxioDB instance created with GUI at localhost:27018");
`,
    noGUI: `
// Create AxioDB instance without GUI
const db = new AxioDB({ GUI: false });
console.log("AxioDB instance created without GUI");
`,
    customName: `
// Create AxioDB instance with GUI and custom root folder name
const db = new AxioDB({ GUI: true, RootName: "MyCustomDB" });
console.log("Custom AxioDB instance created with GUI");
`,
    customRootPath: `
// Create AxioDB instance with GUI, custom name, and custom path
const db = new AxioDB({ GUI: true, RootName: "MyCustomDB", CustomPath: "./data" });
console.log("AxioDB instance with custom path created");
`,
    tcpAuth: `
// Create AxioDB instance with the TCP server enabled and authentication required
const db = new AxioDB({ TCP: true, TCPAuth: true, RootName: "MyCustomDB", CustomPath: "./data" });
console.log("AxioDB instance with authenticated TCP access created");
`,
    cacheTuning: `
// Tune the per-instance InMemoryCache: 10-30 minute randomized TTL, hourly cleanup
const db = new AxioDB({ Cache: true, minTTL: 10, maxTTL: 30, cacheClearUp: 3600 });

// Disable caching entirely (reads always hit disk)
const dbNoCache = new AxioDB({ Cache: false });
`,
    createDatabase: `
// Create databases under the current AxioDB instance
const userDB = await db.createDB("UsersDB");
console.log("Database 'UsersDB' created");

const productsDB = await db.createDB("ProductsDB");
console.log("Database 'ProductsDB' created");
`,
  };

  return (
    <section className="pt-12 scroll-mt-20">
      <Seo
        title="Create Database in AxioDB - Quick Start Guide"
        description="How to create and configure an AxioDB database instance, with GUI, custom root name, and custom path options."
        path="/create-database"
      />
      <h1 className="text-3xl font-bold mb-6">Create Database</h1>
      <p className="text-gray-600 mb-8">
        AxioDB constructor follows the pattern: <code className="bg-gray-100 px-2 py-1 rounded">new AxioDB(options)</code> where options is an object with <code className="bg-gray-100 px-2 py-1 rounded">&#123;GUI?, HTTP?, RootName?, CustomPath?, TCP?, TCPAuth?, AdminPassword?, TLS?, TLSCertPath?, TLSKeyPath?, Cache?, minTTL?, maxTTL?, cacheClearUp?&#125;</code>.
        This pattern provides better readability and flexibility.
      </p>

      <div className="bg-accent-100/20 border-l-4 border-accent-500 p-4 rounded-r-lg mb-8">
        <h3 className="font-semibold mb-2 text-accent-600">
          💡 Constructor Parameters
        </h3>
        <ul className="space-y-2 text-gray-600">
          <li><strong>GUI</strong> (boolean, optional): Enable web GUI on localhost:27018 - defaults to false</li>
          <li><strong>HTTP</strong> (boolean, optional): Enable HTTP API server on port 27018 - auto-enables when GUI is on; GUI: true + HTTP: false throws error</li>
          <li><strong>RootName</strong> (string, optional): Custom root folder name - defaults to "AxioDB"</li>
          <li><strong>CustomPath</strong> (string, optional): Custom storage path - defaults to current directory</li>
          <li><strong>TCP</strong> (boolean, optional): Enable the AxioDBCloud TCP server on port 27019 - defaults to false</li>
          <li><strong>TCPAuth</strong> (boolean, optional): Require username/password authentication (same RBAC users as the GUI) on TCP connections - defaults to false</li>
          <li><strong>AdminPassword</strong> (string, optional): Password the admin account is seeded with on first start, skipping the forced first-login change - defaults to the built-in admin/admin</li>
          <li><strong>TLS</strong> (boolean, optional): Encrypt the TCP server with TLS - requires TLSCertPath + TLSKeyPath PEM files - defaults to false</li>
          <li><strong>Cache</strong> (boolean, optional): Enable the per-instance InMemoryCache - defaults to true (set false to disable caching entirely)</li>
          <li><strong>minTTL</strong> (number, optional): Minimum randomized cache TTL in minutes - defaults to 5</li>
          <li><strong>maxTTL</strong> (number, optional): Maximum randomized cache TTL in minutes - defaults to 15</li>
          <li><strong>cacheClearUp</strong> (number, optional): Cache cleanup sweep interval in seconds - defaults to 86400</li>
        </ul>
      </div>

      <h3 className="text-2xl font-semibold mb-4">Setting the Admin Password (No GUI)</h3>
      <p className="text-gray-600 mb-4">
        On first start AxioDB seeds an <code className="bg-gray-100 px-2 py-1 rounded">admin/admin</code>{" "}
        account and flags it <code className="bg-gray-100 px-2 py-1 rounded">mustChangePassword: true</code>.{" "}
        The forced change can only be completed through the HTTP API or the GUI - so if you start
        the server with <code className="bg-gray-100 px-2 py-1 rounded">GUI: false</code> and{" "}
        <code className="bg-gray-100 px-2 py-1 rounded">TCPAuth: true</code>, there would be no way
        to choose a password and TCP would reject every login. Pass{" "}
        <code className="bg-gray-100 px-2 py-1 rounded">AdminPassword</code> to seed the account
        ready to use instead.
      </p>
      <CodeBlock
        code={`const db = new AxioDB({
  TCP: true,
  TCPAuth: true,
  GUI: false,
  AdminPassword: 'my-secret-password',
});

// admin / my-secret-password can log in over TCP immediately`}
        language="javascript"
      />
      <div className="bg-accent-100/20 border-l-4 border-accent-500 p-4 rounded-r-lg mb-8">
        <ul className="space-y-2 text-gray-600 text-sm">
          <li>
            <strong>One account, every surface.</strong> Embedded, HTTP, GUI, TCP and MCP all
            read the same <code>config</code> database, so this password is the same everywhere.
          </li>
          <li>
            <strong>First start only.</strong> The value is read solely when the{" "}
            <code>users</code> collection is created. Once your data directory exists, restarting
            never resets a password you have since changed.
          </li>
          <li>
            <strong>Opt-in.</strong> Omit it and the default <code>admin/admin</code> + forced
            change behaviour is exactly as before - no breaking change.
          </li>
          <li>
            <strong>Same option in the CLI and Docker.</strong>{" "}
            <code>axiodb serve tcp-auth &lt;password&gt;</code> and the{" "}
            <code>AXIODB_ADMIN_PASSWORD</code> environment variable both map to it.
          </li>
        </ul>
      </div>

      <h3 className="text-2xl font-semibold mb-4">Basic Instance (With GUI)</h3>
      <p className="text-gray-600 mb-4">
        Most common use case - enable the built-in GUI for data inspection.
      </p>
      <CodeBlock code={codeExamples.defaultInstance} language="javascript" />

      <h3 className="text-2xl font-semibold mt-8 mb-4">Instance Without GUI</h3>
      <p className="text-gray-600 mb-4">
        For production environments where you don't need the web interface.
      </p>
      <CodeBlock code={codeExamples.noGUI} language="javascript" />

      <h3 className="text-2xl font-semibold mt-8 mb-4">Custom Database Name</h3>
      <p className="text-gray-600 mb-4">
        Specify a custom root folder name for your database.
      </p>
      <CodeBlock code={codeExamples.customName} language="javascript" />

      <h3 className="text-2xl font-semibold mt-8 mb-4">Custom Storage Path</h3>
      <p className="text-gray-600 mb-4">
        Store database files in a specific directory.
      </p>
      <CodeBlock code={codeExamples.customRootPath} language="javascript" />

      <h3 className="text-2xl font-semibold mt-8 mb-4">TCP Server with Authentication</h3>
      <p className="text-gray-600 mb-4">
        Enable remote access via AxioDBCloud and require login before any TCP command is accepted.
      </p>
      <CodeBlock code={codeExamples.tcpAuth} language="javascript" />

      <h3 className="text-2xl font-semibold mt-8 mb-4">Cache Tuning</h3>
      <p className="text-gray-600 mb-4">
        Each instance owns an InMemoryCache. Tune its randomized TTL bounds and cleanup interval, or disable it entirely with <code className="bg-gray-100 px-2 py-1 rounded">Cache: false</code>.
      </p>
      <CodeBlock code={codeExamples.cacheTuning} language="javascript" />

      <h3 className="text-2xl font-semibold mt-8 mb-4">Create Multiple Databases</h3>
      <p className="text-gray-600 mb-4">
        Create multiple isolated databases within your AxioDB instance.
      </p>
      <CodeBlock code={codeExamples.createDatabase} language="javascript" />

      <div className="bg-yellow-100/20 border-l-4 border-yellow-500 p-4 rounded-r-lg mt-8">
        <h3 className="font-semibold mb-2 text-amber-700">
          ⚠️ Important Notes
        </h3>
        <ul className="space-y-2 text-gray-600 list-disc pl-6">
          <li>Only one AxioDB instance is allowed per application (singleton pattern)</li>
          <li>GUI runs on localhost:27018 and starts automatically when enabled</li>
          <li>Database files are stored in the root folder you specify</li>
          <li>Each database can contain multiple collections</li>
        </ul>
      </div>
    </section>
  );
};

export default CreateDatabase;
