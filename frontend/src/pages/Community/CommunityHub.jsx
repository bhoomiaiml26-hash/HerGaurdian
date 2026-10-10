import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Scale,
  FileText,
  BookmarkCheck,
  Users,
  Search,
  FileCheck,
  HelpCircle,
  MessageSquare,
  BookOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getSupportCases } from '../../services/communityService';

// Modular Sub-tabs
import CommunityHomeTab from './components/CommunityHomeTab';
import RightsAssistantTab from './components/RightsAssistantTab';
import ComplaintBuilderTab from './components/ComplaintBuilderTab';
import CaseTrackerTab from './components/CaseTrackerTab';
import SupportCirclesTab from './components/SupportCirclesTab';
import FindHelpTab from './components/FindHelpTab';
import EligibilityNavigatorTab from './components/EligibilityNavigatorTab';
import DocumentDecoderTab from './components/DocumentDecoderTab';
import LetterAssistantTab from './components/LetterAssistantTab';
import KnowledgeLibraryTab from './components/KnowledgeLibraryTab';

const tabs = [
  { id: 'dashboard', label: 'Home Dashboard', icon: LayoutDashboard },
  { id: 'assistant', label: 'Rights Assistant', icon: Scale },
  { id: 'complaint', label: 'Complaint Builder', icon: FileText },
  { id: 'tracker', label: 'My Cases & Tasks', icon: BookmarkCheck },
  { id: 'circles', label: 'Support Circles', icon: Users },
  { id: 'directory', label: 'Find Help Directory', icon: Search },
  { id: 'navigator', label: 'Eligibility Navigator', icon: FileCheck },
  { id: 'decoder', label: 'Document Decoder', icon: HelpCircle },
  { id: 'talk', label: 'Conversation Helper', icon: MessageSquare },
  { id: 'library', label: 'Rights Library', icon: BookOpen },
];

