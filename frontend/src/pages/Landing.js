import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowRight, CheckCircle, Zap, Shield, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Landing = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: <Target className="h-6 w-6" />,
      title: 'ATS Compatibility Score',
      description: 'Get your resume scored by actual ATS algorithms used by top companies'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'AI Tone Detection',
      description: 'Detect and fix robotic, AI-generated content that recruiters spot instantly'
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Expert Recruiter Feedback',
      description: 'Get feedback as if a senior recruiter at your target company reviewed your resume'
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: 'Smart Bullet Rewrites',
      description: 'Transform weak bullet points into achievement-driven statements that stand out'
    }
  ];

  const steps = [
    { number: '01', title: 'Paste Resume', description: 'Copy your resume text into our analyzer' },
    { number: '02', title: 'Add Job Description', description: 'Paste the job posting you\'re targeting' },
    { number: '03', title: 'Get Analysis', description: 'Receive detailed ATS and recruiter feedback' },
    { number: '04', title: 'Apply Changes', description: 'Implement suggestions to increase interview chances' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <section className="relative overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0 opacity-5">
          <img
            src="https://static.prod-images.emergentagent.com/jobs/12530140-bc5e-420c-b8d6-bdbae8c52f13/images/8ecb3f017d87dae809900090a5a45f7655c9e299cafa9074786cde7fbf2c4181.png"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block mb-4 px-4 py-2 bg-black/5 rounded-full">
              <span className="text-sm font-medium tracking-wide" style={{ fontFamily: 'Manrope, sans-serif' }}>
                AI-Powered Resume Analysis
              </span>
            </div>
            
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6"
              style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
              data-testid="hero-title"
            >
              Get Past ATS.
              <br />
              <span className="text-zinc-600">Impress Recruiters.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-zinc-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Paste your resume + job description. Get your ATS score, recruiter feedback,
              and humanized resume suggestions that actually get you interviews.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={user ? "/dashboard" : "/register"} data-testid="cta-analyze-button">
                <Button
                  size="lg"
                  className="bg-black text-white hover:bg-zinc-800 gap-2 px-8 h-12 text-base font-semibold"
                >
                  Analyze My Resume
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#how-it-works" data-testid="how-it-works-link">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                  See How It Works
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
              style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
            >
              Everything You Need to Stand Out
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              Comprehensive analysis that goes beyond simple keyword matching
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white border border-zinc-200 rounded-xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                data-testid={`feature-card-${index}`}
              >
                <div className="h-12 w-12 bg-black text-white rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                  {feature.title}
                </h3>
                <p className="text-zinc-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-zinc-50" data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
              style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
            >
              How It Works
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              Simple 4-step process to optimize your resume
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative" data-testid={`step-card-${index}`}>
                <div className="text-7xl font-black text-zinc-200 mb-4" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                  {step.number}
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                  {step.title}
                </h3>
                <p className="text-zinc-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-black text-white" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-6"
            style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
          >
            Ready to Increase Your Interview Chances?
          </h2>
          <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
            Join thousands of job seekers who've optimized their resumes with HireSignal AI
          </p>
          <Link to={user ? "/dashboard" : "/register"} data-testid="cta-bottom-button">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-zinc-200 gap-2 px-8 h-12 text-base font-semibold"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;