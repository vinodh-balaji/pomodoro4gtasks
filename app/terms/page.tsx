import React from 'react';

export const metadata = {
  title: 'Terms of Service | PomoSync',
  description: 'Terms of Service for PomoSync.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-xs border border-slate-200/80 space-y-6">
        <header className="border-b border-slate-100 pb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
          <p className="text-xs text-slate-400 mt-2 font-mono">Last updated: September 15, 2026</p>
        </header>

        <section className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or using PomoSync (&quot;Application&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Application.
          </p>

          <h2 className="text-lg font-bold text-slate-900 pt-2">2. Use of Services</h2>
          <p>
            PomoSync provides a Pomodoro focus timer and task synchronizer integrated with Google Tasks and Google Drive AppData. You agree to use the service in compliance with all applicable laws and regulations.
          </p>

          <h2 className="text-lg font-bold text-slate-900 pt-2">3. Google Account Integration</h2>
          <p>
            Authentication and task syncing rely on official Google APIs. You maintain full ownership of your Google data and may revoke access at any time through your Google Account security settings.
          </p>

          <h2 className="text-lg font-bold text-slate-900 pt-2">4. Disclaimer & Limitation of Liability</h2>
          <p>
            The Application is provided &quot;as is&quot; without warranties of any kind. We are not liable for any data loss resulting from network issues or third-party API service interruptions.
          </p>

          <h2 className="text-lg font-bold text-slate-900 pt-2">5. Contact Information</h2>
          <p>For support or questions regarding these terms, contact:</p>
          <p className="font-mono text-indigo-600 font-semibold bg-slate-100 p-3 rounded-xl inline-block">
            vinodh.balaji@gmail.com
          </p>
        </section>
      </div>
    </main>
  );
}