import { AlertTriangle, Database, Lock, ShieldCheck, Users, Zap } from "lucide-react";
import React from "react";
import Seo from "../ui/Seo";

const Security: React.FC = () => {
  return (
    <section id="security" className="pt-12 scroll-mt-20">
      <Seo
        title="AxioDB Security - RBAC & Data Protection"
        description="RBAC authentication and security best practices for AxioDB's GUI and AxioDBCloud TCP server."
        path="/security"
      />
      <div className="relative overflow-hidden bg-gradient-to-br from-green-900/20 via-slate-800 to-blue-900/20 rounded-2xl p-8 lg:p-12 mb-12 border border-green-800 shadow-xl animate-fade-in">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold mb-6 flex items-center gap-2 bg-gradient-to-r from-green-700 via-blue-600 to-purple-700 bg-clip-text text-transparent">
            <ShieldCheck className="h-10 w-10 text-green-500" /> Security
          </h1>
          <p className="text-xl text-slate-300 font-light mb-8">
            AxioDB prioritizes data security with built-in features to protect
            your data—whether it's sensitive user info or critical business
            data.
          </p>
        </div>
      </div>

      {/* Animated Security Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="group relative bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-green-800 hover:border-blue-600 transform hover:-translate-y-1 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-8 w-8 text-purple-500" />
            <h3 className="text-lg font-bold text-purple-300">
              Secure Storage
            </h3>
          </div>
          <p className="text-gray-300">
            Data is stored in secure{" "}
            <code className="bg-gray-900 px-1 py-0.5 rounded">
              .axiodb
            </code>{" "}
            files, using a structured format to maintain integrity and prevent
            unauthorized access or corruption.
          </p>
        </div>
        <div className="group relative bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-green-800 hover:border-blue-600 transform hover:-translate-y-1 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-8 w-8 text-orange-500" />
            <h3 className="text-lg font-bold text-orange-300">
              InMemoryCache
            </h3>
          </div>
          <p className="text-gray-300">
            InMemoryCache improves performance and adds security by reducing
            disk reads, minimizing exposure of sensitive data.
          </p>
        </div>
      </div>

      {/* Security Diagram */}
      <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-xl p-8 shadow-lg mb-12 flex flex-col items-center">
        <h3 className="text-2xl font-bold mb-4 text-green-300">
          How AxioDB Secures Your Data
        </h3>
        <img
          src="https://raw.githubusercontent.com/AnkanSaha/AxioDB/main/Document/public/AXioDB.png"
          alt="AxioDB Security Diagram"
          className="w-64 h-64 object-contain mb-4"
        />
        <ul className="list-disc pl-6 text-lg text-slate-300 space-y-2">
          <li>File-level isolation and locking</li>
          <li>Configurable access controls</li>
          <li>Automatic cache invalidation for stale data</li>
        </ul>
      </div>

      {/* Control Server Authentication (RBAC) */}
      <div className="bg-gray-800 rounded-2xl p-8 shadow-lg border border-green-800 mb-8 animate-fade-in-up">
        <h3 className="text-xl font-bold mb-4 text-green-300 flex items-center gap-2">
          <Users className="h-6 w-6" /> Control Server Authentication (RBAC)
        </h3>
        <p className="text-gray-300 mb-4">
          The Control Server (the built-in web GUI at <code className="bg-gray-900 px-1 py-0.5 rounded">localhost:27018</code>) ships
          with login and role-based access control. On first start it seeds a reserved{" "}
          <code className="bg-gray-900 px-1 py-0.5 rounded">config</code> database (hidden from the regular
          database list and unreachable through the generic database/collection/document routes) holding three collections -{" "}
          <code className="bg-gray-900 px-1 py-0.5 rounded">users</code>,{" "}
          <code className="bg-gray-900 px-1 py-0.5 rounded">roles</code>, and{" "}
          <code className="bg-gray-900 px-1 py-0.5 rounded">permissions</code> - plus a default{" "}
          <code className="bg-gray-900 px-1 py-0.5 rounded">admin</code>/<code className="bg-gray-900 px-1 py-0.5 rounded">admin</code> account.
        </p>
        <ul className="space-y-2 list-disc pl-6 text-gray-300 mb-4">
          <li>
            <strong>Password hashing:</strong> Node&apos;s built-in <code className="bg-gray-900 px-1 py-0.5 rounded">crypto.scrypt</code>{" "}
            with a random per-user salt - no extra dependency, consistent with AxioDB&apos;s zero-native-dependency design.
          </li>
          <li>
            <strong>In-memory sessions only:</strong> Sessions live in a server-side memory map, never written to disk. A
            restart invalidates every session and forces everyone to log in again - this is by design, not a bug.
          </li>
          <li>
            <strong>Cookie is not the trust boundary:</strong> The session cookie only carries a random, unguessable session
            ID; the username/role are looked up server-side from the in-memory session map on every request, not trusted
            from the cookie itself.
          </li>
          <li>
            <strong>Forced password change:</strong> Every account, including the seeded <code className="bg-gray-900 px-1 py-0.5 rounded">admin</code>,
            must change its password on first login before any other action is permitted.
          </li>
          <li>
            <strong>Three predefined roles:</strong> <em>Super Admin</em> (full access, including user/role management),{" "}
            <em>Admin</em> (full database/collection/document access, no user/role management), and <em>View</em> (read-only).
            A Super Admin can create additional custom roles from the predefined permission catalogue.
          </li>
        </ul>
        <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg mb-4">
          <p className="text-gray-300 text-sm">
            <strong>This isn&apos;t GUI-only:</strong> AxioDBCloud&apos;s TCP server reuses this exact same{" "}
            <code className="bg-gray-900 px-1 py-0.5 rounded">config</code> database, accounts, and
            roles when started with <code className="bg-gray-900 px-1 py-0.5 rounded">TCPAuth: true</code> —
            one login system for both. TCP additionally enforces a shared per-IP rate limiter, rejects
            still-must-change-password accounts outright, and forces re-authentication on an open connection when
            an admin changes that user&apos;s password/role via the GUI. See{" "}
            <a href="/cloud" className="underline font-medium">AxioDBCloud &rarr; Advanced: TCP Authentication</a> for
            the full enforcement details.
          </p>
        </div>
        <div className="bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg flex items-start gap-2">
          <Lock className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-gray-300 text-sm">
            RBAC protects the Control Server&apos;s HTTP API and the TCP server alike, but both are still designed for
            trusted local/network access - not a substitute for network-level protections if you expose either
            beyond your own machine or private network. The TCP protocol itself is also unencrypted (no TLS).
          </p>
        </div>
      </div>

      <div className="bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg mb-8">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold">Security Best Practices</h3>
        </div>

        <ul className="space-y-2 list-disc pl-6 text-gray-300">
          <li>Use strong, unique credentials for each Control Server account</li>
          <li>Never hardcode passwords or secrets in your application code</li>
          <li>
            Consider using environment variables or a secure secret management
            system
          </li>
          <li>Implement proper application-level access controls</li>
          <li>Regularly backup your databases</li>
          <li>
            Keep your AxioDB version updated to benefit from security patches
          </li>
        </ul>
      </div>

      <p className="text-gray-300">
        For reporting security vulnerabilities or concerns, please refer to the{" "}
        <a
          href="#"
          className="text-blue-400 hover:text-blue-300"
        >
          SECURITY.md
        </a>{" "}
        file in the project repository.
      </p>
    </section>
  );
};

export default Security;
