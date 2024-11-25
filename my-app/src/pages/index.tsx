import React, { useState } from 'react';
import InteractiveSteps, { PlaygroundStep } from '@/components/PlaygroundSteps';
import { startBrowserBase, endWebagentSession } from '@/services/webagentService';
import { WebAgentRequestBody, runInitialSteps, runAdditionalSteps } from '@/services/webagentService';
import { Container, Grid, Paper, ScrollArea } from '@mantine/core';

export const generateRandomString = (length: number) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

interface BrowserSession {
  live_browser_url: string;
  session_id: string;
}

export default function PlaygroundPage() {
  const [browserUrl, setBrowserUrl] = useState('');
  const [processId, setProcessId] = useState('');
  const [intermediarySteps, setIntermediarySteps] = useState<PlaygroundStep[]>([]);
  const [browserSession, setBrowserSession] = useState<BrowserSession | null>(null);

  const initializeBrowserSession = async () => {
    try {
      // Without storage state
      const session = await startBrowserBase();
      setBrowserSession(session);
      setBrowserUrl(session.live_browser_url);
      return session;
    } catch (error) {
      console.error('Failed to initialize browser session:', error);
      throw error;
    }
  };

  const runInitialTest = async (startingData: WebAgentRequestBody) => {
    try {
      // Initialize browser session if not already initialized
      const session = browserSession || await initializeBrowserSession();

      // Add session_id to the request data
      const requestData = {
        ...startingData,
        session_id: session.session_id
      };

      console.log("calling runInitialTest");
      console.log(startingData);
      await runInitialSteps(requestData, handleStreamMessage);
    } catch (error) {
      console.error('Failed to run initial test:', error);
      // Handle error appropriately
    }
  };

  const runAdditionalTest = async (additionalStep: string) => {
    try {
      if (!browserSession) {
        throw new Error('No active browser session');
      }

      const requestData = {
        goal: additionalStep,
        session_id: browserSession.session_id,
        plan: "",
        starting_url: "",
      };

      console.log("calling runAdditionalTest");
      console.log(requestData);
      await runAdditionalSteps(requestData, handleStreamMessage);
    } catch (error) {
      console.error('Failed to run additional step:', error);
      // Handle error appropriately
      throw error;
    }
  };

  const clearSession = async () => {
    try {
      const session = browserSession;
      console.log(session);

      if (session) {
        await endWebagentSession(session.session_id);
      }

      setBrowserUrl('');
      setBrowserSession(null);
    } catch (error) {
      console.error('Failed to run terminate agent:', error);
      // Handle error appropriately
    }
  };

  const isJsonString = (str: string) => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  const handleStreamMessage = (message: string) => {
    console.log(message);
    if (message.includes('Task ID')) {
      const match = message.match(/Task ID: ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
      setProcessId(match![1]);
    } else if (isJsonString(message) && message.startsWith('[{') && message.endsWith('}]')) {
      try {
        setIntermediarySteps(prev => [...prev, {
          id: generateRandomString(5),
          action: JSON.parse(message)[0].content,
          status: 'pending'
        } as PlaygroundStep]);
      } catch (e) {
        console.error('Failed to parse array message:', e);
      }
    } else if (message.startsWith('Final Response:')) {
      try {
        console.log(message);
      } catch (e) {
        console.error('Failed to parse final response:', e);
      }
    }
  };

  return (
    <Container fluid className="h-screen max-h-screen p-0">
      <Grid className="h-full m-0" style={{ minHeight: '100vh' }}>
        {/* Left Panel - Interactive Steps */}
        <Grid.Col span={3} className="h-full">
          <Paper shadow="md" className="h-full bg-gray-50">
            <ScrollArea className="h-full p-4">
              <InteractiveSteps
                onRunInitialTest={runInitialTest}
                onRunAdditionalTest={runAdditionalTest}
                initialSteps_={intermediarySteps}
                processId={processId}
                onSessionEnd={clearSession}
              />
            </ScrollArea>
          </Paper>
        </Grid.Col>

        {/* Right Panel - Browser View */}
        <Grid.Col span={9} className="h-full">
          <Paper 
            shadow="md"
            className="h-full flex flex-col"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              minHeight: 'calc(100vh - 32px)'  // Accounting for container padding
            }}
          >
            {browserUrl ? (
              <div className="w-full h-full flex-grow relative">
                <iframe
                  src={browserUrl}
                  sandbox="allow-same-origin allow-scripts"
                  allow="clipboard-read; clipboard-write"
                  className="absolute inset-0 w-full h-full border-0 bg-white"
                  style={{ 
                    pointerEvents: 'none',
                    minHeight: '800px'  // Ensuring minimum height
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center flex-col gap-4 text-gray-500">
                <svg 
                  width="64" 
                  height="64" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                <div className="text-lg">Browser session not started</div>
                <div className="text-sm">Start a test to begin browsing</div>
              </div>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
};