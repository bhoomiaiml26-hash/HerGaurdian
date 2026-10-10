import { motion } from "framer-motion";
import whyChooseData from "../../data/whyChooseData";

function WhyChoose() {
  return (
    <section className="bg-white px-6 py-20 sm:px-8 border-t border-[#EDE6E2]">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#8C3737]">
          Why Choose HerGuardian AI?
        </h2>

        <p className="mx-auto mt-4 max-w-3xl text-center font-sans text-base sm:text-lg leading-relaxed text-[#4F4A45]">
          Designed to empower, educate, and support women through every stage of life.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {whyChooseData.map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-6 sm:p-8 shadow-xs transition hover:border-[#8C3737]/30 hover:shadow-sm"
            >
              <h3 className="font-serif text-xl font-bold text-[#8C3737]">
                {item.title}
              </h3>

              <p className="mt-3 font-sans text-sm sm:text-base leading-relaxed text-[#4F4A45]">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WhyChoose;