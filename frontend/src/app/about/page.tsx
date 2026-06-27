import { Award, Users, BookOpen, Clock, Sparkles } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
      {/* 1. Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">About Us</span>
        <h1 className="text-4xl font-heading font-extrabold text-brand-primary tracking-tight">
          One Mentor. One Strategy. <br />
          <span className="text-brand-secondary">One Final Attempt.</span>
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Final Attempt is not just another coaching institute; it is a premium learning ecosystem built by senior policy makers, educators, and successful toppers to give you the strategic edge needed to clear the civil services examination.
        </p>
      </div>

      {/* 2. Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 space-y-4 shadow-sm hover:border-blue-100 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-extrabold text-xl text-brand-primary">Our Mission</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            To democratize high-quality civil services preparation by making premium mentorship, structured curriculum, and Bihar-focused expertise accessible, affordable, and outcome-oriented. We aim to break the traditional rote-learning coaching model.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 space-y-4 shadow-sm hover:border-blue-100 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-extrabold text-xl text-brand-primary">Our Vision</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            To be recognized as Bihar's most trusted and technologically advanced EdTech gateway for public service leadership, creating a network of skilled officers who will drive administrative excellence in the state and the country.
          </p>
        </div>
      </div>

      {/* 3. Meet the Founder */}
      <div id="founder" className="bg-slate-50 rounded-3xl p-8 sm:p-12 border border-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-4 flex justify-center">
            <div className="w-56 h-72 rounded-2xl overflow-hidden bg-slate-200 border-4 border-white shadow-lg relative">
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400"
                alt="Founder"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="lg:col-span-8 space-y-6">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Meet the Founder</span>
            <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-brand-primary">
              Mentor-in-Chief's Message
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "UPSC and BPSC exams do not just test your knowledge—they test your temperament, strategy, and consistency. After mentoring thousands of civil service aspirants, we realized that the primary reason students fail is not a lack of study material, but the lack of personalized micro-scheduling. Final Attempt was founded to change this. We provide you with one mentor, one solid strategy, and all the tools to ensure this is your final successful attempt."
            </p>
            <div>
              <h5 className="font-heading font-extrabold text-sm text-brand-primary">Siddharth Kumar Sinha</h5>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Founder & Chief Mentor, Final Attempt</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Infrastructure & Facility */}
      <div className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Our Campus</span>
          <h3 className="text-2xl font-heading font-extrabold text-brand-primary">
            State-of-the-Art Learning Infrastructure
          </h3>
          <p className="text-xs text-slate-500">
            Premium offline state-of-the-art study lounges and smart digital classrooms situated in Boring Road, Patna.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Smart Classrooms', desc: 'Equipped with high-definition digital smart boards, recording setups, and acoustic sound systems.', icon: BookOpen },
            { title: 'Interactive Reading Room', desc: 'Quiet library lounge and resource desk for deep concentration, accessible 12 hours a day.', icon: Users },
            { title: 'DAF Discussion Cabin', desc: 'Mock interview suites and private group cabins for direct topper mentorship sessions.', icon: Clock }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs hover:border-blue-100 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-blue-600 flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-sm text-brand-primary mb-2">{item.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
