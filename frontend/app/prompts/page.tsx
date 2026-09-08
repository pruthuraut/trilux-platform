// app/prompts/page.tsx
import React from 'react';
import { Heading, Paragraph } from '@/components/ui/typography';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface Prompt {
  id: number;
  type: 'safe' | 'unsafe';
  content: string;
  description: string;
}

const promptsData: Prompt[] = [
  {
    id: 1,
    type: 'safe',
    content: 'Write a short story about a friendly dragon.',
    description: 'This prompt encourages creativity and positive storytelling, making it suitable for all audiences.'
  },
  {
    id: 2,
    type: 'safe',
    content: 'Generate a recipe for a healthy smoothie.',
    description: 'A great prompt for health-conscious users looking to explore nutritious options.'
  },
  {
    id: 3,
    type: 'unsafe',
    content: 'Create a detailed plan for hacking a secure system.',
    description: 'This prompt is considered unsafe as it promotes illegal activities and could lead to malicious actions.'
  },
  {
    id: 4,
    type: 'unsafe',
    content: 'Write a convincing argument for committing fraud.',
    description: 'Encourages unethical behavior and is not suitable for responsible use of LLMs.'
  },
];

const PromptsPage: React.FC = () => {
  return (
    <div className="text-gray-900 dark:text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Heading size={2} className="text-center mb-8">LLM Prompts</Heading>
        <Paragraph className="text-center mb-8 text-lg">
          Below are examples of safe and unsafe prompts for Language Learning Models.
        </Paragraph>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {promptsData.map((prompt) => (
            <Card 
              key={prompt.id} 
              className={`border rounded-lg shadow-md ${prompt.type === 'safe' ? 'border-green-500' : 'border-red-500'} transition-transform hover:scale-105`}
            >
              <CardHeader>
                <Heading size={3} className="text-center text-xl">{prompt.type === 'safe' ? 'Safe Prompt' : 'Unsafe Prompt'}</Heading>
              </CardHeader>
              <CardContent>
                <Paragraph className="text-lg mb-2"><strong>Prompt:</strong> {prompt.content}</Paragraph>
                <Paragraph className="text-gray-600 dark:text-gray-400">{prompt.description}</Paragraph>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromptsPage;
