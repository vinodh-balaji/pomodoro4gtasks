import React from 'react';

export const metadata = {
  title: 'Privacy Policy | PomoSync',
  description: 'Privacy Policy and Google API Data Usage for PomoSync.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-xs border border-slate-200/80 space-y-6">
        <header className="border-b border-slate-100 pb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-slate-400 mt-2 font-mono">Last updated: September 15, 2026</p>
        </header>

        {/* Google API User Data Policy Compliance Notice */}
        <section className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-5 space-y-2">
          <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
            <span>🔒</span> Google API Services User Data Policy Compliance
          </h2>
          <p className="text-xs text-indigo-950 leading-relaxed font-medium">
            PomoSync&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-indigo-700"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements. We do not sell, store on external servers, or share your Google Tasks or Google Drive data with third parties.
          </p>
        </section>

        <section className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">1. Introduction & Overview</h2>
          <p>
            This Privacy Policy describes Our policies and procedures on the collection, use, and disclosure of Your information when You use PomoSync - Focus Timer & Task Sync (&quot;Service&quot;) and informs You about Your privacy rights.
          </p>

          <h2 className="text-lg font-bold text-slate-900 pt-2">2. Data We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Personal Data:</strong> Email address, first name, and last name provided during account connection.</li>
            <li><strong>Usage Data:</strong> Device IP address, operating system, browser type, and duration of activity collected automatically to optimize app performance.</li>
            <li><strong>Google Tasks & Drive Data:</strong> Processed strictly on-device to sync task items and back up focus session history inside your private Google Drive AppData folder.</li>
          </ul>

          <h2 className="text-lg font-bold text-slate-900 pt-2">3. Retention & Security</h2>
          <p>
            We retain your data only for as long as necessary to fulfill the services outlined. Local session logs and application state can be cleared by logging out or uninstalling the app. We apply strict security controls to protect your personal information.
          </p>

          <h2 className="text-lg font-bold text-slate-900 pt-2">4. Children&apos;s Privacy</h2>
          <p>
            Our Service is not directed to individuals under the age of 16. We do not knowingly collect personal information from children under 16.
          </p>

          <h2 className="text-lg font-bold text-slate-900 pt-2">5. Contact Us</h2>
          <p>
            If you have any questions regarding this Privacy Policy, please contact us via email:
          </p>
          <p className="font-mono text-indigo-600 font-semibold bg-slate-100 p-3 rounded-xl inline-block">
            vinodh.balaji@gmail.com
          </p>
        </section>
      </div>
    </main>
  );
}