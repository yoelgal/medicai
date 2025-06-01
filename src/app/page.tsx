import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              MedicAI
            </h1>
          </div>
          <ThemeToggle />
        </header>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            AI-Powered Medical Assistant
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Get instant medical information and guidance from our advanced AI
            assistant. Ask questions about symptoms, treatments, and health
            topics.
          </p>
          <Link href="/chat">
            <Button size="lg" className="text-lg px-8 py-3">
              Start Chat Session
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🩺</span>
                <span>Medical Expertise</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Access comprehensive medical knowledge and get answers to your
                health questions
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>💬</span>
                <span>Real-time Chat</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Engage in natural conversations with streaming responses for
                immediate assistance
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🔒</span>
                <span>Privacy First</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Your conversations are private and secure. No personal data is
                stored permanently
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Ready to Get Started?</CardTitle>
              <CardDescription>
                Begin your conversation with our medical AI assistant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Link href="/chat">
                  <Button size="lg" className="w-full">
                    Launch MedicAI Chat
                  </Button>
                </Link>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <strong>Disclaimer:</strong> This AI assistant provides
                  general information only. Always consult healthcare
                  professionals for medical advice.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
