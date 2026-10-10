import statsData from "../../data/statsData";
import { motion } from "framer-motion";

function Statistics() {
  return (
    <section id="impact" className="border-t border-[#EDE6E2] bg-white py-20 px-6 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-[#1E1B18] sm:text-4xl">
            Our Impact
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#4F4A45] sm:text-lg">
            Empowering women through AI-driven guidance, education, and wellness.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statsData.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="rounded-xl border border-[#EDE6E2] bg-[#FBF9F7] p-8 text-center"
            >
              <div className="font-serif text-4xl font-bold tracking-tight text-[#8C3737] sm:text-5xl">
                {item.number}
              </div>
              <p className="mt-3 text-sm font-medium text-[#4F4A45]">
                {item.title}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Statistics;