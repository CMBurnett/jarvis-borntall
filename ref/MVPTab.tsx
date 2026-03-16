import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { webAppService, WebAppGeneration } from "@/service/demoApp";
import { toast } from "react-toastify";
import { ProjectDetails } from "@/service/types/types";
import { RootState } from '@/lib/store';
import {
  setCurrentView,
  setCurrentGenerationId,
  setGenerations,
  addGeneration,
  updateGeneration,
  setSelectedGeneration,
  removeGeneration,
  selectProjectMVPState,
  setIsGenerating,
  setParsedFeatures,
} from '@/lib/store/features/mvp/mvpSlice';
import ContextGatheringScreen from './ContextGatheringScreen';
import PlanningScreen from './PlanningScreen';
import WelcomeScreen from './WelcomeScreen';
import { PipelineTimeline } from './PipelineTimeline';
import {
  SparklesIcon,
  ArrowUpRightIcon,
  XCircleIcon,
  CodeBracketIcon,
  XMarkIcon,
  EyeIcon,
  CheckIcon,
  ArrowLeftIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  ChatBubbleIcon,
  CircleStackIcon,
} from './icons';
import AppIterationChat from './AppIterationChat';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu/dropdown-menu';

interface DemoAppTabProps {
  projectDetails?: ProjectDetails | null;
  initialFormData?: {
    name: string;
    description: string;
    appType: string;
    department: string[];
    tags: string[];
    attachedFile?: File;
  } | null;
  onFormDataUsed?: () => void;
  onAppGenerated?: (appUrl: string) => void;
  onOpenBuildDialog?: () => void;
}

