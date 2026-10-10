import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Scale,
  ArrowRight,
} from 'lucide-react';
import { communityFAQs, trustedResources } from '../../../data/communityData';

const categories = [
  'All',
  'Legal Rights & Law',
  'Workplace & POSH',
  'Emergency Safety',
  'Menstrual Health',
  'Mental Wellness',
  'Nutrition & Fitness',
];

export default function KnowledgeLibraryTab({ onSelectTab }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState(null);

  // Combine statutory law guides with community FAQs
  const combinedArticles = useMemo(() => {
    const list = [
      {
        id: 'law-1',
        category: 'Workplace & POSH',
        question: 'What are my rights under the POSH Act, 2013 if I face workplace harassment?',
        answer:
          'Under the POSH Act, every organization with 10+ employees must maintain an Internal Complaints Committee (ICC) headed by a woman. You can file a complaint within 3 months. You have the right to request interim relief (change of reporting manager, paid leave up to 3 months) and complete confidentiality. Employers cannot retaliate against complainants.',
        citation: 'POSH Act, 2013 (Section 4, 9, 12)',
        actionLabel: 'Launch Complaint Builder',
        actionTab: 'complaint',
      },
      {
        id: 'law-2',
        category: 'Legal Rights & Law',
        question: 'Do women have an automatic right to Free Legal Aid in India?',
        answer:
          'Yes. Under Section 12(c) of the Legal Services Authorities Act, 1987, ALL women, regardless of their income or financial status, are legally entitled to free legal aid from court-appointed panel advocates in civil, criminal, and family court proceedings.',
        citation: 'Legal Services Authorities Act, 1987 (Sec 12c)',
        actionLabel: 'Check Legal Aid Schemes',
        actionTab: 'navigator',
      },
      {
        id: 'law-3',
        category: 'Emergency Safety',
        question: 'What is a "Zero FIR" and can any police station refuse my complaint?',
        answer:
          'A Zero FIR can be filed at ANY police station regardless of where the incident occurred. Police officers cannot refuse to register it due to territorial jurisdiction. The station must register the Zero FIR and subsequently transfer the investigation to the jurisdictional station.',
        citation: 'Ministry of Home Affairs Advisory / CrPC / BNS',
        actionLabel: 'Find Police & SOS Helplines',
        actionTab: 'directory',
      },
      {
        id: 'law-4',
        category: 'Legal Rights & Law',
        question: 'What safeguards protect women during police interrogation and arrest?',
        answer:
          'Under Indian criminal procedure, a woman cannot be arrested after sunset and before sunrise, except in extraordinary circumstances with a Judicial Magistrate’s written order. Furthermore, female witnesses and complainants have the right to be questioned only at their residence in the presence of family or women police officers.',
        citation: 'Criminal Procedure Code (Section 46(4), 160)',
        actionLabel: 'Explore Rights Assistant',
        actionTab: 'assistant',
      },
    ];

    // Append existing FAQs
    communityFAQs.forEach((faq) => {
      let mappedCat = faq.category;
      if (mappedCat === 'Nutrition' || mappedCat === 'Fitness') {
        mappedCat = 'Nutrition & Fitness';
      }
      list.push({
        id: `faq-${faq.id}`,
        category: mappedCat,
        question: faq.question,
        answer: faq.answer,
        citation: null,
        actionLabel: null,
        actionTab: null,
      });
    });

    return list;
  }, []);

  const filteredArticles = useMemo(() => {
    return combinedArticles.filter((art) => {
      const matchCat = selectedCategory === 'All' || art.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        art.question.toLowerCase().includes(query) ||
        art.answer.toLowerCase().includes(query) ||
        art.category.toLowerCase().includes(query);

      return matchCat && matchSearch;
    });
  }, [combinedArticles, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EFEA] text-[#8C3737]">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-[#1E1B18]">
              Trusted Knowledge &amp; Rights Library
            </h2>
            <p className="text-xs text-[#78726B]">
              Verified statutory rights explainers, legal procedures, and wellness FAQs connected directly to action tools.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#78726B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rights guides, POSH rules, legal aid, or wellness FAQs..."
            className="w-full rounded-xl border border-[#EDE6E2] bg-white pl-10 pr-4 py-2.5 text-xs text-[#1E1B18] shadow-xs focus:border-[#8C3737] focus:outline-hidden"
          />
        </div>

        <div className="flex overflow-x-auto gap-1.5 pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#8C3737] text-white shadow-xs'
                  : 'border border-[#EDE6E2] bg-white text-[#4F4A45] hover:bg-[#F6EFEA]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles & FAQs Accordion List */}
      <div className="space-y-3">
        {filteredArticles.map((art) => {
          const isExpanded = expandedFaqId === art.id;

          return (
            <div
              key={art.id}
              className="rounded-2xl border border-[#EDE6E2] bg-white p-5 shadow-xs transition-colors"
            >
              <div
                onClick={() => setExpandedFaqId(isExpanded ? null : art.id)}
                className="cursor-pointer flex items-start justify-between gap-3"
              >
                <div>
                  <span className="rounded-md bg-[#F6EFEA] px-2 py-0.5 text-[10px] font-semibold text-[#8C3737]">
                    {art.category}
                  </span>
                  <h3 className="font-serif text-sm sm:text-base font-bold text-[#1E1B18] mt-1.5">
                    {art.question}
                  </h3>
                </div>
                <button className="rounded-lg p-1 text-[#78726B] hover:bg-[#F6EFEA]">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 pt-3 border-t border-[#EDE6E2] space-y-3"
                >
                  <p className="text-xs text-[#4F4A45] leading-relaxed whitespace-pre-line">
                    {art.answer}
                  </p>

                  {art.citation && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#78726B]">
                      <Scale className="h-3.5 w-3.5 text-[#8C3737]" />
                      <span>Statutory Citation: <strong className="text-[#1E1B18]">{art.citation}</strong></span>
                    </div>
                  )}

                  {art.actionLabel && art.actionTab && (
                    <div className="pt-2">
                      <button
                        onClick={() => onSelectTab(art.actionTab)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#8C3737] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#752B2B] transition-colors"
                      >
                        <span>{art.actionLabel}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Trusted External Institutional Portals */}
      <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs space-y-4">
        <h3 className="font-serif text-base font-bold text-[#1E1B18]">
          Authoritative Partner &amp; International Portals
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trustedResources.map((res) => (
            <a
              key={res.id}
              href={res.website}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-4 hover:border-[#8C3737]/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#1E1B18]">
                  <span>{res.name}</span>
                  <ExternalLink className="h-3 w-3 text-[#8C3737]" />
                </div>
                <p className="text-xs text-[#78726B] mt-1.5 line-clamp-3">
                  {res.description}
                </p>
              </div>
              <span className="mt-3 text-[11px] font-semibold text-[#8C3737] hover:underline">
                Visit Official Domain →
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
