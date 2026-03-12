import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { ChevronRight, FileText, Shield, Scale } from "lucide-react";

const legalPages = {
  terms: {
    title: "Terms of Service",
    content: `
TERMS OF SERVICE

Last Updated: January 2026

1. ACCEPTANCE OF TERMS
By accessing or using Here & Now ("the App"), you agree to be bound by these Terms of Service.

2. ELIGIBILITY
You must be at least 18 years old to use this App. By using the App, you represent that you meet this age requirement.

3. USER ACCOUNTS
- You are responsible for maintaining the confidentiality of your account credentials
- You agree to provide accurate information when creating your account
- You are responsible for all activities under your account

4. ACCEPTABLE USE
You agree not to:
- Harass, threaten, or intimidate other users
- Share inappropriate, offensive, or illegal content
- Impersonate others or create fake accounts
- Use the App for any illegal purpose
- Attempt to circumvent safety features

5. PRIVACY
Your privacy is important to us. Please review our Privacy Policy for information on how we collect and use your data.

6. CONTENT
- You retain ownership of content you post
- By posting content, you grant us a license to display it within the App
- We may remove content that violates these terms

7. PAYMENTS & REFUNDS
- Premium subscriptions and token purchases are non-refundable
- Subscriptions auto-renew unless cancelled

8. TERMINATION
We may terminate your account for violations of these terms.

9. DISCLAIMER
THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.

10. LIMITATION OF LIABILITY
We are not liable for any indirect, incidental, or consequential damages.

11. CHANGES TO TERMS
We may modify these terms at any time. Continued use constitutes acceptance.

12. CONTACT
For questions about these terms, contact us through the App.
    `
  },
  privacy: {
    title: "Privacy Policy",
    content: `
PRIVACY POLICY

Last Updated: January 2026

1. INFORMATION WE COLLECT

Personal Information:
- Email address
- Display name
- Profile information you provide

Location Information:
- Approximate location when you check in (rounded for privacy)
- We do NOT store exact GPS coordinates
- We do NOT track your movement

Usage Information:
- App interactions
- Check-in history (venue names only)

2. HOW WE USE YOUR INFORMATION
- To provide the App's features
- To connect you with others at venues
- To improve the App experience
- To prevent abuse and ensure safety

3. INFORMATION SHARING
We do NOT:
- Sell your personal information
- Share exact location data
- Store location history

We may share:
- Anonymized, aggregated data for analytics
- Information required by law

4. YOUR PRIVACY CONTROLS
- Toggle visibility on/off
- Block other users
- Delete your account anytime

5. DATA SECURITY
We implement security measures to protect your data, including encryption and secure servers.

6. DATA RETENTION
- Account data: Until you delete your account
- Location data: Not stored (only used in real-time)
- Messages: Until you delete your account

7. CHILDREN'S PRIVACY
The App is not intended for users under 18.

8. CHANGES TO THIS POLICY
We may update this policy. Check back periodically.

9. CONTACT US
For privacy questions, contact us through the App.
    `
  },
  safety: {
    title: "Safety Guidelines",
    content: `
SAFETY GUIDELINES

Your safety is our priority. Please follow these guidelines:

MEETING OTHERS
- Meet in public places
- Tell a friend where you're going
- Trust your instincts
- Don't share personal information too quickly

REPORTING ISSUES
- Use the report feature for inappropriate behavior
- Block users who make you uncomfortable
- Contact authorities for serious concerns

PRIVACY TIPS
- Don't share your exact address
- Be cautious about sharing personal details
- Use the visibility toggle when needed

RED FLAGS
- Requests for money
- Pressure to share personal information
- Aggressive or threatening behavior
- Requests to move off the app immediately

REMEMBER
- You control your visibility
- You can block anyone at any time
- Trust your instincts

If you feel unsafe, leave the situation and report the user.
    `
  }
};

const Legal = () => {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState(null);

  if (activePage) {
    const page = legalPages[activePage];
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-6 pb-32" data-testid={`legal-${activePage}`}>
          <button
            onClick={() => setActivePage(null)}
            className="text-slate-400 hover:text-white mb-6 flex items-center gap-2"
            data-testid="back-btn"
          >
            ← Back to Legal
          </button>
          <h1 className="text-2xl font-bold text-white mb-6">{page.title}</h1>
          <div className="glass rounded-2xl p-6">
            <pre className="text-slate-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">
              {page.content.trim()}
            </pre>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-32" data-testid="legal-page">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Legal</h1>
          <p className="text-slate-400">Terms, policies, and safety information</p>
        </div>

        <div className="space-y-3">
          <button
            data-testid="terms-btn"
            onClick={() => setActivePage("terms")}
            className="w-full glass rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-white font-medium">Terms of Service</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>

          <button
            data-testid="privacy-btn"
            onClick={() => setActivePage("privacy")}
            className="w-full glass rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-white font-medium">Privacy Policy</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>

          <button
            data-testid="safety-btn"
            onClick={() => setActivePage("safety")}
            className="w-full glass rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Scale className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-white font-medium">Safety Guidelines</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Legal;
