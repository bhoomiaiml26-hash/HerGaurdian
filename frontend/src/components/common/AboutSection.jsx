import { motion } from "framer-motion";
import { ShieldCheck, Lock, HeartHandshake } from "lucide-react";

function AboutSection() {
  return (
    <section id="about" className="border-t border-[#EDE6E2] bg-[#FBF9F7] py-20 px-6 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="font-serif text-3xl font-bold tracking-tight text-[#1E1B18] sm:text-4xl"
          >
            About HerGuardian AI
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mt-6 text-base leading-relaxed text-[#4F4A45] sm:text-lg max-w-3xl mx-auto"
          >
            HerGuardian AI is an intelligent platform created exclusively for women. Our mission is to empower every woman by providing personalized support for health, menstrual wellness, nutrition, fitness, mental well-being, career growth, scholarships, and daily inspiration.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mt-4 text-base leading-relaxed text-[#4F4A45] sm:text-lg max-w-3xl mx-auto"
          >
            We believe every woman deserves access to information, community, and opportunities — without barriers. HerGuardian AI brings together cutting-edge AI technology and compassionate design to be your trusted companion, every step of the way.
          </motion.p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EFEA] text-[#8C3737]">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-base font-semibold text-[#1E1B18]">Privacy By Default</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#4F4A45]">
              Health parameters and contact records remain strictly confidential and encrypted.
            </p>
          </div>

          <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EFEA] text-[#8C3737]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-base font-semibold text-[#1E1B18]">Verified Protocols</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#4F4A45]">
              Emergency dispatch actions aligned with national safety helplines and standard response times.
            </p>
          </div>

          <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EFEA] text-[#8C3737]">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-base font-semibold text-[#1E1B18]">Community Backing</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#4F4A45]">
              Curated access to accredited legal aid groups, financial grants, and verified non-profits.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;