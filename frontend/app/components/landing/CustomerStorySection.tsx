"use client";

export default function CustomerStorySection() {
  return (
    <section className="bg-[var(--bg-dark)] py-24 text-[var(--text-on-dark)] border-t border-[var(--border-dark)]">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Text Content */}
          <div className="space-y-8">
            <div className="text-[var(--text-on-dark-2)] text-sm font-semibold tracking-widest uppercase">
              Customer Stories
            </div>
            <h2 className="text-4xl md:text-5xl font-light leading-tight tracking-tight">
              See how <span className="text-white font-medium">Highland Studios</span> uses Splitpay to automate royalties and session payouts for their artists
            </h2>
            <p className="text-lg text-[var(--text-on-dark-2)] max-w-md leading-relaxed">
              "Their automation strategy completely reshaped how we work. It's efficient, intelligent, and seamless. We no longer spend days reconciling payments."
            </p>
            <a href="/stories/comet" className="inline-flex items-center gap-3 bg-[var(--mint)] text-black px-8 py-4 rounded-full font-medium hover:scale-105 transition-transform shadow-[0_0_20px_rgba(165,242,204,0.3)]">
              Read the case study
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>

          {/* Right: Modern Stats/Images */}
          <div className="relative">
            {/* Main Image Card */}
            <div className="w-full aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden relative border border-[var(--border-dark)] shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop" 
                alt="Highland Studios"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-dark)] via-transparent to-transparent"></div>
              
              {/* Overlaid Logo/Brand */}
              <div className="absolute top-6 left-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 font-serif italic text-xl">
                Highland
              </div>
            </div>
            
            {/* Floating Stat Card - styled like the "Data Points" bright card from images */}
            <div className="absolute -bottom-10 -left-6 md:left-auto md:-right-10 bg-[#D4FF33] text-black rounded-3xl p-8 shadow-2xl border border-white/10 max-w-xs transform hover:-translate-y-2 transition-transform">
              <div className="text-sm font-semibold tracking-wide uppercase mb-4 opacity-80">
                Processed in 2023
              </div>
              <div className="text-5xl font-mono tracking-tighter font-medium mb-3">
                ₦500M+
              </div>
              <div className="text-sm font-medium leading-relaxed opacity-90">
                Total of Splitpay's recurring automated distributions, empowering creatives instantly.
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
