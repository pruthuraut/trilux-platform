'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Heading, Paragraph } from '@/components/ui/typography';
import { Copy } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'; // You can choose different themes
import withAuth from '@/utils/withAuth';

// Data for the unsafe functions
const data = [
  { name: 'eval()', value: 12 },
  { name: 'Function()', value: 8 },
  { name: 'setTimeout()', value: 15 },
  { name: 'setInterval()', value: 10 },
  { name: 'new Function()', value: 7 },
];

// Safe version implementations for each unsafe function
const safeVersions: { [key: string]: string } = {
  'eval()': `
    function safeEval(code) {
      try {
        return eval(code);
      } catch (err) {
        console.error('Error in safeEval:', err);
        return null;
      }
    }
  `,
  'Function()': `
    function safeFunction(code) {
      try {
        return new Function(code);
      } catch (err) {
        console.error('Error in safeFunction:', err);
        return null;
      }
    }
  `,
  'setTimeout()': `
    function safeSetTimeout(callback, delay, ...args) {
      try {
        return setTimeout(callback, delay, ...args);
      } catch (err) {
        console.error('Error in safeSetTimeout:', err);
        return null;
      }
    }
  `,
  'setInterval()': `
    function safeSetInterval(callback, delay, ...args) {
      try {
        return setInterval(callback, delay, ...args);
      } catch (err) {
        console.error('Error in safeSetInterval:', err);
        return null;
      }
    }
  `,
  'new Function()': `
    function safeNewFunction(code) {
      try {
        return new Function(code);
      } catch (err) {
        console.error('Error in safeNewFunction:', err);
        return null;
      }
    }
  `,
};

const UnsafeFunctionsPage: React.FC = () => {
  const [copiedFunction, setCopiedFunction] = useState<keyof typeof safeVersions | null>(null);

  const handleCopy = (functionName: keyof typeof safeVersions) => {
    navigator.clipboard.writeText(safeVersions[functionName]);
    setCopiedFunction(functionName);
  };

  return (
    <div className="bg-background text-foreground p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-7xl mx-auto">
        <CardHeader>
          <Heading size={2}>Unsafe Functions Dashboard</Heading>
        </CardHeader>
        <CardContent>
          <Paragraph className="mb-4 text-sm sm:text-base">
            This dashboard highlights the usage of potentially unsafe JavaScript functions in your codebase. These functions can
            introduce security vulnerabilities and should be used with caution.
          </Paragraph>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {data.map((item) => (
              <div key={item.name} className="flex flex-col rounded-lg overflow-hidden">
                {/* Unsafe Function Section */}
                <div className="border-2 border-red-500 text-red-500 p-4 rounded-lg transition duration-300 ease-in-out hover:shadow-lg">
                  <AlertTitle className="text-lg font-bold">{item.name}</AlertTitle>
                  <AlertDescription>
                    The {item.name} function can be used to execute arbitrary JavaScript code, which can lead to security vulnerabilities.
                    Consider using the following safe version instead:
                  </AlertDescription>
                </div>

                {/* Safe Version Section */}
                <div className="border-2 border-green-500 text-green-500 p-4 rounded-lg transition duration-300 ease-in-out hover:shadow-lg mt-2">
                  <AlertTitle className="text-lg font-bold">Safe Version</AlertTitle>
                  <div className="mt-2 rounded-md overflow-x-auto">
                    <SyntaxHighlighter language="javascript" style={vscDarkPlus}>
                      {safeVersions[item.name as keyof typeof safeVersions]}
                    </SyntaxHighlighter>
                    <button
                      className="ml-2 text-muted-foreground hover:text-primary-foreground mt-2"
                      onClick={() => handleCopy(item.name as keyof typeof safeVersions)}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            {/* <Button variant="secondary" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default withAuth(UnsafeFunctionsPage);
