import React, { useState } from 'react';
import { Mail, Phone, Clock, MessageSquare, Landmark, Send, CheckCircle2, MapPin } from 'lucide-react';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          message: msg,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit your inquiry. Please try again.');
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setMsg('');
    } catch (err: any) {
      console.error('Inquiry submission failure:', err);
      setError(err.message || 'An unexpected connection error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen pt-[80px] sm:pt-[84px] md:pt-[88px] lg:pt-[92px] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-16">
          <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block mb-3">
            Contact Us
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-[0.25em] uppercase font-display">
            Inquire Privately
          </h1>
          <div className="w-12 h-[1px] bg-gold-pure mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Contact Details Information side (columns 1 to 5) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="space-y-2">
              <h3 className="text-white text-base font-display uppercase tracking-widest font-semibold">
                ZOAL Registry
              </h3>
              <p className="text-zinc-500 text-xs leading-relaxed max-w-sm">
                Our customer relationship officers are online around the clock. Your inquiries are handled in absolute privacy.
              </p>
            </div>

            <div className="border border-white/5 rounded-sm divide-y divide-white/5 bg-[#050505] text-xs">
              
              <div className="p-5 flex items-start gap-4">
                <Mail className="w-5 h-5 text-gold-pure mt-0.5" />
                <div>
                  <h4 className="text-white font-medium">Email Address</h4>
                  <p className="text-zinc-500 mt-1"><a href="mailto:alzoal3003@gmail.com" className="hover:text-gold-pure transition-colors" dir="ltr">alzoal3003@gmail.com</a></p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">For general inquiries, customer support, business partnerships, and franchise opportunities.</p>
                </div>
              </div>

              <div className="p-5 flex items-start gap-4">
                <Phone className="w-5 h-5 text-gold-pure mt-0.5" />
                <div>
                  <h4 className="text-white font-medium">Phone</h4>
                  <p className="text-zinc-500 mt-1 mb-1" dir="ltr">+966 56 769 9315</p>
                </div>
              </div>

              <div className="p-5 flex items-start gap-4">
                <Clock className="w-5 h-5 text-[#D4AF37] mt-0.5" />
                <div>
                  <h4 className="text-white font-medium">Store Hours</h4>
                  <p className="text-zinc-500 mt-1">Daily: 08:00 AM – 12:00 AM</p>
                </div>
              </div>

              <div className="p-5 flex items-start gap-4">
                <MapPin className="w-5 h-5 text-[#D4AF37] mt-0.5" />
                <div>
                  <h4 className="text-white font-medium">Location</h4>
                  <p className="text-zinc-500 mt-1">Al Hofuf, Saudi Arabia</p>
                </div>
              </div>

            </div>

          </div>

          {/* Form input side (columns 6 to 12) */}
          <div className="lg:col-span-7 bg-[#050505] border border-white/5 p-6 sm:p-10 rounded-sm space-y-6">
            
            <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-3">Inquiry Application</h3>

            {error && (
              <div className="p-4 border border-red-500/25 bg-red-950/15 rounded-sm text-red-400 text-xs font-sans leading-relaxed">
                {error}
              </div>
            )}

            {success ? (
              <div className="p-6 border border-gold-pure/20 rounded-xs bg-gold-pure/5 text-center space-y-3 animate-fade-in">
                <CheckCircle2 className="w-10 h-10 text-gold-pure mx-auto animate-pulse" />
                <h4 className="text-white text-sm font-display uppercase tracking-widest">Inquiry Received</h4>
                <p className="text-zinc-500 text-xs max-w-sm mx-auto font-sans leading-relaxed">
                  Your coordinates have been registered successfully inside our Al Shati database. A senior boutique representative will contact you shortly.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="px-4 py-2 border border-white/10 hover:border-gold-pure/30 text-white rounded-xs text-[9px] uppercase font-display cursor-pointer"
                >
                  Apply alternative Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-400 uppercase tracking-widest">Your Full Name:</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder=""
                      className="w-full bg-black border border-white/5 rounded-sm p-2.5 text-xs text-white focus:outline-none focus:border-gold-pure/35"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-400 uppercase tracking-widest">Email Address:</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="w-full bg-black border border-white/5 rounded-sm p-2.5 text-xs text-white placeholder-zinc-700/40 focus:outline-none focus:border-gold-pure/35"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-widest">Phone Number:</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+966XXXXXXXXX"
                    className="w-full bg-black border border-white/5 rounded-sm p-2.5 text-xs text-white placeholder-zinc-700/40 focus:outline-none focus:border-gold-pure/35"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-widest">Narrative Inquiry Details:</label>
                  <textarea
                    required
                    rows={6}
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    placeholder="Describe your design parameters, sizing inquiries, or catering needs..."
                    className="w-full bg-black border border-white/5 rounded-sm p-2.5 text-xs text-white focus:outline-none focus:border-gold-pure/35"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-r from-gold-dark to-gold-pure disabled:from-zinc-800 disabled:to-zinc-900 text-black font-display font-bold uppercase tracking-widest text-[10px] rounded-sm transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? 'Transmitting...' : 'SEND INQUIRY'}
                  <Send className="w-4 h-4" />
                </button>

              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
