'use client';

import { StreamingMarkdown } from '@/components/streaming-markdown';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Send, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, streamingContent]);

  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userInput.trim(),
    };

    // Add user message to the conversation
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setUserInput('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      // Prepare conversation history for API
      const conversationMessages = updatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Add streaming placeholder message
      const streamingMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        isStreaming: true,
      };

      setMessages((prev) => [...prev, streamingMessage]);

      // Read the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              // Finalize the message with complete content
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                  lastMessage.content = accumulatedContent;
                  lastMessage.isStreaming = false;
                }
                return newMessages;
              });
              setStreamingContent('');
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedContent += parsed.content;
                setStreamingContent(accumulatedContent);
              }
            } catch {
              // Skip invalid JSON
              continue;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      setMessages((prev) => [
        ...prev.slice(0, -1), // Remove the streaming placeholder
        {
          role: 'assistant',
          content:
            'Sorry, there was an error processing your message. Please try again.',
        },
      ]);
      setStreamingContent('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSendClick = () => {
    sendMessage();
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-2xl font-bold">MedicAI Chat</CardTitle>
              <Badge variant="secondary" className="text-xs">
                AI Assistant
              </Badge>
            </div>
            <ThemeToggle />
          </div>
        </CardHeader>
      </Card>

      {/* Message container */}
      <Card className="flex-1 mb-4">
        <CardContent className="h-full p-0">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-muted-foreground text-center mt-8">
                  <Bot className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Welcome to MedicAI</p>
                  <p>
                    Start a conversation about medical topics, symptoms, or
                    treatments.
                  </p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="bg-primary/10">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        message.isStreaming ? (
                          // Show streaming markdown content with progressive rendering
                          <StreamingMarkdown
                            content={streamingContent}
                            isComplete={false}
                          />
                        ) : (
                          // Show final content as rendered markdown
                          <StreamingMarkdown
                            content={message.content}
                            isComplete={true}
                          />
                        )
                      ) : (
                        <div className="whitespace-pre-wrap">
                          {message.content}
                        </div>
                      )}
                    </div>

                    {message.role === 'user' && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="bg-secondary">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}

              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="bg-primary/10">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Input area */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask about medical topics, symptoms, treatments..."
              className="flex-1 min-h-[60px] max-h-[120px] resize-none"
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <Button
              onClick={handleSendClick}
              disabled={isLoading || !userInput.trim()}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
