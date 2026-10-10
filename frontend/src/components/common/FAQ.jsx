import faqData from "../../data/faqData";

function FAQ() {
  return (
    <section id="faq" className="border-t border-[#EDE6E2] bg-[#FBF9F7] py-20 px-6 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-[#1E1B18] sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base text-[#4F4A45]">
            Everything you need to know before getting started.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {faqData.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs"
            >
              <h3 className="font-serif text-base font-semibold text-[#8C3737] sm:text-lg">
                {faq.question}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#4F4A45]">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;