"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../ui/input";
import { Search, FileText, ArrowRight, X } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

// Comprehensive list of all pages with metadata and search aliases
const allPages = [
  // Main Dashboard
  { path: "/", title: "Dashboard", description: "Main dashboard overview", keywords: ["home", "dashboard", "overview", "main", "start", "index"] },
  
  // Project Management
  { path: "/project", title: "Projects", description: "Manage your security projects", keywords: ["projects", "manage", "create", "list", "project"] },
  
  // Analysis Pages
  { path: "/recon", title: "Dynamic Testing", description: "Runtime security scanning & attack-surface recon pipeline", keywords: ["dynamic", "runtime", "scan", "security", "vulnerability", "dast", "scanner", "recon", "attack surface", "subdomain", "nuclei"] },
  { path: "/static-analysis", title: "Static Analysis", description: "Code-level security inspection", keywords: ["static", "code", "inspection", "security", "analysis", "sast", "source"] },
  { path: "/vulnerability", title: "Vulnerabilities", description: "View and manage security vulnerabilities", keywords: ["vulnerability", "security", "threats", "issues", "vuln", "cve", "weaknesses"] },
  
  // Testing Pages
  { path: "/mobile-app-testing", title: "Mobile App Testing", description: "Mobile application security testing", keywords: ["mobile", "app", "android", "ios", "testing", "device", "smartphone"] },
  { path: "/mobile-app-testing/history", title: "Mobile Analysis History", description: "History of mobile app analyses", keywords: ["mobile", "history", "past", "analyses", "log", "records"] },
  { path: "/mobile-app-testing/reports", title: "Mobile Analysis Reports", description: "Reports from mobile app testing", keywords: ["mobile", "reports", "results", "findings", "output"] },
  
  { path: "/api-testing", title: "API Testing", description: "API security testing and analysis", keywords: ["api", "endpoint", "rest", "testing", "security", "web", "service", "http"] },
  { path: "/api-testing/history", title: "API Testing History", description: "History of API security tests", keywords: ["api", "history", "past", "tests", "log", "records"] },
  { path: "/api-testing/reports", title: "API Testing Reports", description: "Reports from API security testing", keywords: ["api", "reports", "results", "findings", "output"] },
  
  { path: "/browser-extension-testing", title: "Browser Extension Testing", description: "Browser extension security testing", keywords: ["browser", "extension", "chrome", "firefox", "testing", "addon", "plugin"] },
  { path: "/browser-extension-testing/history", title: "Extension Testing History", description: "History of extension security tests", keywords: ["extension", "history", "past", "tests", "log", "records"] },
  { path: "/browser-extension-testing/reports", title: "Extension Testing Reports", description: "Reports from extension testing", keywords: ["extension", "reports", "results", "findings", "output"] },
  
  { path: "/llm-testing", title: "LLM Testing", description: "AI/LLM security testing gateway", keywords: ["llm", "ai", "artificial", "intelligence", "testing", "security", "ml", "chatgpt", "gpt"] },
  { path: "/llm-testing/history", title: "LLM Request History", description: "History of LLM security requests", keywords: ["llm", "history", "requests", "past", "log", "records"] },
  { path: "/llm-testing/reports", title: "LLM Security Reports", description: "Security reports from LLM testing", keywords: ["llm", "reports", "security", "results", "findings", "output"] },
  
  // PR Review System
  { path: "/pr-review", title: "PR Review", description: "Active pull request reviews", keywords: ["pr", "pull", "request", "review", "code", "github", "git"] },
  { path: "/pr-review/queue", title: "Review Queue", description: "Queue of pending reviews", keywords: ["queue", "pending", "review", "waiting", "list"] },
  { path: "/pr-review/analytics", title: "PR Analytics", description: "Analytics for pull request reviews", keywords: ["analytics", "metrics", "pr", "review", "stats", "data"] },
  { path: "/pr-review/settings", title: "PR Review Settings", description: "Configure PR review settings", keywords: ["settings", "configure", "pr", "review", "config", "preferences"] },
  
  // Security Researcher Tools
  { path: "/security-researcher", title: "Security Research Hub", description: "Security research tools and hub", keywords: ["research", "security", "tools", "hub", "researcher", "pentesting"] },
  { path: "/security-researcher/chat", title: "AI Security Chat", description: "Chat with AI security assistant", keywords: ["chat", "ai", "assistant", "security", "conversation", "help"] },
  { path: "/security-researcher/voice", title: "Voice Assistant", description: "Voice-powered security assistant", keywords: ["voice", "assistant", "audio", "speech", "talk", "speak"] },
  { path: "/security-researcher/video", title: "Video Analysis", description: "Video-based security analysis", keywords: ["video", "analysis", "visual", "media", "recording", "screen"] },
  { path: "/security-researcher/knowledge", title: "Knowledge Base", description: "Security knowledge and documentation", keywords: ["knowledge", "docs", "documentation", "wiki", "articles", "guides"] },
  { path: "/security-researcher/trends", title: "Security Trends", description: "Latest security trends and insights", keywords: ["trends", "insights", "latest", "security", "news", "updates"] },
  { path: "/security-researcher/metrics", title: "Risk Metrics", description: "Security risk metrics and analysis", keywords: ["metrics", "risk", "analysis", "kpi", "dashboard", "stats"] },
  { path: "/security-researcher/threat-intel", title: "Threat Intelligence", description: "Threat intelligence and monitoring", keywords: ["threat", "intelligence", "monitoring", "intel", "feeds", "indicators"] },
  { path: "/security-researcher/ai-insights", title: "AI Insights", description: "AI-powered security insights", keywords: ["ai", "insights", "intelligence", "analysis", "ml", "recommendations"] },
  { path: "/security-researcher/collaboration", title: "Team Collaboration", description: "Collaborate with security team", keywords: ["collaboration", "team", "sharing", "work", "together", "group"] },
  { path: "/security-researcher/network-analysis", title: "Network Analysis", description: "Network security analysis tools", keywords: ["network", "analysis", "infrastructure", "topology", "scan", "mapping"] },
  { path: "/security-researcher/infrastructure", title: "Infrastructure Security", description: "Infrastructure security management", keywords: ["infrastructure", "security", "servers", "cloud", "systems", "architecture"] },
  { path: "/security-researcher/data-security", title: "Data Security", description: "Data protection and security", keywords: ["data", "protection", "privacy", "security", "encryption", "backup"] },
  { path: "/security-researcher/compliance", title: "Compliance Center", description: "Security compliance management", keywords: ["compliance", "regulations", "standards", "audit", "gdpr", "sox", "iso"] },
  
  // Reports and Management
  { path: "/reports", title: "Reports", description: "Security reports and analytics", keywords: ["reports", "analytics", "results", "findings", "dashboard", "summary"] },
  { path: "/security-policies", title: "Security Policies", description: "Manage security policies", keywords: ["policies", "rules", "security", "governance", "procedures", "guidelines"] },
  { path: "/access-control", title: "User Access Control", description: "Manage user access and permissions", keywords: ["access", "control", "users", "permissions", "roles", "rbac", "auth"] },
  { path: "/sercurity-alerts", title: "Security Alerts", description: "Security alerts and notifications", keywords: ["alerts", "notifications", "security", "warnings", "incidents", "events"] },
  
  // Settings and Configuration
  { path: "/settings", title: "Settings", description: "Application settings and configuration", keywords: ["settings", "config", "configuration", "preferences", "options", "admin"] },
  { path: "/account", title: "My Account", description: "Manage your account settings", keywords: ["account", "profile", "user", "personal", "me", "my"] },
  
  // Authentication
  { path: "/login", title: "Login", description: "Sign in to your account", keywords: ["login", "signin", "authentication", "access", "enter", "auth"] },
  { path: "/register", title: "Register", description: "Create a new account", keywords: ["register", "signup", "create", "account", "join", "new"] },
  { path: "/forgot-password", title: "Forgot Password", description: "Reset your password", keywords: ["forgot", "password", "reset", "recovery", "lost", "recover"] },
  { path: "/reset-password", title: "Reset Password", description: "Reset your password", keywords: ["reset", "password", "change", "new", "update"] },
  { path: "/verify", title: "Verify Account", description: "Verify your email address", keywords: ["verify", "email", "confirmation", "activate", "validation"] },
  
  // Additional Pages
  { path: "/addllmmodels", title: "Add LLM Models", description: "Add and configure LLM models", keywords: ["llm", "models", "add", "configure", "ai", "setup", "install"] },
  { path: "/logs", title: "System Logs", description: "View system logs and activity", keywords: ["logs", "activity", "system", "audit", "events", "history"] },
  { path: "/orders", title: "Orders", description: "Manage orders and subscriptions", keywords: ["orders", "subscriptions", "billing", "purchase", "payment", "invoice"] },
  { path: "/prompts", title: "Prompts", description: "Manage AI prompts and templates", keywords: ["prompts", "templates", "ai", "queries", "examples", "samples"] },
  { path: "/support", title: "Support", description: "Get help and support", keywords: ["support", "help", "assistance", "contact", "tickets", "faq"] },
  { path: "/unsafe-functions", title: "Unsafe Functions", description: "Manage unsafe function detection", keywords: ["unsafe", "functions", "detection", "security", "dangerous", "risky"] },
];

