export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6 text-slate-700 leading-relaxed">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Privacy Policy</h1>

      <p className="mb-4">
        At PrivacyStrip, we take your privacy seriously. This policy explains how we handle your data.
      </p>

      <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">1. Local Processing</h2>
      <p className="mb-4">
        PrivacyStrip is a client-side application. All file processing, including metadata analysis and removal,
        is performed entirely within your web browser. Your files are <strong>never</strong> uploaded to our
        servers or any third-party servers.
      </p>

      <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. Data Collection</h2>
      <p className="mb-4">
        We do not collect, store, or share any personal information or the content of the files you process.
        Since the processing happens locally, we have no access to your data.
      </p>

      <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">3. Third-Party Services</h2>
      <p className="mb-4">
        We use Google AdSense to display advertisements. Google may use cookies to serve ads based on your
        prior visits to our website or other websites. You can opt out of personalized advertising by visiting
        <a href="https://www.google.com/settings/ads" className="text-indigo-600 hover:underline">Google Ads Settings</a>.
      </p>

      <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">4. Cookies</h2>
      <p className="mb-4">
        We may use basic cookies for site functionality and to analyze traffic via standard web analytics,
        helping us improve the user experience.
      </p>

      <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">5. Contact</h2>
      <p className="mb-4">
        If you have any questions about this Privacy Policy, please contact us via our GitHub repository.
      </p>
    </div>
  );
}
