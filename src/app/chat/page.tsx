'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export default function ChatPage() {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Placeholder for key down handler
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // TODO: Handle message sending
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      {/* Message container */}
      <Card className="flex-1 mb-4">
        <CardContent className="h-full p-4">
          <div className="h-full overflow-y-auto">
            {/* Message bubbles will go here */}
            <div className="text-gray-500 text-center mt-8">
              No messages yet. Start a conversation!
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input area */}
      <div className="flex gap-2">
        <Textarea
          placeholder="Type your message here..."
          className="flex-1 min-h-[60px] max-h-[120px] resize-none"
          onKeyDown={handleKeyDown}
        />
        <Button className="self-end">Send</Button>
      </div>
    </div>
  );
}