export default function CommunityHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'dashboard';

  const [cases, setCases] = useState([]);
  const [passedComplaintCategory, setPassedComplaintCategory] = useState('posh');
  const [passedComplaintFacts, setPassedComplaintFacts] = useState('');

  // Horizontal navigation scroll states & refs
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const navRef = useRef(null);
  const tabRefs = useRef({});

  // Fetch private cases count & recent list for dashboard
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await getSupportCases();
        if (res.success) {
          setCases(res.cases || []);
        }
      } catch (_err) {
        // Not authenticated or network error; cases remain empty
      }
    };
    fetchCases();
  }, []);

  // Check scroll position to dynamically show/hide scroll buttons and edge indicators
  const checkScroll = useCallback(() => {
    const container = navRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < maxScroll - 2);
  }, []);

  // Smoothly center the active tab into the visible viewport
  const scrollToActiveTab = useCallback((smooth = true) => {
    const activeEl = tabRefs.current[currentTab];
    const container = navRef.current;
    if (!activeEl || !container) return;

    const containerRect = container.getBoundingClientRect();
    const elRect = activeEl.getBoundingClientRect();

    // 44px buffer for edge buttons/gradients so tab is completely unobstructed
    const buffer = 44;
    const isClippedLeft = elRect.left < containerRect.left + buffer;
    const isClippedRight = elRect.right > containerRect.right - buffer;

    if (isClippedLeft || isClippedRight) {
      const elOffsetFromContainerLeft = elRect.left - containerRect.left + container.scrollLeft;
      const targetScrollLeft = elOffsetFromContainerLeft - (container.clientWidth / 2) + (elRect.width / 2);
      const maxScroll = container.scrollWidth - container.clientWidth;
      const boundedScroll = Math.max(0, Math.min(targetScrollLeft, maxScroll));

      container.scrollTo({
        left: boundedScroll,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, [currentTab]);

  // Click scroll buttons handler
  const scrollByDirection = (direction) => {
    const container = navRef.current;
    if (!container) return;
    const scrollAmount = Math.max(220, Math.round(container.clientWidth * 0.45));
    const targetScroll =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  };

  // Convert mouse-wheel vertical delta over navigation bar to horizontal scrolling
  useEffect(() => {
    const container = navRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (maxScroll > 1) {
          const atStart = container.scrollLeft <= 0 && e.deltaY < 0;
          const atEnd = container.scrollLeft >= maxScroll - 1 && e.deltaY > 0;

          if (!atStart && !atEnd) {
            e.preventDefault();
            container.scrollLeft += e.deltaY;
          }
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Center active tab on mount (including direct navigation via URL like ?tab=navigator)
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToActiveTab(false);
      checkScroll();
    }, 60);
    return () => clearTimeout(timer);
  }, [scrollToActiveTab, checkScroll]);

  // When active tab changes, smoothly scroll into view
  useEffect(() => {
    scrollToActiveTab(true);
    checkScroll();
  }, [currentTab, scrollToActiveTab, checkScroll]);

  // Handle window and container resize
  useEffect(() => {
    const container = navRef.current;
    if (!container) return;

    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => checkScroll());
      resizeObserver.observe(container);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [checkScroll]);

  const handleSelectTab = (tabId) => {
    setSearchParams({ tab: tabId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchToComplaint = (category, facts) => {
    setPassedComplaintCategory(category);
    setPassedComplaintFacts(facts);
    handleSelectTab('complaint');
  };

  const handleCaseCreated = (newCase) => {
    setCases((prev) => [newCase, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F7] text-[#1E1B18] pb-16 w-full max-w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 w-full min-w-0">
        {/* Module Tab Navigation Bar */}
        <nav
          aria-label="Community & Rights Navigation"
          className="relative z-20 w-full min-w-0 max-w-full rounded-2xl border border-[#EDE6E2] bg-white/95 backdrop-blur-md p-1.5 sm:p-2 shadow-xs transition-shadow"
        >
          <div className="relative flex items-center w-full min-w-0">
            {/* Left Scroll Button & Edge Fade Indicator */}
            <div
              className={`pointer-events-none absolute left-0 top-0 bottom-0 z-10 flex items-center pl-1 pr-6 bg-gradient-to-r from-white via-white/90 to-transparent rounded-l-xl transition-opacity duration-200 ${
                canScrollLeft ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <button
                type="button"
                onClick={() => scrollByDirection('left')}
                disabled={!canScrollLeft}
                tabIndex={canScrollLeft ? 0 : -1}
                aria-label="Scroll tabs left"
                className="pointer-events-auto flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-[#EDE6E2] bg-white text-[#4F4A45] shadow-xs transition-all hover:bg-[#F6EFEA] hover:text-[#8C3737] hover:border-[#8C3737]/30 focus-visible:ring-2 focus-visible:ring-[#8C3737] cursor-pointer disabled:cursor-default"
              >
                <ChevronLeft className="h-4 w-4 shrink-0" />
              </button>
            </div>

            {/* Scrollable Tabs Track */}
            <div
              ref={navRef}
              role="tablist"
              aria-label="Community & Rights Navigation Tabs"
              onScroll={checkScroll}
              className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 px-1 w-full min-w-0 scroll-smooth focus:outline-hidden"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    ref={(el) => {
                      if (el) tabRefs.current[tab.id] = el;
                    }}
                    role="tab"
                    id={`tab-${tab.id}`}
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.id}`}
                    onClick={() => handleSelectTab(tab.id)}
                    className={`inline-flex items-center gap-2 shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#8C3737] text-white shadow-xs'
                        : 'text-[#4F4A45] hover:bg-[#F6EFEA] hover:text-[#1E1B18]'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-[#8C3737]'}`} />
                    <span>{tab.label}</span>
                    {tab.id === 'tracker' && cases.length > 0 && (
                      <span
                        className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                          isActive ? 'bg-white text-[#8C3737]' : 'bg-[#F6EFEA] text-[#8C3737]'
                        }`}
                      >
                        {cases.length}
                      </span>
                    )}
                  </button>
                );
              })}
              {/* Subtle end spacer to ensure final tab has breathing room and is not clipped */}
              <div className="w-4 sm:w-6 shrink-0" aria-hidden="true" />
            </div>

            {/* Right Scroll Button & Edge Fade Indicator */}
            <div
              className={`pointer-events-none absolute right-0 top-0 bottom-0 z-10 flex items-center pr-1 pl-6 bg-gradient-to-l from-white via-white/90 to-transparent rounded-r-xl transition-opacity duration-200 ${
                canScrollRight ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <button
                type="button"
                onClick={() => scrollByDirection('right')}
                disabled={!canScrollRight}
                tabIndex={canScrollRight ? 0 : -1}
                aria-label="Scroll tabs right"
                className="pointer-events-auto flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-[#EDE6E2] bg-white text-[#4F4A45] shadow-xs transition-all hover:bg-[#F6EFEA] hover:text-[#8C3737] hover:border-[#8C3737]/30 focus-visible:ring-2 focus-visible:ring-[#8C3737] cursor-pointer disabled:cursor-default"
              >
                <ChevronRight className="h-4 w-4 shrink-0" />
              </button>
            </div>
          </div>
        </nav>

        {/* Tab Content Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            id={`panel-${currentTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${currentTab}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {currentTab === 'dashboard' && (
              <CommunityHomeTab
                onSelectTab={handleSelectTab}
                casesCount={cases.length}
                recentCases={cases}
              />
            )}

            {currentTab === 'assistant' && (
              <RightsAssistantTab
                onSwitchToComplaint={handleSwitchToComplaint}
                onCaseCreated={handleCaseCreated}
              />
            )}

            {currentTab === 'complaint' && (
              <ComplaintBuilderTab
                initialCategory={passedComplaintCategory}
                initialFacts={passedComplaintFacts}
              />
            )}

            {currentTab === 'tracker' && (
              <CaseTrackerTab onCasesChanged={setCases} />
            )}

            {currentTab === 'circles' && <SupportCirclesTab />}

            {currentTab === 'directory' && <FindHelpTab />}

            {currentTab === 'navigator' && (
              <EligibilityNavigatorTab onCaseCreated={handleCaseCreated} />
            )}

            {currentTab === 'decoder' && <DocumentDecoderTab />}

            {currentTab === 'talk' && <LetterAssistantTab />}

            {currentTab === 'library' && (
              <KnowledgeLibraryTab onSelectTab={handleSelectTab} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
