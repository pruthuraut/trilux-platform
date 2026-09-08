/** @jsxImportSource react */
'use client';
import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  BugIcon,
  CircleUser,
  ClipboardMinus,
  CodeSquare,
  FileText,
  Home,
  Menu,
  ShieldAlert,
  ShieldCheck,
  CrossIcon,
  Settings2Icon,
  ShieldEllipsisIcon,
  AlertCircleIcon,
  UserCircleIcon,
  FolderIcon,
  Smartphone,
  Globe,
  Plus,
  History,
  Activity,
  Puzzle,
  Brain,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  GitPullRequest,
  GitMerge,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Clock,
  Search,
  Shield,
  MessageCircle,
  Mic,
  Video,
  BookOpen,
  TrendingUp,
  BarChart3,
  Target,
  Lightbulb,
  Users,
  Network,
  Server,
  Database,
  Lock,
  Boxes
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ModeToggle } from "@/components/ui/mode-toggle";
import AdminSearch from "@/components/features/admin-search";
import withAuth from '@/utils/withAuth';
import { logout } from '@/utils/authUtils';
import NotificationsPopover from './NotificationsPopover';


export default withAuth(function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(pathname);
  const [isMobileTestingOpen, setIsMobileTestingOpen] = useState(false);
  const [isApiTestingOpen, setIsApiTestingOpen] = useState(false);
  const [isBrowserExtensionTestingOpen, setIsBrowserExtensionTestingOpen] = useState(false);
  const [isLlmTestingOpen, setIsLlmTestingOpen] = useState(false);
  const [isPrReviewOpen, setIsPrReviewOpen] = useState(false);
  const [isSecurityResearcherOpen, setIsSecurityResearcherOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
    // Load sidebar state from localStorage after component mounts
    try {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        setIsCollapsed(JSON.parse(savedState));
      }
    } catch (error) {
      console.warn('Failed to load sidebar state from localStorage:', error);
    }
  }, []);

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    if (isClient) {
      try {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
      } catch (error) {
        console.warn('Failed to save sidebar state to localStorage:', error);
      }
    }
  }, [isCollapsed, isClient]);

  // Auto-collapse submenus when sidebar is collapsed
  useEffect(() => {
    if (isCollapsed) {
      setIsMobileTestingOpen(false);
      setIsApiTestingOpen(false);
      setIsBrowserExtensionTestingOpen(false);
      setIsLlmTestingOpen(false);
      setIsPrReviewOpen(false);
      setIsSecurityResearcherOpen(false);
    }
  }, [isCollapsed]);

  // Keyboard shortcut to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'b') {
        event.preventDefault();
        setIsCollapsed(!isCollapsed);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCollapsed]);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };
  const handleLogout = () => {
    logout();
  };
  const ProfileMenuItem = ({ icon: Icon, children, onClick }: {
    icon: React.ElementType;
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <DropdownMenuItem
      onClick={onClick}
      className="flex items-center gap-2 cursor-pointer text-sm px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/20"
    >
      <Icon className="h-4 w-4" />
      {children}
    </DropdownMenuItem>
  );
  const NavLink = ({ href, icon: Icon, children, onMobileClick }: {
    href: string;
    icon: React.ElementType;
    children: React.ReactNode;
    onMobileClick?: () => void;
  }) => {
    const isActive = activeTab === href;
    const handleClick = () => {
      handleTabClick(href);
      if (onMobileClick) {
        onMobileClick();
      }
    };

    if (isCollapsed) {
      return (
        <div className="relative group overflow-visible sidebar-nav-item">
          <Link
            href={href}
            onClick={handleClick}
            className={`tooltip-trigger flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-primary/10 active:bg-primary/15 justify-center ${isActive
              ? 'bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary-foreground'
              : 'text-muted-foreground hover:text-primary'
              }`}
            title={children as string} // Fallback native tooltip
          >
            <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-primary dark:text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
              }`} />
          </Link>
          <div className="sidebar-tooltip">
            {children}
          </div>
        </div>
      );
    }

    return (
      <Link
        href={href}
        onClick={handleClick}
        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-primary/10 active:bg-primary/15 ${isActive
          ? 'bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary-foreground'
          : 'text-muted-foreground hover:text-primary'
          }`}
      >
        <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-primary dark:text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
          }`} />
        {!isCollapsed && <span>{children}</span>}
      </Link>
    );
  };

  // Component for category buttons when collapsed (shows tooltip but no action)
  const CategoryButton = ({ icon: Icon, children }: {
    icon: React.ElementType;
    children: React.ReactNode;
  }) => {
    return (
      <>
        <div className="h-px bg-border mx-3 my-1"></div>
        <div className="relative group overflow-visible sidebar-nav-item">
          <div
            className="tooltip-trigger flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-default"
            title={children as string} // Fallback native tooltip
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="sidebar-tooltip">
            {children}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Fixed Sidebar */}
      <div className={`fixed hidden h-screen border-r bg-card dark:bg-card/95 md:block sidebar-transition overflow-visible ${isCollapsed ? 'w-[60px]' : 'w-[240px] lg:w-[280px]'
        }`}>
        <div className="flex h-full flex-col">
          {/* Header - Fixed */}
          <div className="sticky top-0 z-10 flex h-14 items-center border-b bg-card/50 px-3 sm:px-4 backdrop-blur-sm lg:h-[60px] lg:px-6">
            {!isCollapsed && (
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-lg font-bold tracking-tight">TRILUX</span>
              </Link>
            )}
            {isCollapsed && (
              <div className="flex items-center justify-center w-full h-14">
                <Link href="/" className="flex items-center justify-center h-9 w-9 rounded-md hover:bg-primary/10 transition-colors" title="Trilux Dashboard">
                  <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
                </Link>
              </div>
            )}
            {/* Collapse/Expand Toggle Button - moved to sidebar header */}
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="ml-auto h-9 w-9 hover:bg-primary/10 transition-colors flex-shrink-0"
                title={`Collapse sidebar (Ctrl+B)`}
              >
                <PanelLeftClose className="h-4 w-4" />
                <span className="sr-only">Toggle sidebar</span>
              </Button>
            )}
          </div>

          {/* Navigation - Scrollable */}
          <div className="flex flex-col flex-grow overflow-y-auto overflow-x-visible hide-scrollbar custom-scrollbar">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-2 overflow-visible">
              <NavLink href="/" icon={Home}>Dashboard</NavLink>
              <NavLink href="/project" icon={FolderIcon}>
                Projects
              </NavLink>
              <NavLink href="/recon" icon={BugIcon}>
                Dynamic Testing
              </NavLink>
              <NavLink href="/static-analysis" icon={CodeSquare}>
                Static Analysis
              </NavLink>
              <NavLink href="/software-composition" icon={Boxes}>
                SCA
              </NavLink>

              <NavLink href="/vulnerability" icon={ShieldAlert}>
                Vulnerabilities
              </NavLink>

              {/* Mobile App Testing Submenu */}
              {!isCollapsed && (
                <div className="relative">
                  <button
                    onClick={() => setIsMobileTestingOpen(!isMobileTestingOpen)}
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-primary/10 ${activeTab.includes('mobile-app-testing') ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                      }`}
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Mobile App Testing</span>
                    {isMobileTestingOpen ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </button>
                  {isMobileTestingOpen && (
                    <div className="ml-4 mt-1 grid gap-1 pl-4 border-l">
                      <NavLink href="/mobile-app-testing" icon={Plus}>
                        Create Analysis
                      </NavLink>
                      <NavLink href="/mobile-app-testing/history" icon={History}>
                        Analysis History
                      </NavLink>
                      <NavLink href="/mobile-app-testing/reports" icon={Activity}>
                        Analysis Reports
                      </NavLink>
                    </div>
                  )}
                </div>
              )}
              {isCollapsed && (
                <>
                  <CategoryButton icon={Smartphone}>Mobile App Testing</CategoryButton>
                  <NavLink href="/mobile-app-testing" icon={Plus}>
                    Create Mobile Analysis
                  </NavLink>
                  <NavLink href="/mobile-app-testing/history" icon={History}>
                    Mobile Analysis History
                  </NavLink>
                  <NavLink href="/mobile-app-testing/reports" icon={Activity}>
                    Mobile Analysis Reports
                  </NavLink>
                </>
              )}

              {/* API Testing Submenu */}
              {!isCollapsed && (
                <div className="relative">
                  <button
                    onClick={() => setIsApiTestingOpen(!isApiTestingOpen)}
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-primary/10 ${activeTab.includes('api-testing') ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                      }`}
                  >
                    <Globe className="h-4 w-4" />
                    <span>API Testing</span>
                    {isApiTestingOpen ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </button>
                  {isApiTestingOpen && (
                    <div className="ml-4 mt-1 grid gap-1 pl-4 border-l">
                      <NavLink href="/api-testing" icon={Plus}>
                        Create Analysis
                      </NavLink>
                      <NavLink href="/api-testing/history" icon={History}>
                        Analysis History
                      </NavLink>
                      <NavLink href="/api-testing/reports" icon={Activity}>
                        Analysis Reports
                      </NavLink>
                    </div>
                  )}
                </div>
              )}
              {isCollapsed && (
                <>
                  <CategoryButton icon={Globe}>API Testing</CategoryButton>
                  <NavLink href="/api-testing" icon={Plus}>
                    Create API Analysis
                  </NavLink>
                  <NavLink href="/api-testing/history" icon={History}>
                    API Analysis History
                  </NavLink>
                  <NavLink href="/api-testing/reports" icon={Activity}>
                    API Analysis Reports
                  </NavLink>
                </>
              )}

              {/* Extension Testing Submenu */}
              {!isCollapsed && (
                <div className="relative">
                  <button
                    onClick={() => setIsBrowserExtensionTestingOpen(!isBrowserExtensionTestingOpen)}
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-primary/10 ${activeTab.includes('browser-extension-testing') ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                      }`}
                  >
                    <Puzzle className="h-4 w-4" />
                    <span>Extension Testing</span>
                    {isBrowserExtensionTestingOpen ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </button>
                  {isBrowserExtensionTestingOpen && (
                    <div className="ml-4 mt-1 grid gap-1 pl-4 border-l">
                      <NavLink href="/browser-extension-testing" icon={Plus}>
                        Create Analysis
                      </NavLink>
                      <NavLink href="/browser-extension-testing/history" icon={History}>
                        Analysis History
                      </NavLink>
                      <NavLink href="/browser-extension-testing/reports" icon={Activity}>
                        Analysis Reports
                      </NavLink>
                    </div>
                  )}
                </div>
              )}
              {isCollapsed && (
                <>
                  <CategoryButton icon={Puzzle}>Extension Testing</CategoryButton>
                  <NavLink href="/browser-extension-testing" icon={Plus}>
                    Create Extension Analysis
                  </NavLink>
                  <NavLink href="/browser-extension-testing/history" icon={History}>
                    Extension Analysis History
                  </NavLink>
                  <NavLink href="/browser-extension-testing/reports" icon={Activity}>
                    Extension Analysis Reports
                  </NavLink>
                </>
              )}

              {/* LLM Testing Submenu */}
              {!isCollapsed && (
                <div className="relative">
                  <button
                    onClick={() => setIsLlmTestingOpen(!isLlmTestingOpen)}
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-primary/10 ${activeTab.includes('llm-testing') ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                      }`}
                  >
                    <Brain className="h-4 w-4" />
                    <span>LLM Testing</span>
                    {isLlmTestingOpen ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </button>
                  {isLlmTestingOpen && (
                    <div className="ml-4 mt-1 grid gap-1 pl-4 border-l">
                      <NavLink href="/llm-testing" icon={Zap}>
                        Real-time Gateway
                      </NavLink>
                      <NavLink href="/llm-testing/history" icon={History}>
                        Request History
                      </NavLink>
                      <NavLink href="/llm-testing/reports" icon={Activity}>
                        Security Reports
                      </NavLink>
                    </div>
                  )}
                </div>
              )}
              {isCollapsed && (
                <>
                  <CategoryButton icon={Brain}>LLM Testing</CategoryButton>
                  <NavLink href="/llm-testing" icon={Zap}>
                    LLM Real-time Gateway
                  </NavLink>
                  <NavLink href="/llm-testing/history" icon={History}>
                    LLM Request History
                  </NavLink>
                  <NavLink href="/llm-testing/reports" icon={Activity}>
                    LLM Security Reports
                  </NavLink>
                </>
              )}

              {/* PR Review Submenu */}
              {!isCollapsed && (
                <div className="relative">
                  <button
                    onClick={() => setIsPrReviewOpen(!isPrReviewOpen)}
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-primary/10 ${activeTab.includes('pr-review') ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                      }`}
                  >
                    <GitPullRequest className="h-4 w-4" />
                    <span>PR Review</span>
                    {isPrReviewOpen ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </button>
                  {isPrReviewOpen && (
                    <div className="ml-4 mt-1 grid gap-1 pl-4 border-l">
                      <NavLink href="/pr-review" icon={Eye}>
                        Active Reviews
                      </NavLink>
                      <NavLink href="/pr-review/queue" icon={Clock}>
                        Review Queue
                      </NavLink>
                      <NavLink href="/pr-review/analytics" icon={Activity}>
                        Analytics
                      </NavLink>
                      <NavLink href="/pr-review/settings" icon={Settings2Icon}>
                        Review Settings
                      </NavLink>
                    </div>
                  )}
                </div>
              )}
              {isCollapsed && (
                <>
                  <CategoryButton icon={GitPullRequest}>PR Review</CategoryButton>
                  <NavLink href="/pr-review" icon={Eye}>
                    Active PR Reviews
                  </NavLink>
                  <NavLink href="/pr-review/queue" icon={Clock}>
                    PR Review Queue
                  </NavLink>
                  <NavLink href="/pr-review/analytics" icon={Activity}>
                    PR Analytics
                  </NavLink>
                  <NavLink href="/pr-review/settings" icon={Settings2Icon}>
                    PR Review Settings
                  </NavLink>
                </>
              )}

              {/* Security Researcher Submenu */}
              {!isCollapsed && (
                <div className="relative">
                  <button
                    onClick={() => setIsSecurityResearcherOpen(!isSecurityResearcherOpen)}
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-primary/10 ${activeTab.includes('security-researcher') ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                      }`}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Security Researcher</span>
                    {isSecurityResearcherOpen ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </button>
                  {isSecurityResearcherOpen && (
                    <div className="ml-4 mt-1 grid gap-1 pl-4 border-l">
                      <NavLink href="/security-researcher" icon={Search}>
                        Research Hub
                      </NavLink>
                      <NavLink href="/security-researcher/chat" icon={MessageCircle}>
                        AI Security Chat
                      </NavLink>
                      <NavLink href="/security-researcher/voice" icon={Mic}>
                        Voice Assistant
                      </NavLink>
                      <NavLink href="/security-researcher/video" icon={Video}>
                        Video Analysis
                      </NavLink>
                      <NavLink href="/security-researcher/knowledge" icon={BookOpen}>
                        Knowledge Base
                      </NavLink>
                      <NavLink href="/security-researcher/trends" icon={TrendingUp}>
                        Security Trends
                      </NavLink>
                      <NavLink href="/security-researcher/metrics" icon={BarChart3}>
                        Risk Metrics
                      </NavLink>
                      <NavLink href="/security-researcher/threat-intel" icon={Target}>
                        Threat Intelligence
                      </NavLink>
                      <NavLink href="/security-researcher/ai-insights" icon={Lightbulb}>
                        AI Insights
                      </NavLink>
                      <NavLink href="/security-researcher/collaboration" icon={Users}>
                        Team Collaboration
                      </NavLink>
                      <NavLink href="/security-researcher/network-analysis" icon={Network}>
                        Network Analysis
                      </NavLink>
                      <NavLink href="/security-researcher/infrastructure" icon={Server}>
                        Infrastructure Security
                      </NavLink>
                      <NavLink href="/security-researcher/data-security" icon={Database}>
                        Data Security
                      </NavLink>
                      <NavLink href="/security-researcher/compliance" icon={Lock}>
                        Compliance Center
                      </NavLink>
                    </div>
                  )}
                </div>
              )}
              {isCollapsed && (
                <>
                  <CategoryButton icon={Shield}>Security Researcher</CategoryButton>
                  <NavLink href="/security-researcher" icon={Search}>
                    Research Hub
                  </NavLink>
                  <NavLink href="/security-researcher/chat" icon={MessageCircle}>
                    AI Security Chat
                  </NavLink>
                  <NavLink href="/security-researcher/voice" icon={Mic}>
                    Voice Assistant
                  </NavLink>
                  <NavLink href="/security-researcher/video" icon={Video}>
                    Video Analysis
                  </NavLink>
                  <NavLink href="/security-researcher/knowledge" icon={BookOpen}>
                    Knowledge Base
                  </NavLink>
                  <NavLink href="/security-researcher/trends" icon={TrendingUp}>
                    Security Trends
                  </NavLink>
                  <NavLink href="/security-researcher/metrics" icon={BarChart3}>
                    Risk Metrics
                  </NavLink>
                  <NavLink href="/security-researcher/threat-intel" icon={Target}>
                    Threat Intelligence
                  </NavLink>
                  <NavLink href="/security-researcher/ai-insights" icon={Lightbulb}>
                    AI Insights
                  </NavLink>
                  <NavLink href="/security-researcher/collaboration" icon={Users}>
                    Team Collaboration
                  </NavLink>
                  <NavLink href="/security-researcher/network-analysis" icon={Network}>
                    Network Analysis
                  </NavLink>
                  <NavLink href="/security-researcher/infrastructure" icon={Server}>
                    Infrastructure Security
                  </NavLink>
                  <NavLink href="/security-researcher/data-security" icon={Database}>
                    Data Security
                  </NavLink>
                  <NavLink href="/security-researcher/compliance" icon={Lock}>
                    Compliance Center
                  </NavLink>
                </>
              )}

              <NavLink href="/reports" icon={ClipboardMinus}>
                Reports
              </NavLink>
              <NavLink href="/security-policies" icon={ShieldEllipsisIcon}>
                Security Policies
              </NavLink>
              <NavLink href="/access-control" icon={UserCircleIcon}>
                User Access Control
              </NavLink>
              <NavLink href="/sercurity-alerts" icon={AlertCircleIcon}>
                Security Alerts
              </NavLink>
              <NavLink href="/settings" icon={Settings2Icon}>
                Settings
              </NavLink>

            </nav>

            {/* Upgrade Card - Fixed at bottom */}
            {!isCollapsed && (
              <div className="mt-auto flex flex-col items-center">
                <Card className="bg-background/90 border border-border shadow-lg backdrop-blur-md rounded-2xl">
                  <CardHeader className="p-6 pb-3">
                    <CardTitle className="text-lg font-semibold text-primary">🚀 Developed with Gemini 3</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      This application is in <strong>BETA</strong> and not available for public use.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="p-4 pt-2 flex w-full">
                    <Button
                      size="sm"
                      className="w-full transition-all duration-300 
            bg-green-500 text-black dark:bg-neon-green-400 dark:text-white 
            hover:bg-green-600 dark:hover:bg-neon-green-500" onClick={() => window.open('https://www.trilux.dev', '_blank')}
                    >
                      Learn More
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}


          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex flex-1 flex-col sidebar-transition ${isCollapsed ? 'md:ml-[60px]' : 'md:ml-[240px] lg:ml-[280px]'
        }`}>
        {/* Fixed Header */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 sm:gap-4 border-b bg-card/50 px-3 sm:px-4 backdrop-blur-sm lg:h-[60px] lg:px-6">
          {/* Expand Toggle Button - only when collapsed */}
          {isCollapsed && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden md:flex shrink-0 h-9 w-9 hover:bg-primary/10 transition-colors border border-border"
                title={`Expand sidebar (Ctrl+B)`}
              >
                <PanelLeftOpen className="h-4 w-4" />
                <span className="sr-only">Toggle sidebar</span>
              </Button>
              <div className="hidden md:block h-6 w-px bg-border mx-2"></div>
            </>
          )}

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>

            {/* Mobile brand name */}
            <div className="flex items-center gap-2 md:hidden mr-2">
              <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="font-bold text-base truncate">TRILUX</span>
            </div>
            <SheetContent side="left" className="w-80 sm:w-72">
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-2 py-4 border-b">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  <span className="text-lg font-bold">TRILUX</span>
                </div>
                <nav className="grid gap-2 text-sm overflow-y-auto hide-scrollbar custom-scrollbar">
                  <NavLink href="/" icon={Home} onMobileClick={() => setIsMobileMenuOpen(false)}>Dashboard</NavLink>
                  <NavLink href="/project" icon={FolderIcon} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Projects
                  </NavLink>
                  <NavLink href="/recon" icon={BugIcon} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Dynamic Testing
                  </NavLink>
                  <NavLink href="/static-analysis" icon={CodeSquare} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Static Analysis
                  </NavLink>
                  <NavLink href="/software-composition" icon={Boxes} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    SCA
                  </NavLink>
                  <NavLink href="/vulnerability" icon={ShieldAlert} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Vulnerabilities
                  </NavLink>

                  {/* Testing Section */}
                  <div className="mt-4 mb-2">
                    <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Testing
                    </div>
                  </div>
                  <NavLink href="/mobile-app-testing" icon={Smartphone} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Mobile App Testing
                  </NavLink>
                  <NavLink href="/mobile-app-testing/history" icon={History} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Mobile Analysis History
                  </NavLink>
                  <NavLink href="/api-testing" icon={Globe} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    API Testing
                  </NavLink>
                  <NavLink href="/api-testing/history" icon={History} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    API Analysis History
                  </NavLink>
                  <NavLink href="/browser-extension-testing" icon={Puzzle} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Extension Testing
                  </NavLink>
                  <NavLink href="/browser-extension-testing/history" icon={History} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Extension Analysis History
                  </NavLink>
                  <NavLink href="/llm-testing" icon={Brain} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    LLM Testing
                  </NavLink>
                  <NavLink href="/llm-testing/history" icon={History} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    LLM Request History
                  </NavLink>

                  {/* PR Review Section */}
                  <div className="mt-4 mb-2">
                    <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      PR Review
                    </div>
                  </div>
                  <NavLink href="/pr-review" icon={Eye} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Active Reviews
                  </NavLink>
                  <NavLink href="/pr-review/queue" icon={Clock} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Review Queue
                  </NavLink>
                  <NavLink href="/pr-review/analytics" icon={Activity} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Analytics
                  </NavLink>
                  <NavLink href="/pr-review/settings" icon={Settings2Icon} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Review Settings
                  </NavLink>

                  {/* Security Researcher Section */}
                  <div className="mt-4 mb-2">
                    <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Security Researcher
                    </div>
                  </div>
                  <NavLink href="/security-researcher" icon={Search} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Research Hub
                  </NavLink>
                  <NavLink href="/security-researcher/chat" icon={MessageCircle} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    AI Security Chat
                  </NavLink>
                  <NavLink href="/security-researcher/voice" icon={Mic} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Voice Assistant
                  </NavLink>
                  <NavLink href="/security-researcher/video" icon={Video} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Video Analysis
                  </NavLink>
                  <NavLink href="/security-researcher/knowledge" icon={BookOpen} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Knowledge Base
                  </NavLink>
                  <NavLink href="/security-researcher/trends" icon={TrendingUp} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Security Trends
                  </NavLink>
                  <NavLink href="/security-researcher/metrics" icon={BarChart3} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Risk Metrics
                  </NavLink>
                  <NavLink href="/security-researcher/threat-intel" icon={Target} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Threat Intelligence
                  </NavLink>
                  <NavLink href="/security-researcher/ai-insights" icon={Lightbulb} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    AI Insights
                  </NavLink>
                  <NavLink href="/security-researcher/collaboration" icon={Users} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Team Collaboration
                  </NavLink>
                  <NavLink href="/security-researcher/network-analysis" icon={Network} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Network Analysis
                  </NavLink>
                  <NavLink href="/security-researcher/infrastructure" icon={Server} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Infrastructure Security
                  </NavLink>
                  <NavLink href="/security-researcher/data-security" icon={Database} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Data Security
                  </NavLink>
                  <NavLink href="/security-researcher/compliance" icon={Lock} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Compliance Center
                  </NavLink>

                  {/* Management Section */}
                  <div className="mt-4 mb-2">
                    <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Management
                    </div>
                  </div>
                  <NavLink href="/reports" icon={ClipboardMinus} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Reports
                  </NavLink>
                  <NavLink href="/security-policies" icon={ShieldEllipsisIcon} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Security Policies
                  </NavLink>
                  <NavLink href="/access-control" icon={UserCircleIcon} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    User Access Control
                  </NavLink>
                  <NavLink href="/sercurity-alerts" icon={AlertCircleIcon} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Security Alerts
                  </NavLink>
                  <NavLink href="/settings" icon={Settings2Icon} onMobileClick={() => setIsMobileMenuOpen(false)}>
                    Settings
                  </NavLink>
                </nav>
                <div className="mt-auto flex flex-col items-center">
                  <Card className="bg-background/90 border border-border shadow-lg backdrop-blur-md rounded-2xl">
                    <CardHeader className="p-6 pb-3">
                      <CardTitle className="text-lg font-semibold text-primary">🚀 Developed with Gemini 3</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        This application is in <strong>BETA</strong> and not available for public use.
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="p-4 pt-2 flex w-full">
                      <Button
                        size="sm"
                        className="w-full transition-all duration-300 
          bg-green-500 text-black dark:bg-neon-green-400 dark:text-white 
          hover:bg-green-600 dark:hover:bg-neon-green-500" onClick={() => window.open('https://www.trilux.dev', '_blank')}>
                        Learn More
                      </Button>
                    </CardFooter>
                  </Card>
                </div>


              </div>
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1 min-w-0">
            <AdminSearch />
          </div>

          {/* Right side icons with better spacing */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Notifications - moved to main header for better accessibility */}
            <NotificationsPopover />

            <ModeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-primary/10 transition-colors">
                  <CircleUser className="h-5 w-5" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* on My Account click go to the /account page */}
                <DropdownMenuLabel onClick={() => router.push('/account')}>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/support')} >Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500 dark:text-red-400" onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
});