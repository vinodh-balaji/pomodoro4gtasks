import React from 'react';

export const metadata = {
  title: 'Privacy Policy | Tasks \'n Timers',
  description: 'Privacy Policy, Data Protection, and Google API Usage for Tasks \'n Timers.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-xs border border-slate-200/80 space-y-6">
        <header className="border-b border-slate-100 pb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-slate-400 mt-2 font-mono">Last updated: September 24, 2026</p>
        </header>

        {/* Google API User Data Policy Compliance Notice */}
        <section className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-5 space-y-2">
          <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
            <span>🔒</span> Google API Services User Data Policy Compliance
          </h2>
          <p className="text-xs text-indigo-950 leading-relaxed font-medium">
            Tasks &apos;n Timers&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-indigo-700"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements. We do not sell, store on external application servers, or share your Google Tasks or Google Drive data with third parties.
          </p>
        </section>

        <section className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">1. Introduction & Overview</h2>
          <p>
            This Privacy Policy describes Our policies and procedures on the collection, use, and disclosure of Your information when You use Tasks &apos;n Timers (&quot;Service&quot;) and informs You about Your privacy rights.
          </p>

          <h2 className="text-lg font-bold text-slate-900 pt-2">2. Data We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Personal Data:</strong> Email address, first name, and last name provided during account connection.</li>
            <li><strong>Usage Data:</strong> Device IP address, operating system, browser type, and duration of activity collected automatically to optimize app performance.</li>
            <li><strong>Google Tasks & Drive Data:</strong> Processed strictly on-device to sync task items and back up focus session history inside your private Google Drive AppData folder.</li>
          </ul>

          <h2 className="text-lg font-bold text-slate-900 pt-2">3. Data Security & Protection Mechanisms</h2>
          <p>
            We implement strict technical and organizational security controls to protect your sensitive user data against unauthorized access, disclosure, or loss:
          </p>
          <ul className="list-disc pl-5 space-y-2 pt-1">
            <li>
              <strong>Data in Transit:</strong> All network communications between Tasks &apos;n Timers and Google APIs (Google Tasks and Google Drive) are encrypted in transit using industry-standard HTTPS / TLS (Transport Layer Security) protocols.
            </li>
            <li>
              <strong>Data at Rest:</strong> Tasks &apos;n Timers operates on a local-first architecture. Your task list preferences, timer settings, and session history are stored locally on your device. Any cloud backup data is stored in your private Google Drive <code>appDataFolder</code>, which is isolated and accessible only by you through the application. We do not store your tasks or personal data on external application servers.
            </li>
            <li>
              <strong>Data Retention & Deletion:</strong> You can delete your local application data at any time by logging out or clearing local app storage. Cloud backup data in your private Google Drive AppData folder can be managed or removed directly via your Google Account permissions settings.
            </li>
          </ul>

          <h2 className="text-lg font-bold text-slate-900 pt-2">4. Children&apos;s Privacy</h2>
          <p>
            Our Service is not directed to individuals under the age of 16. We do not knowingly collect personal information from children under 16.
          </p>

          <h2 className="text-lg font-bold text-slate-900 pt-2">5. Contact Us</h2>
          <p>
            If you have any questions regarding this Privacy Policy or our data protection practices, please contact us via email:
          </p>
          <p className="font-mono text-indigo-600 font-semibold bg-slate-100 p-3 rounded-xl inline-block">
            vinodh.balaji@gmail.com
          </p>
        </section>
      </div>
    </main>
  );
}