export default function AdminSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredPages, setFilteredPages] = useState<typeof allPages>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter pages based on search query with improved matching
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPages([]);
      setIsOpen(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allPages.filter(page => {
      // Exact title match gets highest priority
      if (page.title.toLowerCase() === query) return true;
      
      // Title starts with query
      if (page.title.toLowerCase().startsWith(query)) return true;
      
      // Title contains query
      if (page.title.toLowerCase().includes(query)) return true;
      
      // Keywords exact match
      if (page.keywords.some(keyword => keyword === query)) return true;
      
      // Keywords starts with query
      if (page.keywords.some(keyword => keyword.startsWith(query))) return true;
      
      // Keywords contains query
      if (page.keywords.some(keyword => keyword.includes(query))) return true;
      
      // Description contains query
      if (page.description.toLowerCase().includes(query)) return true;
      
      // Path contains query (without leading slash)
      if (page.path.toLowerCase().replace('/', '').includes(query)) return true;
      
      return false;
    });

    // Sort results by relevance
    const sortedFiltered = filtered.sort((a, b) => {
      // Exact title match first
      const aExactTitle = a.title.toLowerCase() === query;
      const bExactTitle = b.title.toLowerCase() === query;
      if (aExactTitle && !bExactTitle) return -1;
      if (!aExactTitle && bExactTitle) return 1;
      
      // Title starts with query
      const aTitleStarts = a.title.toLowerCase().startsWith(query);
      const bTitleStarts = b.title.toLowerCase().startsWith(query);
      if (aTitleStarts && !bTitleStarts) return -1;
      if (!aTitleStarts && bTitleStarts) return 1;
      
      // Keyword exact match
      const aKeywordExact = a.keywords.some(k => k === query);
      const bKeywordExact = b.keywords.some(k => k === query);
      if (aKeywordExact && !bKeywordExact) return -1;
      if (!aKeywordExact && bKeywordExact) return 1;
      
      // Default alphabetical sort
      return a.title.localeCompare(b.title);
    });

    setFilteredPages(sortedFiltered);
    setIsOpen(sortedFiltered.length > 0);
    setSelectedIndex(0);
  }, [searchQuery]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredPages.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredPages.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredPages.length) % filteredPages.length);
        break;
      case "Enter":
        e.preventDefault();
        if (filteredPages[selectedIndex]) {
          handlePageSelect(filteredPages[selectedIndex].path);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery("");
        inputRef.current?.blur();
        break;
    }
  };

  const handlePageSelect = (path: string) => {
    router.push(path);
    setIsOpen(false);
    setSearchQuery("");
    inputRef.current?.blur();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search pages, features, or navigation..."
          className="w-full appearance-none bg-background pl-8 pr-8 shadow-none md:w-2/3 lg:w-1/3 hover:bg-accent/5 focus:bg-background transition-colors"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (filteredPages.length > 0) setIsOpen(true);
          }}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-muted"
            onClick={() => {
              setSearchQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && filteredPages.length > 0 && (
        <Card className="absolute top-full left-0 w-full md:w-2/3 lg:w-1/3 mt-1 z-50 border shadow-xl bg-card/95 backdrop-blur-lg">
          <CardContent className="p-2">
            <div className="max-h-[400px] overflow-y-auto">
              {filteredPages.slice(0, 8).map((page, index) => (
                <div
                  key={page.path}
                  onClick={() => handlePageSelect(page.path)}
                  className={`flex items-center gap-3 p-3 cursor-pointer rounded-md group transition-colors ${
                    index === selectedIndex 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-accent/80"
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
                    index === selectedIndex 
                      ? "bg-primary/20" 
                      : "bg-muted group-hover:bg-primary/10"
                  }`}>
                    <FileText className={`h-4 w-4 ${
                      index === selectedIndex ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm truncate transition-colors ${
                      index === selectedIndex ? "text-primary" : "group-hover:text-primary"
                    }`}>
                      {page.title}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {page.description}
                    </div>
                    <div className="text-xs text-muted-foreground/70 truncate mt-1">
                      {page.path}
                    </div>
                  </div>
                  <ArrowRight className={`h-4 w-4 transition-all ${
                    index === selectedIndex 
                      ? "text-primary opacity-100" 
                      : "text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary"
                  }`} />
                </div>
              ))}
              
              {filteredPages.length > 8 && (
                <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
                  Showing 8 of {filteredPages.length} results
                </div>
              )}

              {/* Keyboard shortcuts hint */}
              <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
                ↑↓ Navigate • Enter Select • Esc Close
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {isOpen && searchQuery && filteredPages.length === 0 && (
        <Card className="absolute top-full left-0 w-full md:w-2/3 lg:w-1/3 mt-1 z-50 border shadow-xl bg-card/95 backdrop-blur-lg">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <Search className="h-8 w-8 text-muted-foreground/50" />
              <span className="text-sm text-muted-foreground">
                No pages found for &ldquo;{searchQuery}&rdquo;
              </span>
              <span className="text-xs text-muted-foreground/70">
                Try searching for pages, features, or settings
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
