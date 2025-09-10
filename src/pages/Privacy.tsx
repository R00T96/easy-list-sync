import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, Shield, Eye, Clock, Users, Database, AlertTriangle } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container px-4 py-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to App
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Privacy Policy</h1>
        </div>
        <ThemeToggle />
      </header>

      {/* Content */}
      <main className="container px-4 py-8 max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <Shield className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h2 className="text-3xl font-bold mb-4">Simple, Anonymous, Public</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our shopping list app is designed to be completely anonymous and public by default. 
            Here's exactly what that means for your privacy.
          </p>
        </div>

        {/* Key Points */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Eye className="h-5 w-5" />
                What We DON'T Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>• No email addresses or personal information</p>
              <p>• No accounts, usernames, or passwords</p>
              <p>• No location tracking or GPS data</p>
              <p>• No contact list access</p>
              <p>• No social media connections</p>
              <p>• No payment information</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Database className="h-5 w-5" />
                What We DO Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>• Shopping list items (text, quantities)</p>
              <p>• Anonymous usage patterns</p>
              <p>• Device type and browser info</p>
              <p>• Session timestamps</p>
              <p>• PIN usage data (anonymized)</p>
            </CardContent>
          </Card>
        </div>

        {/* Warning Section */}
        <Card className="border-orange-200 dark:border-orange-800 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <AlertTriangle className="h-5 w-5" />
              Important: This App is Public by Design
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg">
              <p className="font-semibold mb-2">⚠️ Anyone with your PIN can access your list</p>
              <p className="text-sm text-muted-foreground">
                Lists are NOT private. If someone has your 4-digit PIN, they can view and modify your shopping list. 
                Only share PINs with people you trust.
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="font-semibold">What you share is YOUR responsibility:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Don't add personal information (addresses, phone numbers, etc.)</li>
                <li>• Don't include sensitive financial details</li>
                <li>• Don't share private family information</li>
                <li>• Remember: anyone with the PIN can see everything</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                How the App Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p><strong>PIN System:</strong> Lists are identified by 4-digit PINs. Anyone with the PIN can access the list.</p>
              <p><strong>Real-time Sync:</strong> Changes sync across all devices using the same PIN in real-time.</p>
              <p><strong>No Accounts:</strong> There are no user accounts. Everything is anonymous and temporary.</p>
              <p><strong>Local Storage:</strong> Your device temporarily stores list data for offline use.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Data Retention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p><strong>Shopping Lists:</strong> Stored indefinitely until manually deleted by users.</p>
              <p><strong>Usage Analytics:</strong> Anonymous usage patterns may be kept for improving the service.</p>
              <p><strong>Local Data:</strong> Cleared when you clear your browser data or switch devices.</p>
              <p><strong>No Backup:</strong> We don't backup your lists. If you lose your PIN, your list is gone.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Future Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p><strong>AI Suggestions:</strong> We plan to add anonymous AI-powered shopping suggestions based on usage patterns.</p>
              <p><strong>Event Streaming:</strong> Anonymous usage events may be analyzed to improve suggestions.</p>
              <p><strong>Always Anonymous:</strong> Any future features will maintain the same anonymous, privacy-first approach.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Legal & Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p><strong>Use at Your Own Risk:</strong> This app is provided "as is" without warranties of any kind.</p>
              <p><strong>No Security Guarantees:</strong> While we implement reasonable security measures, we cannot guarantee complete data security.</p>
              <p><strong>User Responsibility:</strong> You are responsible for what information you choose to share.</p>
              <p><strong>No Liability:</strong> We are not liable for any data loss, unauthorized access, or misuse of shared information.</p>
              <p><strong>Service Availability:</strong> We may discontinue the service at any time without notice.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact & Changes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p><strong>Questions:</strong> For privacy-related questions, please open an issue on our GitHub repository.</p>
              <p><strong>Policy Updates:</strong> This privacy policy may be updated. Continued use constitutes acceptance of changes.</p>
              <p><strong>Effective Date:</strong> This policy is effective as of the date you access the application.</p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to App
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}