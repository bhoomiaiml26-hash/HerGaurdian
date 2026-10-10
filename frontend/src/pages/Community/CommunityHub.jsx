import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  HeartHandshake,
  Phone,
  ShieldCheck,
  Users,
} from 'lucide-react';
import ShareButton from '../../components/common/ShareButton';
import womenEmpowermentOrgs, { womenEmpowermentSchemes } from '../../data/womenEmpowermentOrgs';

function CommunityHub() {
  const pageTitle = 'Advocacy Network & Verified Resources';
  const pageSummary = 'Accredited non-profits, statutory schemes, and emergency legal advocacy for women.';

  const overviewCards = useMemo(
    () => [
      {
        label: 'Accredited Organizations',
        value: womenEmpowermentOrgs.length,
        icon: Users,
      },
      {
        label: 'Statutory Welfare Schemes',
        value: womenEmpowermentSchemes.length,
        icon: ShieldCheck,
      },
      {
        label: 'Dedicated Helpline',
        value: '181',
        icon: Phone,
      },
    ],
    [],
  );

  const focusAreas = useMemo(() => {
    const allAreas = womenEmpowermentOrgs.flatMap((org) => org.focusAreas || []);
    return Array.from(new Set(allAreas));
  }, []);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://herguardian.ai/community';

  return (
    <div className="min-h-screen bg-[#FBF9F7] text-[#1E1B18] space-y-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header Banner */}
        <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-md bg-[#F6EFEA] px-2.5 py-1 text-xs font-semibold text-[#8C3737]">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verified Legal &amp; Welfare Directory</span>
              </div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1E1B18] sm:text-3xl lg:text-4xl">
                Advocacy Network &amp; Verified Support Programs
              </h1>
              <p className="max-w-3xl text-xs sm:text-sm leading-relaxed text-[#4F4A45]">
                {pageSummary} Access direct contact channels for crisis centers, legal aid cells, financial security grants, and grassroots shelters.
              </p>
            </div>
            <div className="flex flex-wrap sm:flex-nowrap gap-3 xl:w-[380px]">
              <ShareButton title={pageTitle} text={pageSummary} url={shareUrl} className="w-full" />
              <a
                href="mailto:support@herguardian.ai?subject=Advocacy Network Inquiry"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#8C3737] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#752B2B]"
              >
                <HeartHandshake className="h-3.5 w-3.5" /> Support Desk
              </a>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <section className="grid gap-4 sm:grid-cols-3">
          {overviewCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-medium text-[#78726B]">{card.label}</p>
                  <p className="mt-1 font-serif text-2xl font-bold text-[#1E1B18]">{card.value}</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#F6EFEA] text-[#8C3737]">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            );
          })}
        </section>

        {/* Organizations Section */}
        <section className="rounded-xl border border-[#EDE6E2] bg-white p-6 sm:p-8 shadow-xs">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#EDE6E2] pb-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#1E1B18]">Accredited Partner Organizations</h2>
              <p className="mt-1 text-xs text-[#78726B]">Vetted non-governmental agencies offering emergency shelter, legal counseling, and career training.</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {focusAreas.map((area) => (
                <span key={area} className="rounded-md border border-[#EDE6E2] bg-[#FBF9F7] px-2.5 py-1 text-[11px] font-medium text-[#4F4A45]">
                  {area}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {womenEmpowermentOrgs.map((org) => (
              <article
                key={org.id}
                className="flex flex-col justify-between rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-6 transition hover:border-[#8C3737]/30"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white border border-[#EDE6E2] shrink-0">
                      {org.logo ? <img src={org.logo} alt={`${org.name} logo`} className="h-8 w-8 object-contain" /> : <Users className="h-5 w-5 text-[#8C3737]" />}
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-semibold text-[#1E1B18]">{org.name}</h3>
                      <p className="text-xs text-[#78726B]">{org.location}</p>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-[#4F4A45]">{org.description}</p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-[#EDE6E2] bg-white p-3">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-[#78726B]">Mission</p>
                      <p className="mt-1 text-xs text-[#4F4A45]">{org.mission}</p>
                    </div>
                    <div className="rounded-lg border border-[#EDE6E2] bg-white p-3">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-[#78726B]">Core Services</p>
                      <p className="mt-1 text-xs text-[#4F4A45]">{org.services.slice(0, 2).join(", ")}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#EDE6E2] flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-[#EDE6E2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E1B18] hover:bg-[#F6EFEA]"
                    >
                      <ExternalLink className="h-3 w-3" /> Website
                    </a>
                    <a
                      href={`tel:${org.contact}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#EDE6E2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E1B18] hover:bg-[#F6EFEA]"
                    >
                      <Phone className="h-3 w-3" /> Call
                    </a>
                  </div>
                  <a
                    href={org.volunteerLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-[#8C3737] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#752B2B]"
                  >
                    Volunteer / Donate
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Welfare Schemes */}
        <section className="rounded-xl border border-[#EDE6E2] bg-white p-6 sm:p-8 shadow-xs">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#EDE6E2] pb-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#1E1B18]">Statutory Welfare &amp; Protection Programs</h2>
              <p className="mt-1 text-xs text-[#78726B]">Official schemes offering safe housing, educational subsidies, and rehabilitation grants.</p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-[#FBF9F7] border border-[#EDE6E2] px-3 py-1 text-xs text-[#4F4A45]">
              <BookOpen className="h-3.5 w-3.5 text-[#8C3737]" /> Verified Official Portals
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {womenEmpowermentSchemes.map((scheme) => (
              <div
                key={scheme.id}
                className="flex flex-col justify-between rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-6"
              >
                <div>
                  <div className="flex items-center gap-2.5 text-[#1E1B18]">
                    <ShieldCheck className="h-4 w-4 text-[#286646]" />
                    <h3 className="font-serif text-base font-semibold">{scheme.name}</h3>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#4F4A45]">{scheme.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {scheme.benefits.map((benefit) => (
                      <span key={benefit} className="rounded-md border border-[#EDE6E2] bg-white px-2.5 py-1 text-[11px] text-[#4F4A45]">
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#EDE6E2] flex items-center justify-between gap-3">
                  <a
                    href={scheme.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1E1B18] hover:bg-[#F6EFEA]"
                  >
                    Official Portal
                  </a>
                  <a
                    href={`tel:${scheme.contact}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#8C3737] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#752B2B]"
                  >
                    <Phone className="h-3 w-3" /> Helpline
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Guidance Instructions Panel */}
        <section className="rounded-xl border border-[#EDE6E2] bg-white p-6 sm:p-8 shadow-xs">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-3">
              <h3 className="font-serif text-xl font-bold text-[#1E1B18]">Resource Navigation Protocol</h3>
              <p className="text-xs leading-relaxed text-[#4F4A45]">
                1. Identify the organization matching your immediate physical or legal requirement.<br />
                2. Contact the verified helpline numbers directly from mobile or utilize the official government portal links.<br />
                3. Keep case reference numbers and legal documents securely documented in your private records.
              </p>
            </div>

            <div className="flex flex-col justify-center rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-5">
              <h4 className="font-serif text-sm font-semibold text-[#1E1B18]">Share This Directory</h4>
              <p className="mt-1 text-xs text-[#78726B]">Empower others in your network by circulating verified safety links.</p>
              <div className="mt-4">
                <ShareButton
                  title="Women Advocacy & Resource Network"
                  text="Directory of verified non-profits and government welfare schemes for women."
                  url={shareUrl}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default CommunityHub;
