import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Phone,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Bookmark,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { verifiedHelplines, statutorySchemes } from '../../../data/rightsDirectoryData';
import womenEmpowermentOrgs from '../../../data/womenEmpowermentOrgs';
import { supportResources } from '../../../data/communityData';

const categories = [
  { id: 'all', label: 'All Services' },
  { id: 'emergency', label: 'Emergency Helplines' },
  { id: 'legal', label: 'Legal Aid & Justice' },
  { id: 'schemes', label: 'Government Welfare Schemes' },
  { id: 'ngos', label: 'Accredited NGOs & Shelters' },
  { id: 'health', label: 'Hospitals & Healthcare' },
];

export default function FindHelpTab() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Combine and normalize all verified resources
  const allResources = useMemo(() => {
    const list = [];

    // 1. Helplines
    verifiedHelplines.forEach((h) => {
      list.push({
        id: `hl_${h.id}`,
        name: h.name,
        category: 'emergency',
        badge: 'Statutory 24/7 Helpline',
        location: h.area,
        contact: h.number,
        description: h.purpose,
        website: null,
        source: h.source,
        verified: true,
      });
    });

    // 2. Statutory Schemes
    statutorySchemes.forEach((s) => {
      list.push({
        id: `scheme_${s.id}`,
        name: s.name,
        category: s.category.includes('Legal') ? 'legal' : 'schemes',
        badge: 'Statutory Government Scheme',
        location: s.jurisdiction,
        contact: s.contact,
        description: s.description,
        website: s.officialUrl,
        eligibility: s.eligibility,
        source: 'Central Government (MWCD / NALSA)',
        verified: true,
      });
    });

    // 3. Accredited NGOs
    womenEmpowermentOrgs.forEach((org) => {
      list.push({
        id: `org_${org.id}`,
        name: org.name,
        category: 'ngos',
        badge: 'Accredited NGO',
        location: org.location,
        contact: org.contact,
        description: org.description,
        website: org.website,
        services: org.services,
        source: 'Verified Non-Profit',
        verified: true,
      });
    });

    // 4. Healthcare & Clinics
    supportResources.forEach((res) => {
      list.push({
        id: `res_${res.id}`,
        name: res.name,
        category: res.category === 'NGO' ? 'ngos' : 'health',
        badge: res.category,
        location: res.address,
        contact: res.phone,
        description: `Verified ${res.category.toLowerCase()} support center with facility access.`,
        website: null,
        source: 'Directory Record',
        verified: false,
      });
    });

    return list;
  }, []);

  const filteredResources = useMemo(() => {
    return allResources.filter((res) => {
      const matchCat =
        selectedCategory === 'all' ||
        res.category === selectedCategory ||
        (selectedCategory === 'emergency' && res.badge.includes('Helpline'));

      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        res.name.toLowerCase().includes(query) ||
        res.location.toLowerCase().includes(query) ||
        res.description.toLowerCase().includes(query) ||
        (res.contact && res.contact.toLowerCase().includes(query));

      return matchCat && matchSearch;
    });
  }, [allResources, selectedCategory, searchQuery]);

  const handleCopy = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Contact copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToFavorites = async (res) => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      if (!token || !API_BASE_URL) {
        toast.error('Please login to save resources to your account.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId: res.id,
          category: 'Resource',
          title: res.name,
        }),
      });

      if (response.ok) {
        toast.success(`Saved "${res.name}" to your Saved Resources!`);
      } else {
        toast.error('Failed to save resource.');
      }
    } catch {
      toast.error('Could not save to favorites.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C3737]">
              <ShieldCheck className="h-4 w-4" />
              <span>Verified Directory of Public &amp; Civil Support</span>
            </div>
            <h2 className="font-serif text-xl font-bold text-[#1E1B18]">
              Find Help &amp; Support Directory
            </h2>
            <p className="text-xs text-[#78726B]">
              Search and filter across statutory crisis helplines, legal defense cells, accredited NGOs, and healthcare centers.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#78726B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by city (e.g. Delhi, Bangalore), service name, or issue type..."
            className="w-full rounded-xl border border-[#EDE6E2] bg-white pl-10 pr-4 py-2.5 text-xs text-[#1E1B18] shadow-xs focus:border-[#8C3737] focus:outline-hidden"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex overflow-x-auto gap-1.5 pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[#8C3737] text-white shadow-xs'
                  : 'border border-[#EDE6E2] bg-white text-[#4F4A45] hover:bg-[#F6EFEA]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredResources.map((res) => (
          <div
            key={res.id}
            className="rounded-2xl border border-[#EDE6E2] bg-white p-5 shadow-xs flex flex-col justify-between hover:border-[#8C3737]/30 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-md bg-[#F6EFEA] px-2 py-0.5 text-[10px] font-semibold text-[#8C3737]">
                  {res.badge}
                </span>
                {res.verified ? (
                  <span className="text-[10px] font-bold text-[#286646] flex items-center gap-0.5">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                ) : (
                  <span className="text-[10px] text-[#A8A29E]">Requires Verification</span>
                )}
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-[#1E1B18]">
                  {res.name}
                </h3>
                <p className="mt-1 flex items-center gap-1 text-xs text-[#78726B]">
                  <MapPin className="h-3 w-3 shrink-0 text-[#8C3737]" />
                  <span className="truncate">{res.location}</span>
                </p>
              </div>

              <p className="text-xs text-[#4F4A45] leading-relaxed line-clamp-3">
                {res.description}
              </p>

              {res.services && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {res.services.slice(0, 3).map((s, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-[#FBF9F7] border border-[#EDE6E2] px-2 py-0.5 text-[10px] text-[#4F4A45]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Contact & Action Bar */}
            <div className="mt-5 pt-3 border-t border-[#EDE6E2] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-[#8C3737]">
                  {res.contact || 'Official Portal'}
                </span>
                <div className="flex items-center gap-1.5">
                  {res.contact && (
                    <button
                      onClick={() => handleCopy(res.id, res.contact)}
                      className="rounded-md border border-[#EDE6E2] p-1 text-[#78726B] hover:bg-[#F6EFEA]"
                      title="Copy contact"
                    >
                      {copiedId === res.id ? (
                        <Check className="h-3.5 w-3.5 text-[#286646]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleSaveToFavorites(res)}
                    className="rounded-md border border-[#EDE6E2] p-1 text-[#78726B] hover:bg-[#F6EFEA] hover:text-[#8C3737]"
                    title="Save resource"
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                {res.contact && (
                  <a
                    href={`tel:${res.contact}`}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-[#8C3737] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#752B2B] transition-colors"
                  >
                    <Phone className="h-3 w-3" /> Call Helpline
                  </a>
                )}
                {res.website && (
                  <a
                    href={res.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-[#EDE6E2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E1B18] hover:bg-[#F6EFEA] transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" /> Official Site
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="rounded-2xl border border-[#EDE6E2] bg-white p-12 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-[#A8A29E] mb-2" />
          <p className="text-xs font-semibold text-[#1E1B18]">No resources match your search criteria</p>
          <p className="text-xs text-[#78726B] mt-1">
            Try adjusting your keyword or selecting "All Services".
          </p>
        </div>
      )}
    </div>
  );
}
