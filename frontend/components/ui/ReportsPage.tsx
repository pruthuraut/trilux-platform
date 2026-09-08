'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Card, CardHeader, CardContent } from '../../components/ui/card';
import { Heading, Paragraph } from '../../components/ui/typography';
import { Button } from '../../components/ui/button';

interface Report {
  id: number;
  title: string;
  summary: string;
}

const reportsData: Report[] = [
  { id: 1, title: 'LLM Performance Analysis', summary: 'A detailed analysis of LLM performance metrics.' },
  { id: 2, title: 'Data Usage Report', summary: 'Insights on data usage trends for the LLM.' },
  { id: 3, title: 'Training Time Analysis', summary: 'Analysis of training time and resource usage.' },
  { id: 4, title: 'Inference Speed Analysis', summary: 'Evaluation of inference speed across various models.' },
  // Add more reports as needed
];

const ReportsPage: React.FC = () => {
  const router = useRouter();

  const handleViewDetail = (reportId: number) => {
    // Navigate to the detailed report page
    router.push(`/reports/${reportId}`);
  };

  return (
    <div className="bg-background text-foreground p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-7xl mx-auto">
        <CardHeader>
          <Heading size={2}>LLM Reports</Heading>
        </CardHeader>
        <CardContent>
          <Paragraph className="mb-4 text-sm sm:text-base">
            Below is a list of reports analyzing the performance and behavior of our Language Models.
          </Paragraph>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportsData.map((report) => (
              <Card key={report.id} className="cursor-pointer" onClick={() => handleViewDetail(report.id)}>
                <CardHeader>
                  <Heading size={3}>{report.title}</Heading>
                </CardHeader>
                <CardContent>
                  <Paragraph>{report.summary}</Paragraph>
                  <Button variant="default" className="mt-2">
                    View Detail
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