// ── Data Map Sidebar ────────────────────────────────────────────────────────
const DATA_CATEGORIES = [
  {
    label: 'CRM & Sales',
    description: 'Customer records, deals, contacts, and pipeline data.',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Product & Inventory',
    description: 'SKUs, stock levels, pricing, and catalog data.',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: 'Analytics & Metrics',
    description: 'Usage events, KPIs, reports, and aggregated stats.',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Files & Documents',
    description: 'Uploaded assets, PDFs, contracts, and media.',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'External APIs',
    description: 'Third-party integrations, webhooks, and data feeds.',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
];

const DataMapSidebar: React.FC<{ projectDetails?: ProjectDetails | null }> = ({ projectDetails }) => (
  <div className="w-full border-l border-gray-200 flex flex-col h-full bg-white overflow-hidden">
    {/* Header */}
    <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100">
      <div className="flex items-center gap-2 mb-0.5">
        <CircleStackIcon className="w-4 h-4 text-[#00B2A1]" />
        <h3 className="text-base font-semibold text-[#111827]">Data Map</h3>
      </div>
      <p className="text-sm text-gray-400 leading-relaxed">
        Data sources your app will need to function and deploy successfully.
      </p>
    </div>

    {/* Data category list */}
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
      {DATA_CATEGORIES.map((cat) => (
        <div
          key={cat.label}
          className="rounded-lg border border-gray-200 bg-gray-50 p-3 cursor-default"
        >
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 bg-white border border-gray-200 text-gray-500">
              {cat.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#111827] leading-tight">{cat.label}</p>
              <p className="text-sm text-[#6b7280] mt-0.5 leading-relaxed">{cat.description}</p>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <span className="text-sm text-gray-400">Not connected</span>
          </div>
        </div>
      ))}
    </div>

    {/* Footer hint */}
    <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100">
      <p className="text-sm text-gray-400 leading-relaxed text-center">
        Connect data sources in the <span className="font-medium text-[#00B2A1]">Data</span> tab before deploying.
      </p>
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────────────────────

const GenerationProgress: React.FC<{
  onGenerationIdReceived: (generationId: string) => void;
  generationId: string | null;
  onComplete: (generation: WebAppGeneration) => void;
  onError: (error: string) => void;
  onBack?: () => void;
}> = ({ onGenerationIdReceived, generationId, onComplete, onError }) => {
  const steps = [
    "Gathering project information...",
    "Analyzing requirements...",
    "Generating PRD from requirements...",
    "Designing application structure...",
    "Setting up components...",
    "Implementing features...",
    "Creating app prototype structure..."
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [polling, setPolling] = useState<NodeJS.Timeout | null>(null);
  const [mockTimer, setMockTimer] = useState<NodeJS.Timeout | null>(null);
  const [backendStatus, setBackendStatus] = useState<string | null>(null);

  // Mock step progression with random timers
  useEffect(() => {
    if (!generationId) return;

    const progressMockSteps = () => {
      // Phase 1: Mock steps before PRD (steps 0-1)
      if (currentStep < 2 && backendStatus !== "generating_prd") {
        const delay = Math.random() * 25000 + 20000;
        const timer = setTimeout(() => {
          setCurrentStep(prev => prev + 1);
        }, delay);
        setMockTimer(timer);
      }
      // Phase 2: Mock steps before demo app creation (steps 3-5)
      else if (currentStep >= 3 && currentStep < 6 && backendStatus !== "generating_html" && backendStatus !== "generating_css" && backendStatus !== "generating_js") {
        const delay = Math.random() * 30000 + 30000;
        const timer = setTimeout(() => {
          setCurrentStep(prev => prev + 1);
        }, delay);
        setMockTimer(timer);
      }
    };

    progressMockSteps();

    return () => {
      if (mockTimer) {
        clearTimeout(mockTimer);
      }
    };
  }, [currentStep, generationId, backendStatus]);

  // Backend polling
  useEffect(() => {
    if (!generationId) return;

    const pollStatus = async () => {
      try {
        const statusResponse = await webAppService.getGenerationStatus(generationId);
        const status = statusResponse.data.status;
        setBackendStatus(status);

        // Skip mock steps and jump to real steps based on backend status
        if (status === "generating_prd" && currentStep < 2) {
          if (mockTimer) clearTimeout(mockTimer);
          setCurrentStep(2);
        } else if ((status === "generating_html" || status === "generating_css" || status === "generating_js") && currentStep < 6) {
          if (mockTimer) clearTimeout(mockTimer);
          setCurrentStep(6);
        }

        if (status === "completed") {
          setCurrentStep(7);
          const generationResponse = await webAppService.getGeneration(generationId);
          onComplete(generationResponse.data.generation);
          if (polling) {
            clearInterval(polling);
            setPolling(null);
          }
        } else if (status === "failed") {
          onError(statusResponse.data.errorMessage || "Generation failed");
          if (polling) {
            clearInterval(polling);
            setPolling(null);
          }
        }
      } catch (error: any) {
        onError("Failed to check generation status: " + (error.message || "Unknown error"));
        if (polling) {
          clearInterval(polling);
          setPolling(null);
        }
      }
    };

    // Initial call
    pollStatus();

    const interval = setInterval(pollStatus, 3000);
    setPolling(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [generationId, onComplete, onError, currentStep, mockTimer]);

  const activePhase = currentStep <= 1 ? 1 : currentStep === 2 ? 2 : 3;
  const currentStepLabel = steps[Math.min(currentStep, steps.length - 1)];

  return (
    <div className="relative flex flex-col h-full overflow-y-auto bg-white">
      {/* dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      {/* top glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,178,161,0.09) 0%, transparent 70%)' }}
      />
      <div className="relative flex flex-col items-center justify-center flex-1 px-8 py-12">
        <div className="w-full max-w-md flex flex-col items-center gap-7">
          {/* Icon badge */}
          <div className="relative">
            <div
              className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #00B2A1 0%, #00d0bd 100%)' }}
            >
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -inset-[5px] rounded-[18px] border border-[#00B2A1]/20 pointer-events-none" />
          </div>

          {/* Title */}
          <div className="text-center">
            <h2 className="text-[1.5rem] font-bold text-[#111827] tracking-tight leading-tight">
              Building Your Prototype
            </h2>
            <p className="text-base text-[#4b5563] mt-2 leading-relaxed">
              This process could take 10 minutes or more.
            </p>
          </div>

          {/* Status card */}
          <div
            className="w-full rounded-xl border p-5"
            style={{
              background: 'linear-gradient(150deg, rgba(0,178,161,0.07) 0%, white 55%)',
              borderColor: 'rgba(0,178,161,0.18)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#00B2A1] border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-base text-[#111827]">{currentStepLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BackendGenerationPlaceholder: React.FC<{
  onComplete: () => void;
}> = ({ onComplete }) => {
  const steps = [
    "Preparing project configuration",
    "Setting up data connections",
    "Configuring API endpoints",
    "Deploying services",
    "Running health checks",
  ];

  const [currentStep, setCurrentStep] = React.useState(0);

  React.useEffect(() => {
    if (currentStep >= steps.length) {
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
    const delay = Math.random() * 2000 + 2000;
    const timer = setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [currentStep, onComplete]);

  const activePhase = currentStep <= 1 ? 5 : currentStep === 2 ? 6 : 7;
  const currentStepLabel = steps[Math.min(currentStep, steps.length - 1)];

  return (
    <div className="relative flex flex-col h-full overflow-y-auto bg-white">
      {/* dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      {/* top glow — violet for deploy phase */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.09) 0%, transparent 70%)' }}
      />
      <div className="relative flex flex-col items-center justify-center flex-1 px-8 py-12">
        <div className="w-full max-w-md flex flex-col items-center gap-7">
          {/* Icon badge — violet for deploy */}
          <div className="relative">
            <div
              className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #9f5aff 100%)' }}
            >
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -inset-[5px] rounded-[18px] border border-[#7c3aed]/20 pointer-events-none" />
          </div>

          {/* Title */}
          <div className="text-center">
            <h2 className="text-[1.5rem] font-bold text-[#111827] tracking-tight leading-tight">
              Building Your App
            </h2>
            <p className="text-base text-[#4b5563] mt-2 leading-relaxed">
              Setting up your project backend and deploying. This will take a few moments.
            </p>
          </div>

          {/* Status card */}
          <div
            className="w-full rounded-xl border p-5"
            style={{
              background: 'linear-gradient(150deg, rgba(124,58,237,0.07) 0%, white 55%)',
              borderColor: 'rgba(124,58,237,0.18)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-base text-[#111827]">{currentStepLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeployProgress: React.FC<{
  appUrl?: string;
}> = ({ appUrl }) => {
  const steps = [
    "Provisioning environment",
    "Deploying application bundle",
    "Configuring routing & DNS",
    "Running health checks",
  ];

  const [currentStep, setCurrentStep] = React.useState(0);
  const isComplete = currentStep >= steps.length;

  React.useEffect(() => {
    if (isComplete) return;
    const delay = Math.random() * 1500 + 1500;
    const timer = setTimeout(() => setCurrentStep(prev => prev + 1), delay);
    return () => clearTimeout(timer);
  }, [currentStep, isComplete]);

  const currentStepLabel = steps[Math.min(currentStep, steps.length - 1)];

  return (
    <div className="relative flex flex-col h-full overflow-y-auto bg-white">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '22px 22px' }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,178,161,0.09) 0%, transparent 70%)' }}
      />
      <div className="relative flex flex-col items-center justify-center flex-1 px-8 py-12">
        <div className="w-full max-w-md flex flex-col items-center gap-7">
          <div className="relative">
            <div
              className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #00B2A1 0%, #00d0bd 100%)' }}
            >
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -inset-[5px] rounded-[18px] border border-[#00B2A1]/20 pointer-events-none" />
          </div>
          <div className="text-center">
            <h2 className="text-[1.5rem] font-bold text-[#111827] tracking-tight leading-tight">
              {isComplete ? 'Your App is Live!' : 'Deploying Your App'}
            </h2>
            <p className="text-base text-[#4b5563] mt-2 leading-relaxed">
              {isComplete ? 'Successfully deployed and ready to use.' : 'Almost there — publishing to production.'}
            </p>
          </div>
          <div
            className="w-full rounded-xl border p-5"
            style={{
              background: 'linear-gradient(150deg, rgba(0,178,161,0.07) 0%, white 55%)',
              borderColor: 'rgba(0,178,161,0.18)',
            }}
          >
            {isComplete ? (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-[#00B2A1]">
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  <span className="text-base font-medium text-[#111827]">All systems running</span>
                </div>
                {appUrl && (
                  <a
                    href={appUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00B2A1] text-white text-base font-semibold rounded-lg hover:bg-[#009e8e] transition-colors shadow-sm"
                  >
                    Open App
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-[#00B2A1] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <p className="text-base text-[#111827]">{currentStepLabel}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const FullWidthDemoAppPreview: React.FC<{
  generation: WebAppGeneration;
  onFullScreen: () => void;
  projectDetails?: ProjectDetails | null;
  viewMode?: 'desktop' | 'mobile';
  hideChrome?: boolean;
}> = ({ generation, onFullScreen, projectDetails, viewMode = 'desktop', hideChrome = false }) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loadingHtml, setLoadingHtml] = useState(false);
  const [showFeaturesTooltip, setShowFeaturesTooltip] = useState(false);
  const [iframeHeight, setIframeHeight] = useState<number>(100000);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isCompleted = generation.status === "completed" && generation.webAppUrl;

  useEffect(() => {
    const fetchHtmlContent = async () => {
      if (!isCompleted || !generation.webAppUrl) return;

      setLoadingHtml(true);
      try {
        const filename = generation.webAppUrl.split("/").pop() || "";
        const content = await webAppService.previewWebApp(filename);

        // Inject script and styles to ensure content is fully visible and scrollable
        const resizeScript = `
          <style>
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              min-height: 100%;
            }
            body {
              overflow-x: auto;
              overflow-y: auto;
              height: auto !important;
              min-height: 100% !important;
            }
            html {
              height: auto !important;
              overflow: visible !important;
            }
            * {
              box-sizing: border-box;
            }
          </style>
          <script>
            (function() {
              document.documentElement.style.height = 'auto';
              document.documentElement.style.minHeight = '100%';
              document.body.style.height = 'auto';
              document.body.style.minHeight = '100%';
              
              function sendHeight() {
                try {
                  const bodyHeight = document.body ? Math.max(
                    document.body.scrollHeight,
                    document.body.offsetHeight,
                    document.body.clientHeight
                  ) : 0;
                  
                  const docHeight = Math.max(
                    document.documentElement.scrollHeight,
                    document.documentElement.offsetHeight,
                    document.documentElement.clientHeight
                  );
                  
                  const height = Math.max(bodyHeight, docHeight, window.innerHeight);
                  
                  if (height > 0) {
                    // Send height with extra padding to ensure all content is visible
                    window.parent.postMessage({ type: 'iframe-resize', height: height + 200 }, '*');
                  }
                } catch (e) {}
              }
              
              // Wait for DOM to be ready
              function init() {
                // Send height on load
                if (document.readyState === 'complete' || document.readyState === 'interactive') {
                  setTimeout(sendHeight, 100);
                } else {
                  window.addEventListener('load', function() {
                    setTimeout(sendHeight, 100);
                  });
                }
                
                // Send height on resize
                window.addEventListener('resize', sendHeight);
                
                // Also use MutationObserver to detect content changes
                if (document.body) {
                  const observer = new MutationObserver(function() {
                    setTimeout(sendHeight, 100);
                  });
                  observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    characterData: true
                  });
                }
                
                // Periodic check as fallback - check more frequently
                setInterval(sendHeight, 500);
              }
              
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', init);
              } else {
                init();
              }
            })();
          </script>
        `;

        // Inject styles in head and script before closing body tag
        let modifiedContent = content;

        // Inject styles in head
        const headTagRegex = /<\/head>/i;
        if (headTagRegex.test(content)) {
          const headStyles = resizeScript.split('</style>')[0] + '</style>';
          const lastHeadIndex = content.lastIndexOf('</head>');
          modifiedContent = content.substring(0, lastHeadIndex) + headStyles + content.substring(lastHeadIndex);
        }

        // Inject script before closing body tag
        const bodyTagRegex = /<\/body>/i;
        if (bodyTagRegex.test(modifiedContent)) {
          const scriptPart = resizeScript.split('</style>')[1] || resizeScript;
          const lastBodyIndex = modifiedContent.lastIndexOf('</body>');
          modifiedContent = modifiedContent.substring(0, lastBodyIndex) + scriptPart + modifiedContent.substring(lastBodyIndex);
        } else {
          modifiedContent = modifiedContent + resizeScript;
        }

        setHtmlContent(modifiedContent);
      } catch (error) { } finally {
        setLoadingHtml(false);
      }
    };

    fetchHtmlContent();
  }, [isCompleted, generation.webAppUrl]);

  // Listen for height messages from iframe and update iframe height dynamically
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'iframe-resize') {
        // Use the actual measured height, ensuring it's at least 100000px
        // The script already adds padding, so we just ensure minimum
        const newHeight = Math.max(event.data.height, 100000);
        setIframeHeight(newHeight);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const storedFeatures = useSelector((state: RootState) => {
    const projectId = projectDetails?._id || '';
    return projectId ? selectProjectMVPState(state, projectId).parsedFeatures[generation.id] || [] : [];
  });

  return (
    <div
      className="relative bg-white rounded-lg flex flex-col h-full"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100%', margin: 0, padding: 0, overflow: 'hidden' }}
    >
      {!hideChrome && (
        <div className="h-8 bg-gradient-to-r from-gray-100 to-gray-50 rounded-t-lg flex items-center justify-between px-2 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-red-400 rounded-full shadow-sm"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-sm"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full shadow-sm"></div>
          </div>
        </div>
      )}
      <div className="flex-1" style={{ position: 'relative', minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '100%' }}>
        {isCompleted ? (
          loadingHtml ? (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-blue-50">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg border border-gray-200">
                  <div className="w-8 h-8 border-2 border-[#00B2A1] border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-600 font-medium">Loading app prototype...</p>
              </div>
            </div>
          ) : (
            <>
              <div className={`flex-1 w-full ${viewMode === 'mobile' ? 'flex items-center justify-center py-4' : ''}`} style={{ position: 'relative', minHeight: 0, height: '100%', margin: 0, padding: 0 }}>
                <iframe
                  ref={iframeRef}
                  srcDoc={htmlContent}
                  className={`border-none ${viewMode === 'mobile'
                    ? 'w-[375px] h-[667px] mx-auto shadow-2xl rounded-lg'
                    : 'w-full h-full'
                    }`}
                  title="App Prototype Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  scrolling="yes"
                  style={{
                    display: 'block',
                    border: 'none',
                    width: '100%',
                    height: viewMode === 'mobile' ? '667px' : 'calc(100vh - 150px)',
                    minHeight: viewMode === 'mobile' ? '667px' : 'calc(100vh - 150px)',
                    margin: 0,
                    padding: 0,
                    pointerEvents: 'auto'
                  }}
                />
              </div>
              <div className="absolute top-4 right-4 z-10">
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowFeaturesTooltip(true)}
                    onMouseLeave={() => setShowFeaturesTooltip(false)}
                    className="p-2 bg-white/95 hover:bg-white border border-gray-200 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl backdrop-blur-sm"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  {showFeaturesTooltip && (
                    <div className="absolute right-0 top-12 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                      <h4 className="font-semibold text-[#111827] mb-3">Features Implemented</h4>
                      <ul className="space-y-2 text-lg text-[#4b5563]">
                        {storedFeatures.length > 0 ? (
                          storedFeatures.map((feature, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <CheckIcon className="w-3 h-3 text-[#00B2A1] flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))
                        ) : generation.prdFiles && generation.prdFiles.length > 0 ? (
                          generation.prdFiles.map((prd, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <CheckIcon className="w-3 h-3 text-[#00B2A1] flex-shrink-0 mt-0.5" />
                              <span>Based on {prd.originalFilename}</span>
                            </li>
                          ))
                        ) : (
                          <li className="flex items-start gap-3">
                            <CheckIcon className="w-4 h-4 text-[#00B2A1] flex-shrink-0 mt-0.5" />
                            <span>Core functionality implemented</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </>
          )
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg border border-gray-200">
                <div className="w-8 h-8 border-2 border-[#00B2A1] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600 font-medium">App prototype is being generated...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const parseImplementedFeatures = (features: string | undefined): string[] => {
  try {
    if (!features) return [];

    // Parse markdown-style string format
    const lines = features.split('\n');
    const parsedFeatures: string[] = [];

    for (const line of lines) {
      if (parsedFeatures.length >= 4) break;

      const trimmed = line.trim();
      // Match numbered list items (1. 2. 3. etc.) with optional bold formatting
      const match = trimmed.match(/^\d+\.\s*\*\*(.+?)\*\*\s*-\s*(.+)$/) ||
        trimmed.match(/^\d+\.\s*(.+)$/);

      if (match) {
        if (match.length === 3) {
          parsedFeatures.push(`${match[1]} - ${match[2]}`);
        } else if (match[1]) {
          parsedFeatures.push(match[1].trim());
        }
      }
    }

    return parsedFeatures.length > 0 ? parsedFeatures : [];
  } catch (error) {
    return [];
  }
};

const DemoAppTab: React.FC<DemoAppTabProps> = ({ projectDetails, onAppGenerated, onOpenBuildDialog }) => {
  const dispatch = useDispatch();
  const projectId = projectDetails?._id || '';
  const { currentView, currentGenerationId, generations, selectedGeneration, isGenerating, parsedFeatures } = useSelector((state: RootState) =>
    projectId ? selectProjectMVPState(state, projectId) : {
      currentView: 'home' as const,
      currentGenerationId: null,
      generations: [],
      selectedGeneration: null,
      isGenerating: false,
      parsedFeatures: {}
    }
  );
  const [isUsingForDev, setIsUsingForDev] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isIterationMode, setIsIterationMode] = useState(false);
  const [showIterationSidebar, setShowIterationSidebar] = useState(false);
  const [showDataSidebar, setShowDataSidebar] = useState(false);
  const [selectedIterationGeneration, setSelectedIterationGeneration] = useState<WebAppGeneration | null>(null);
  const [currentIterationVersion, setCurrentIterationVersion] = useState(0); // 0 = Base Version
  const [rootGenerationId, setRootGenerationId] = useState<string | null>(null); // Store root generation ID
  const [pendingGenerationData, setPendingGenerationData] = useState<{
    projectName: string;
    files?: File[];
    description?: string;
    tags?: string[];
  } | null>(null);
  const generationInProgressRef = useRef(false);

  const fetchGenerations = useCallback(async () => {
    if (!projectDetails?.name || !projectId) return;

    try {
      const response = await webAppService.getGenerations({
        projectName: projectDetails.name
      });
      const generations = response.data.generations;

      const generationsWithLatestVersion = await Promise.all(
        generations.map(async (gen: WebAppGeneration) => {
          try {
            // Only get completed versions for prototype tab display
            const latestCompletedResponse = await webAppService.getLatestCompletedVersion(gen.id);
            if (latestCompletedResponse.data?.version && latestCompletedResponse.data.version.webAppUrl) {
              return {
                ...gen,
                webAppUrl: latestCompletedResponse.data.version.webAppUrl,
                id: latestCompletedResponse.data.version.id, // Use latest completed version ID
                versionNumber: latestCompletedResponse.data.version.versionNumber
              };
            }
            if (gen.status === 'completed' && gen.webAppUrl) {
              return gen;
            }
          } catch (error) {
            if (gen.status === 'completed' && gen.webAppUrl) {
              return gen;
            }
          }
          return null;
        })
      );

      const validGenerations = generationsWithLatestVersion.filter((gen): gen is WebAppGeneration => gen !== null);

      dispatch(setGenerations({ projectId, generations: validGenerations }));
    } catch (error: any) {
      toast.error("Failed to fetch generations: " + (error.message || "Unknown error"));
    }
  }, [projectDetails, dispatch, projectId]);

  useEffect(() => {
    if (projectDetails) {
      fetchGenerations();
    }
  }, [projectDetails, fetchGenerations]);

  const handleGenerate = useCallback(async (data: { projectName: string; files?: File[]; description?: string; tags?: string[]; questionsAndAnswers?: import('@/service/demoApp').QuestionAnswer[] }) => {
    if (isGenerating || !projectId || generationInProgressRef.current) return; // Prevent duplicate requests

    generationInProgressRef.current = true;
    dispatch(setIsGenerating({ projectId, isGenerating: true }));
    dispatch(setCurrentView({ projectId, view: 'generating' }));

    try {
      const response = await webAppService.generateWebAppFromPrompt(data);

      // toast.success(response.data.message);
      dispatch(setCurrentGenerationId({ projectId, generationId: response.data.generation.id }));

      const newGeneration: WebAppGeneration = {
        id: response.data.generation.id,
        projectName: response.data.generation.projectName,
        status: response.data.generation.status,
        prdFiles: response.data.generation.prdFiles,
        additionalFiles: [],
        totalTokensUsed: 0,
        generationStartedAt: response.data.generation.createdAt,
        generationCompletedAt: null,
        webAppUrl: null,
        errorMessage: null,
        description: response.data.generation.description,
        tags: response.data.generation.tags,
        implementedFeatures: undefined,
        createdAt: response.data.generation.createdAt,
        updatedAt: response.data.generation.createdAt
      };

      dispatch(addGeneration({ projectId, generation: newGeneration }));
    } catch (error: any) {
      toast.error("Generation failed: " + (error.message || "Unknown error"));
      dispatch(setCurrentView({ projectId, view: 'home' }));
      dispatch(setIsGenerating({ projectId, isGenerating: false }));
      generationInProgressRef.current = false;
    }
  }, [dispatch, projectId]);

  const handleDeleteGeneration = async (id: string, projectName: string) => {
    if (!window.confirm(`Are you sure you want to delete the generation for "${projectName}"?`) || !projectId) return;

    try {
      await webAppService.deleteGeneration(id);
      dispatch(removeGeneration({ projectId, generationId: id }));
      toast.success("Generation deleted successfully");
    } catch (error: any) {
      toast.error("Delete failed: " + (error.message || "Unknown error"));
    }
  };

  const handleResetProject = async () => {
    if (!projectDetails?.name || !projectId) return;

    try {
      const response = await webAppService.resetProjectGenerations(projectDetails.name);
      dispatch(setGenerations({ projectId, generations: [] }));
      dispatch(setCurrentView({ projectId, view: 'home' }));
      dispatch(setSelectedGeneration({ projectId, generation: null }));
      setShowResetModal(false);
      toast.success(`${response.data.message} (${response.data.deletedCount} generations deleted)`);
    } catch (error: any) {
      toast.error("Reset failed: " + (error.message || "Unknown error"));
    }
  };

  const handleGenerationComplete = (generation: WebAppGeneration) => {
    if (!projectId) return;

    dispatch(updateGeneration({ projectId, generation }));
    dispatch(setCurrentGenerationId({ projectId, generationId: null }));
    dispatch(setIsGenerating({ projectId, isGenerating: false }));
    generationInProgressRef.current = false;

    // Initialize iteration state so frontend-ready view renders immediately
    setSelectedIterationGeneration({ ...generation, versionNumber: 0 } as WebAppGeneration);
    setCurrentIterationVersion(0);

    // Transition to frontend-ready so user can review before building backend
    dispatch(setCurrentView({ projectId, view: 'frontend-ready' }));

    // Notify parent if app URL is available
    if (generation.webAppUrl && onAppGenerated) {
      onAppGenerated(generation.webAppUrl);
    }
  };

  const handleGenerationError = (error: string) => {
    if (!projectId) return;

    dispatch(setCurrentView({ projectId, view: 'home' }));
    dispatch(setCurrentGenerationId({ projectId, generationId: null }));
    dispatch(setIsGenerating({ projectId, isGenerating: false }));
    generationInProgressRef.current = false;
    toast.error(error);
  };

  const handleBackToHome = () => {
    if (!projectId) return;

    dispatch(setCurrentView({ projectId, view: 'home' }));
    dispatch(setSelectedGeneration({ projectId, generation: null }));
    dispatch(setCurrentGenerationId({ projectId, generationId: null }));
  };

  const handlePreview = async (filename: string) => {
    try {
      const htmlContent = await webAppService.previewWebApp(filename);
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
      }
    } catch (error: any) {
      toast.error("Preview failed: " + (error.message || "Unknown error"));
    }
  };

  const handleDownload = async (filename: string, generationName: string) => {
    try {
      const blob = await webAppService.downloadWebApp(filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${generationName.replace(/\s+/g, "_")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error("Download failed: " + (error.message || "Unknown error"));
    }
  };

  const completedGenerations = generations
    .filter(gen => gen.status === 'completed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const lastCompletedGeneration = completedGenerations[0];

  // Sync version state when iteration mode first opens
  const hasInitializedVersion = useRef(false);
  useEffect(() => {
    if (isIterationMode && lastCompletedGeneration && !hasInitializedVersion.current) {
      hasInitializedVersion.current = true;
      const initializeVersion = async () => {
        try {
          const versionsResponse = await webAppService.getVersionHistory(lastCompletedGeneration.id);
          if (versionsResponse.data?.versions && versionsResponse.data.versions.length > 0) {
            const versions = versionsResponse.data.versions;

            const rootVersion = versions.find((v: any) => v.versionNumber === 0 || v.versionNumber === undefined);
            if (rootVersion) {
              setRootGenerationId(rootVersion.id);
            }

            const baseVersion = versions.find((v: any) =>
              v.versionNumber === 0 || v.versionNumber === undefined
            );

            const completedVersions = versions.filter((v: any) => v.status === 'completed');
            const latestCompleted = completedVersions.length > 0
              ? completedVersions[completedVersions.length - 1] // Last one (sorted by versionNumber)
              : null;

            if (latestCompleted && latestCompleted.webAppUrl) {
              const latestVersionNumber = latestCompleted.versionNumber || 0;
              setCurrentIterationVersion(latestVersionNumber);

              // Use base version's data but with latest version's webAppUrl
              const baseGen = baseVersion || lastCompletedGeneration;
              setSelectedIterationGeneration({
                ...baseGen,
                webAppUrl: latestCompleted.webAppUrl,
                id: latestCompleted.id,
                versionNumber: latestVersionNumber
              } as WebAppGeneration);
            } else if (baseVersion && baseVersion.webAppUrl) {
              // Fallback to base version if no completed versions
              setCurrentIterationVersion(0);
              setSelectedIterationGeneration({
                ...lastCompletedGeneration,
                webAppUrl: baseVersion.webAppUrl,
                id: baseVersion.id,
                versionNumber: 0
              } as WebAppGeneration);
            } else if (lastCompletedGeneration.status === 'completed' && lastCompletedGeneration.webAppUrl) {
              // Final fallback
              setCurrentIterationVersion(0);
              setSelectedIterationGeneration({
                ...lastCompletedGeneration,
                versionNumber: 0
              } as WebAppGeneration);
            }
          } else {
            // No version history, use lastCompletedGeneration
            if (lastCompletedGeneration.status === 'completed' && lastCompletedGeneration.webAppUrl) {
              setCurrentIterationVersion(0);
              setSelectedIterationGeneration({
                ...lastCompletedGeneration,
                versionNumber: 0
              } as WebAppGeneration);
            }
          }
        } catch (error) {
          if (lastCompletedGeneration.status === 'completed' && lastCompletedGeneration.webAppUrl) {
            setCurrentIterationVersion(0);
            setSelectedIterationGeneration({
              ...lastCompletedGeneration,
              versionNumber: 0
            } as WebAppGeneration);
          }
        }
      };

      initializeVersion();
    } else if (!isIterationMode) {
      // Reset flag when iteration mode closes
      hasInitializedVersion.current = false;
      setRootGenerationId(null); // Reset root generation ID
    }
  }, [isIterationMode, lastCompletedGeneration?.id]);

  const renderDemoAppContent = () => {
    switch (currentView) {
      case 'configuring':
        return (
          <ContextGatheringScreen
            projectDetails={projectDetails}
            onGenerate={(data) => {
              if (!projectId) return;
              setPendingGenerationData(data);
              dispatch(setCurrentView({ projectId, view: 'planning' }));
            }}
            isGenerating={isGenerating}
          />
        );
      case 'planning':
        return (
          <PlanningScreen
            contextData={{ description: pendingGenerationData?.description, files: pendingGenerationData?.files }}
            projectName={projectDetails?.name}
            onStart={(questionsAndAnswers) => {
              if (pendingGenerationData) handleGenerate({ ...pendingGenerationData, questionsAndAnswers });
            }}
          />
        );
      case 'generating':
        return (
          <GenerationProgress
            onGenerationIdReceived={(id) => projectId && dispatch(setCurrentGenerationId({ projectId, generationId: id }))}
            generationId={currentGenerationId}
            onComplete={handleGenerationComplete}
            onError={handleGenerationError}
          />
        );
      case 'frontend-ready': {
        if (!lastCompletedGeneration) {
          return (
            <ContextGatheringScreen
              projectDetails={projectDetails}
              onGenerate={(data) => {
                if (!projectId) return;
                setPendingGenerationData(data);
                dispatch(setCurrentView({ projectId, view: 'planning' }));
              }}
              isGenerating={isGenerating}
            />
          );
        }
        return (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Content — preview (full width) + overlay sidebars */}
            <div className="flex-1 min-h-0 relative overflow-hidden">
              {/* App Preview — always full width */}
              <div className="absolute inset-0 flex flex-col">
                <FullWidthDemoAppPreview
                  generation={selectedIterationGeneration || lastCompletedGeneration}
                  onFullScreen={() => { }}
                  projectDetails={projectDetails}
                  viewMode={viewMode}
                  hideChrome
                />
              </div>

              {/* Iteration Chat sidebar — overlays the preview */}
              {showIterationSidebar && (
              <div className="absolute top-0 right-0 bottom-0 w-[420px] border-l border-gray-200 shadow-xl bg-white">
                <AppIterationChat
                  generationId={lastCompletedGeneration.id}
                  onIterationRequest={async (_message: string) => { }}
                  generations={completedGenerations}
                  selectedGeneration={selectedIterationGeneration}
                  onVersionSelect={async (generation: WebAppGeneration) => {
                    setSelectedIterationGeneration(generation);
                    if (generation.id !== lastCompletedGeneration.id) {
                      try {
                        const versionResponse = await webAppService.getVersionById(lastCompletedGeneration.id, generation.id);
                        if (versionResponse.data?.version) {
                          setSelectedIterationGeneration({
                            ...lastCompletedGeneration,
                            webAppUrl: versionResponse.data.version.webAppUrl,
                            id: versionResponse.data.version.id
                          } as WebAppGeneration);
                        }
                      } catch (error) { }
                    }
                  }}
                  currentVersion={currentIterationVersion}
                  onVersionChange={async (version: number) => {
                    setCurrentIterationVersion(version);
                    if (version === 0) {
                      try {
                        const versionsResponse = await webAppService.getVersionHistory(lastCompletedGeneration.id);
                        if (versionsResponse.data?.versions) {
                          const baseVersion = versionsResponse.data.versions.find((v: any) =>
                            v.versionNumber === 0 || v.versionNumber === undefined
                          );
                          if (baseVersion && baseVersion.webAppUrl) {
                            setSelectedIterationGeneration({
                              ...lastCompletedGeneration,
                              webAppUrl: baseVersion.webAppUrl,
                              id: baseVersion.id,
                              versionNumber: 0
                            } as WebAppGeneration);
                          } else {
                            const baseGenResponse = await webAppService.getGeneration(lastCompletedGeneration.id);
                            if (baseGenResponse.data?.generation?.webAppUrl) {
                              const baseGen = baseGenResponse.data.generation;
                              setSelectedIterationGeneration({
                                ...lastCompletedGeneration,
                                webAppUrl: baseGen.webAppUrl,
                                id: baseGen.id,
                                versionNumber: 0
                              } as WebAppGeneration);
                            }
                          }
                        }
                      } catch (error) {
                        toast.error('Failed to load base version');
                      }
                    } else {
                      try {
                        const versionsResponse = await webAppService.getVersionHistory(lastCompletedGeneration.id);
                        if (versionsResponse.data?.versions) {
                          const targetVersion = versionsResponse.data.versions.find((v: any) => v.versionNumber === version);
                          if (targetVersion && targetVersion.webAppUrl) {
                            setSelectedIterationGeneration({
                              ...lastCompletedGeneration,
                              webAppUrl: targetVersion.webAppUrl,
                              id: targetVersion.id,
                              versionNumber: targetVersion.versionNumber
                            } as WebAppGeneration);
                          } else {
                            toast.warning(`Version ${version} not found or not completed yet`);
                          }
                        }
                      } catch (error) {
                        toast.error('Failed to load version');
                      }
                    }
                  }}
                />
              </div>
              )}

              {/* Data Map sidebar — overlays the preview */}
              {showDataSidebar && (
                <div className="absolute top-0 right-0 bottom-0 w-[420px] shadow-xl">
                  <DataMapSidebar projectDetails={projectDetails} />
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'generating-backend':
        return (
          <BackendGenerationPlaceholder
            onComplete={() => {
              if (projectId) dispatch(setCurrentView({ projectId, view: 'deploying' }));
            }}
          />
        );

      case 'deploying':
      case 'deployed':
        return (
          <DeployProgress
            appUrl={lastCompletedGeneration?.webAppUrl}
          />
        );

      case 'home':
      default:
        const ongoingGeneration = generations.find(gen =>
          gen.status !== 'completed' && gen.status !== 'failed'
        );

        if (ongoingGeneration) {
          return (
            <GenerationProgress
              onGenerationIdReceived={(id) => projectId && dispatch(setCurrentGenerationId({ projectId, generationId: id }))}
              generationId={ongoingGeneration.id}
              onComplete={handleGenerationComplete}
              onError={handleGenerationError}
            />
          );
        }

        // No prototype yet — show welcome screen
        return (
          <WelcomeScreen
            projectName={projectDetails?.name}
            onStart={() => projectId && dispatch(setCurrentView({ projectId, view: 'configuring' }))}
          />
        );
    }
  };

  const showPrototypeBanner = currentView === 'frontend-ready' && !!lastCompletedGeneration;

  return (
    <main className="flex-1 bg-white" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: 0 }}>
      {/* Outer wrapper — banner + chrome container share the same margin */}
      <div className="flex-1 flex flex-col mx-6 mb-6">

        {/* App Prototype Ready banner — sits directly above chrome dots */}
        {showPrototypeBanner && (
          <div className="relative overflow-hidden flex-shrink-0 border border-b-0 border-gray-200 rounded-t-xl bg-white">
            {/* dot grid */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '22px 22px' }}
            />
            {/* left glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 0% 50%, rgba(0,178,161,0.08) 0%, transparent 55%)' }}
            />
            <div className="relative h-20 flex items-center justify-between pl-4 pr-5">
              {/* Left — icon badge + title */}
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #00B2A1 0%, #00d0bd 100%)' }}
                  >
                    <SparklesIcon className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div className="absolute -inset-[3px] rounded-[13px] border border-[#00B2A1]/20 pointer-events-none" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#111827]">Review Prototype</h2>
                  <p className="text-base text-gray-500">Review and refine before building</p>
                </div>
              </div>

              {/* Right — sidebar toggles + actions */}
              <div className="flex items-center gap-1.5">
                {/* Data Map toggle */}
                <button
                  onClick={() => {
                    setShowDataSidebar(v => !v);
                    setShowIterationSidebar(false);
                  }}
                  title="Data Map"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-base font-medium transition-all ${
                    showDataSidebar
                      ? 'bg-[#00B2A1] text-white shadow-sm'
                      : 'text-gray-500 hover:bg-white/70 hover:text-[#00B2A1]'
                  }`}
                >
                  <CircleStackIcon className="w-4 h-4" />
                  <span>Data Map</span>
                </button>

                {/* Iterate toggle */}
                <button
                  onClick={() => {
                    setShowIterationSidebar(v => !v);
                    setShowDataSidebar(false);
                  }}
                  title="Iterate"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-base font-medium transition-all ${
                    showIterationSidebar
                      ? 'bg-[#00B2A1] text-white shadow-sm'
                      : 'text-gray-500 hover:bg-white/70 hover:text-[#00B2A1]'
                  }`}
                >
                  <ChatBubbleIcon className="w-4 h-4" />
                  <span>Iterate</span>
                </button>

                <div className="w-px h-5 bg-gray-200 mx-1" />

                {/* Deploy */}
                <button
                  onClick={() => projectId && dispatch(setCurrentView({ projectId, view: 'generating-backend' }))}
                  className="border border-[#00B2A1] text-[#00B2A1] font-semibold py-1 px-3 rounded-lg text-base flex items-center gap-1.5 transition-all hover:bg-[#00B2A1] hover:text-white"
                >
                  Build App
                  <ArrowUpRightIcon className="w-4 h-4" />
                </button>

                {/* More actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 border border-gray-300 rounded-lg text-gray-500 hover:bg-white/70 hover:text-[#111827] transition-colors">
                      <EllipsisVerticalIcon className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem
                      onClick={() => lastCompletedGeneration?.webAppUrl && handlePreview(lastCompletedGeneration.webAppUrl.split('/').pop() || '')}
                      className="cursor-pointer"
                    >
                      <EyeIcon className="w-4 h-4 mr-2" />
                      Full Screen
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        if (lastCompletedGeneration?.status === 'completed') {
                          setIsUsingForDev(true);
                          try {
                            const response = await webAppService.useForDev(lastCompletedGeneration.id);
                            toast.success(response.data.message);
                          } catch (error: any) {
                            toast.error('Failed to copy to AI Studio: ' + (error.message || 'Unknown error'));
                          } finally {
                            setIsUsingForDev(false);
                          }
                        }
                      }}
                      disabled={isUsingForDev}
                      className="cursor-pointer"
                    >
                      <CodeBracketIcon className="w-4 h-4 mr-2" />
                      {isUsingForDev ? 'Copying...' : 'Copy to AI Studio'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowResetModal(true)}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <XCircleIcon className="w-4 h-4 mr-2" />
                      Reset Prototype
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        )}

        {/* Browser chrome dots + content */}
        <div className={`flex-1 flex flex-col overflow-hidden border border-gray-200 shadow-sm min-h-[680px] ${showPrototypeBanner ? 'rounded-b-xl' : 'rounded-xl'}`}>
          <div className="h-9 bg-gradient-to-r from-gray-100 to-gray-50 flex items-center px-3 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-red-400 rounded-full shadow-sm" />
              <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-sm" />
              <div className="w-3 h-3 bg-green-400 rounded-full shadow-sm" />
            </div>
            {currentView !== 'home' && projectId && (
              <button
                onClick={() => dispatch(setCurrentView({ projectId, view: 'home' }))}
                title="Back to welcome"
                className="ml-auto p-1 rounded text-gray-400 hover:text-[#00B2A1] transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex-1 overflow-hidden bg-white" style={{ display: 'flex', flexDirection: 'column' }}>
            {renderDemoAppContent()}
          </div>
        </div>
      </div>

      {/* Iteration Mode Fullscreen Modal */}
      {isIterationMode && lastCompletedGeneration && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col animate-fade-in">
          {/* Header */}
          <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00B2A1] to-[#00a090] rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">Iteration Mode</h2>
                <p className="text-base text-gray-500">Refine your app with AI assistance</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsIterationMode(false);
                // Don't reset selectedIterationGeneration and currentIterationVersion
                // so they persist when modal reopens
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Content: App Preview (75%) + AI Chat (25%) */}
          <div className="flex-1 flex overflow-hidden">
            {/* App Preview - 75% */}
            <div className="w-[75%] p-6 bg-gray-50" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div className="flex-1" style={{ minHeight: 0 }}>
                <FullWidthDemoAppPreview
                  generation={selectedIterationGeneration || lastCompletedGeneration}
                  onFullScreen={() => { }}
                  projectDetails={projectDetails}
                  viewMode={viewMode}
                />
              </div>
            </div>

            {/* AI Chat Sidebar - 25% */}
            <div className="w-[25%]">
              <AppIterationChat
                generationId={rootGenerationId || lastCompletedGeneration.id}
                onIterationRequest={async (message: string) => {
                  // Handle iteration request - socket handles the actual request
                }}
                generations={completedGenerations}
                selectedGeneration={selectedIterationGeneration}
                onVersionSelect={async (generation: WebAppGeneration) => {
                  setSelectedIterationGeneration(generation);
                  if (generation.id !== lastCompletedGeneration.id) {
                    // This is a different version, update the preview
                    try {
                      const versionResponse = await webAppService.getVersionById(lastCompletedGeneration.id, generation.id);
                      if (versionResponse.data?.version) {
                        const updatedGen = {
                          ...lastCompletedGeneration,
                          webAppUrl: versionResponse.data.version.webAppUrl,
                          id: versionResponse.data.version.id
                        };
                        setSelectedIterationGeneration(updatedGen as WebAppGeneration);
                      }
                    } catch (error) { }
                  }
                }}
                currentVersion={currentIterationVersion}
                onVersionChange={async (version: number) => {
                  setCurrentIterationVersion(version);

                  if (version === 0) {
                    // Show base version (original generation)
                    try {
                      const versionsResponse = await webAppService.getVersionHistory(lastCompletedGeneration.id);
                      if (versionsResponse.data?.versions) {
                        const baseVersion = versionsResponse.data.versions.find((v: any) =>
                          v.versionNumber === 0 || v.versionNumber === undefined
                        );

                        if (baseVersion && baseVersion.webAppUrl) {
                          const baseGenWithVersion = {
                            ...lastCompletedGeneration,
                            webAppUrl: baseVersion.webAppUrl,
                            id: baseVersion.id,
                            versionNumber: 0,
                            status: baseVersion.status || 'completed'
                          }; setSelectedIterationGeneration(baseGenWithVersion as WebAppGeneration);
                        } else {
                          // Fallback: try fetching the generation directly
                          const baseGenResponse = await webAppService.getGeneration(lastCompletedGeneration.id);
                          if (baseGenResponse.data?.generation) {
                            const baseGen = baseGenResponse.data.generation;
                            if (baseGen.webAppUrl) {
                              const baseGenWithVersion = {
                                ...lastCompletedGeneration,
                                webAppUrl: baseGen.webAppUrl,
                                id: baseGen.id,
                                versionNumber: 0
                              }; setSelectedIterationGeneration(baseGenWithVersion as WebAppGeneration);
                            } else {
                              toast.warning('Base version may not be available yet');
                            }
                          } else {
                            toast.warning('Base version not available');
                          }
                        }
                      } else {
                        // No version history, try direct fetch
                        const baseGenResponse = await webAppService.getGeneration(lastCompletedGeneration.id);
                        if (baseGenResponse.data?.generation && baseGenResponse.data.generation.webAppUrl) {
                          const baseGen = baseGenResponse.data.generation;
                          const baseGenWithVersion = {
                            ...lastCompletedGeneration,
                            webAppUrl: baseGen.webAppUrl,
                            id: baseGen.id,
                            versionNumber: 0
                          };
                          setSelectedIterationGeneration(baseGenWithVersion as WebAppGeneration);
                        } else {
                          toast.warning('Base version not available');
                        }
                      }
                    } catch (error) {
                      toast.error('Failed to load base version');
                    }
                  } else {
                    // Show the specific version
                    try {
                      const versionsResponse = await webAppService.getVersionHistory(lastCompletedGeneration.id);
                      if (versionsResponse.data?.versions) {
                        const targetVersion = versionsResponse.data.versions.find((v: any) => v.versionNumber === version);
                        if (targetVersion && targetVersion.webAppUrl) {
                          const updatedGen = {
                            ...lastCompletedGeneration,
                            webAppUrl: targetVersion.webAppUrl,
                            id: targetVersion.id,
                            versionNumber: targetVersion.versionNumber
                          };
                          setSelectedIterationGeneration(updatedGen as WebAppGeneration);
                        } else {
                          toast.warning(`Version ${version} not found or not completed yet`);
                        }
                      }
                    } catch (error) {
                      toast.error('Failed to load version');
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Reset Project Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-scale-in">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircleIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#111827]">Reset Project</h3>
                </div>
              </div>

              <p className="text-[#4b5563] mb-6">
                Are you sure you want to reset all generations for <span className="font-medium text-[#111827]">"{projectDetails?.name}"</span>? This will delete all generated prototypes and cannot be undone.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleResetProject}
                  className="px-6 py-2 text-base text-red-600 hover:text-red-800"
                >
                  Yes, Reset it.
                </button>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default DemoAppTab;