export function MarqueeBanner() {
  return (
    <div className="marquee-container relative w-full overflow-hidden border-y border-emerald-100 bg-emerald-50/60 backdrop-blur">
      
      <div className="marquee-track flex w-max">
        
        {/* First copy */}
        <div className="marquee-content flex whitespace-nowrap py-4 text-sm font-medium tracking-wide text-emerald-900/80">
          <span className="mx-8">AI-Powered Nutrition Intelligence</span>
          <span className="mx-8">HIPAA-Ready Architecture</span>
          <span className="mx-8">Real-Time Health Insights</span>
          <span className="mx-8">Connected Wearables & Labs</span>
          <span className="mx-8">Built for Modern Clinics</span>
        </div>

        {/* Duplicate copy */}
        <div className="marquee-content flex whitespace-nowrap py-4 text-sm font-medium tracking-wide text-emerald-900/80">
          <span className="mx-8">AI-Powered Nutrition Intelligence</span>
          <span className="mx-8">HIPAA-Ready Architecture</span>
          <span className="mx-8">Real-Time Health Insights</span>
          <span className="mx-8">Connected Wearables & Labs</span>
          <span className="mx-8">Built for Modern Clinics</span>
        </div>

      </div>
    </div>
  );
}