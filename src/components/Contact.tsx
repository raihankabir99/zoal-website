import React, { useState, useEffect, useRef } from 'react';
import { Mail, Phone, Clock, MessageSquare, Landmark, Send, CheckCircle2, MapPin, Loader2, AlertCircle, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBranding } from './BrandingContext';

export default function Contact() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { settings } = useBranding();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Submission progress stage (1 to 4)
  const [currentStage, setCurrentStage] = useState(1);
  const [stageText, setStageText] = useState(t('contact.stages.prepare', { defaultValue: isAr ? 'جاري تجهيز استفسارك...' : 'Preparing your inquiry...' }));
  
  // Reference number if returned by backend
  const [inquiryRef, setInquiryRef] = useState<string | null>(null);

  // Network online status
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Modal states
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState(t('contact.errors.default', { defaultValue: isAr ? 'لم نتمكن من إرسال استفسارك في الوقت الحالي.\n\nيرجى التحقق من اتصالك والمحاولة مرة أخرى.' : 'We couldn\'t send your inquiry at the moment.\n\nPlease check your connection and try again.' }));

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Accessibility: ESC key handling for active modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showLoadingModal) return; // Prevent closing during loading
        if (showSuccessModal) {
          setShowSuccessModal(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        if (showErrorModal) setShowErrorModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLoadingModal, showSuccessModal, showErrorModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !isOnline) return;

    setSubmitting(true);
    setShowLoadingModal(true);
    setCurrentStage(1);
    setStageText(t('contact.stages.prepare', { defaultValue: isAr ? 'جاري تجهيز استفسارك...' : 'Preparing your inquiry...' }));

    // Progress stage simulation timer
    const timer1 = setTimeout(() => {
      setCurrentStage(2);
      setStageText(t('contact.stages.encrypt', { defaultValue: isAr ? 'جاري تشفير معلوماتك...' : 'Encrypting your information...' }));
    }, 350);

    const timer2 = setTimeout(() => {
      setCurrentStage(3);
      setStageText(t('contact.stages.transmit', { defaultValue: isAr ? 'جاري الإرسال بأمان...' : 'Sending securely...' }));
    }, 750);

    const timer3 = setTimeout(() => {
      setCurrentStage(4);
      setStageText(t('contact.stages.finalize', { defaultValue: isAr ? 'جاري إنهاء التقديم...' : 'Finalizing submission...' }));
    }, 1150);

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

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      if (!response.ok) {
        throw new Error(data.error || t('contact.errors.default', { defaultValue: isAr ? 'لم نتمكن من إرسال استفسارك في الوقت الحالي.\n\nيرجى التحقق من اتصالك والمحاولة مرة أخرى.' : 'We couldn\'t send your inquiry at the moment.\n\nPlease check your connection and try again.' }));
      }

      // Check if backend returned an inquiry ID or reference
      if (data && data.id) {
        const shortId = data.id.toString().substring(0, 8).toUpperCase();
        setInquiryRef(`#INQ-${shortId}`);
      } else {
        setInquiryRef(null);
      }

      // Brief final pause for elite feel
      await new Promise(resolve => setTimeout(resolve, 400));

      setShowLoadingModal(false);
      setShowSuccessModal(true);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      console.error('Inquiry submission failure:', err);
      setShowLoadingModal(false);
      setErrorMessage(err.message || t('contact.errors.default', { defaultValue: isAr ? 'لم نتمكن من إرسال استفسارك في الوقت الحالي.\n\nيرجى التحقق من اتصالك والمحاولة مرة أخرى.' : 'We couldn\'t send your inquiry at the moment.\n\nPlease check your connection and try again.' }));
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setMsg('');
    setInquiryRef(null);
    setShowSuccessModal(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    }, 100);
  };

  const handleReturnToContact = () => {
    setShowSuccessModal(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="bg-black text-white min-h-screen pt-[72px] md:pt-[80px] pb-16 relative">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        
        {/* Offline Banner Warning */}
        {!isOnline && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/40 rounded-sm flex items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <h4 className="text-white text-xs font-display uppercase tracking-widest font-semibold">
                  {t('contact.offline.title', { defaultValue: isAr ? 'لا يوجد اتصال بالإنترنت' : 'No Internet Connection' })}
                </h4>
                <p className="text-zinc-400 text-xs mt-0.5">
                  {t('contact.offline.desc', { defaultValue: isAr ? 'أعد الاتصال للمتابعة في إرسال استفسارك.' : 'Reconnect to continue submitting your inquiry.' })}
                </p>
              </div>
            </div>
            <span className="text-[10px] text-red-400 uppercase tracking-widest font-mono">
              {t('contact.offline.badge', { defaultValue: isAr ? 'غير متصل' : 'Offline' })}
            </span>
          </div>
        )}

        {/* Title */}
        <div className="hidden md:block text-center mt-7 mb-8">
          <h1 className="text-4xl font-semibold tracking-[0.2em] uppercase font-display">
            {t('contact.title', { defaultValue: isAr ? 'دعم زول' : 'SUPPORT SERVICES' })}
          </h1>
          <div className="w-10 h-[1px] bg-gold-pure mx-auto mt-3" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-12 items-start pt-3 md:pt-0">
          
          {/* Contact Details Information side (columns 1 to 5) */}
          <div className="lg:col-span-5 space-y-6 text-start">
            
            <div className="space-y-2">
              <h3 className="text-white text-base font-display uppercase tracking-widest font-semibold">
                {t('contact.info.header', { defaultValue: isAr ? 'دعم زول' : 'zoal support' })}
              </h3>
              <p className="text-zinc-500 text-xs leading-relaxed max-w-sm">
                {t('contact.info.desc', { defaultValue: isAr ? 'موظفو علاقات العملاء لدينا متاحون على مدار الساعة. يتم التعامل مع استفساراتكم بخصوصية مطلقة.' : 'Our customer relationship officers are online around the clock. Your inquiries are handled in absolute privacy.' })}
              </p>
            </div>

            <div className="border border-white/5 rounded-sm divide-y divide-white/5 bg-[#050505] text-xs">
              
              <div className="py-2.5 px-4 md:p-5 flex items-center md:items-start gap-3 md:gap-4">
                <Mail className="w-5 h-5 text-gold-pure mt-0 md:mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-white font-medium">{t('contact.info.email_label', { defaultValue: isAr ? 'البريد الإلكتروني' : 'Email Address' })}</h4>
                  <p className="text-zinc-500 mt-0.5 md:mt-1"><a href={`mailto:${settings.email}`} className="hover:text-gold-pure transition-colors" dir="ltr">{settings.email}</a></p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    {t('contact.info.email_desc', { defaultValue: isAr ? 'للاستفسارات العامة، ودعم العملاء، وشراكات الأعمال، وفرص الامتياز.' : 'For general inquiries, customer support, business partnerships, and franchise opportunities.' })}
                  </p>
                </div>
              </div>

              <div className="py-2.5 px-4 md:p-5 flex items-center md:items-start gap-3 md:gap-4">
                <Phone className="w-5 h-5 text-gold-pure mt-0 md:mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-white font-medium">{t('contact.info.phone_label', { defaultValue: isAr ? 'الهاتف' : 'Phone' })}</h4>
                  <p className="text-zinc-500 mt-0.5 md:mt-1 mb-0 md:mb-1" dir="ltr">{settings.phone}</p>
                </div>
              </div>

              <div className="py-2.5 px-4 md:p-5 flex items-center md:items-start gap-3 md:gap-4">
                <Clock className="w-5 h-5 text-[#D4AF37] mt-0 md:mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-white font-medium">{t('contact.info.hours_label', { defaultValue: isAr ? 'ساعات العمل' : 'Store Hours' })}</h4>
                  <p className="text-zinc-500 mt-0.5 md:mt-1">{t('contact.info.hours_desc', { defaultValue: isAr ? 'يومياً: ٠٨:٠٠ صباحاً – ١٢:٠٠ منتصف الليل' : 'Daily: 08:00 AM – 12:00 AM' })}</p>
                </div>
              </div>

              <div className="py-2.5 px-4 md:p-5 flex items-center md:items-start gap-3 md:gap-4">
                <MapPin className="w-5 h-5 text-[#D4AF37] mt-0 md:mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-white font-medium">{t('contact.info.location_label', { defaultValue: isAr ? 'الموقع' : 'Location' })}</h4>
                  <p className="text-zinc-500 mt-0.5 md:mt-1">{settings.address}</p>
                </div>
              </div>

            </div>

          </div>

          {/* Form input side (columns 6 to 12) */}
          <div className="lg:col-span-7 bg-[#050505] border border-white/5 p-4 md:p-10 rounded-sm space-y-3 md:space-y-6 text-start">
            
            <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2 md:pb-3">
              {t('contact.form.header', { defaultValue: isAr ? 'تقديم طلب استفسار' : 'Inquiry Application' })}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:space-y-1.5">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-widest">{t('contact.form.name_label', { defaultValue: isAr ? 'اسمك الكامل:' : 'Your Full Name:' })}</label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder=""
                    disabled={submitting || !isOnline}
                    className="w-full bg-black border border-white/5 rounded-sm py-2 px-3 md:py-3 md:px-4 text-xs text-white focus:outline-none focus:border-gold-pure/35 disabled:opacity-50 transition-colors"
                  />
                </div>
                <div className="space-y-1 md:space-y-1.5">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-widest">{t('contact.form.email_label', { defaultValue: isAr ? 'البريد الإلكتروني:' : 'Email Address:' })}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    disabled={submitting || !isOnline}
                    className="w-full bg-black border border-white/5 rounded-sm py-2 px-3 md:py-3 md:px-4 text-xs text-white placeholder-zinc-700/40 focus:outline-none focus:border-gold-pure/35 disabled:opacity-50 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1 md:space-y-1.5">
                <label className="text-[9px] text-zinc-400 uppercase tracking-widest">{t('contact.form.phone_label', { defaultValue: isAr ? 'رقم الهاتف:' : 'Phone Number:' })}</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+966XXXXXXXXX"
                  disabled={submitting || !isOnline}
                  className="w-full bg-black border border-white/5 rounded-sm py-2 px-3 md:py-3 md:px-4 text-xs text-white placeholder-zinc-700/40 focus:outline-none focus:border-gold-pure/35 disabled:opacity-50 transition-colors"
                />
              </div>

              <div className="space-y-1 md:space-y-1.5">
                <label className="text-[9px] text-zinc-400 uppercase tracking-widest">{t('contact.form.message_label', { defaultValue: isAr ? 'تفاصيل طلب الاستفسار:' : 'YOUR MESSAGE:' })}</label>
                <textarea
                  required
                  rows={6}
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder={t('contact.form.message_placeholder', { defaultValue: isAr ? 'صف مواصفات التصميم المطلوبة، أو تفاصيل المقاسات، أو احتياجات التجهيز...' : 'Write your message or inquiry details here...' })}
                  disabled={submitting || !isOnline}
                  className="w-full bg-black border border-white/5 rounded-sm py-2 px-3 md:py-3 md:px-4 h-[72px] md:h-auto text-xs text-white focus:outline-none focus:border-gold-pure/35 disabled:opacity-50 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !isOnline}
                className="w-full mt-3 md:mt-6 py-4 bg-gradient-to-r from-gold-dark to-gold-pure disabled:from-zinc-800 disabled:to-zinc-900 text-black font-display font-bold uppercase tracking-widest text-[10px] rounded-sm transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-gold-pure/10 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>{t('contact.form.submitting', { defaultValue: isAr ? 'جاري إرسال طلبك...' : 'Sending Your Inquiry...' })}</span>
                  </>
                ) : (
                  <>
                    <span>{t('contact.form.submit', { defaultValue: isAr ? 'إرسال الاستفسار' : 'Submit Inquiry' })}</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>

          </div>

        </div>

      </div>

      {/* ====================================================== */}
      {/* 1 & 2. LOADING MODAL WITH PROGRESS STAGES */}
      {/* ====================================================== */}
      {showLoadingModal && (
        <div 
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-fade-in px-4"
        >
          <div className="bg-[#0A0A0A] border border-gold-pure/30 p-8 rounded-sm max-w-md w-full text-center space-y-6 shadow-2xl shadow-gold-pure/10 transform transition-transform duration-300 scale-100">
            <div className="w-14 h-14 rounded-full bg-gold-pure/10 border border-gold-pure/30 flex items-center justify-center mx-auto">
              <Loader2 className="w-7 h-7 text-gold-pure animate-spin" />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-white text-lg font-display uppercase tracking-widest font-semibold">
                {t('contact.modal.loading_title', { defaultValue: isAr ? 'جاري إرسال استفسارك...' : 'Sending Your Inquiry...' })}
              </h3>
              <p className="text-gold-pure text-xs font-mono uppercase tracking-widest animate-pulse h-6 flex items-center justify-center">
                {stageText}
              </p>
              <p className="text-[10px] text-zinc-500 font-sans tracking-wider">
                {t('contact.modal.loading_desc', { defaultValue: isAr ? 'يرجى الانتظار بينما نقوم بتسليم رسالتك بأمان. يستغرق هذا عادةً بضع ثوانٍ فقط.' : 'Please wait while we securely deliver your message. This usually takes only a few seconds.' })}
              </p>
            </div>

            {/* Multi-stage progress indicators */}
            <div className="space-y-2 pt-2">
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden flex">
                <div 
                  className="bg-gradient-to-r from-gold-dark to-gold-pure h-full transition-all duration-500 rounded-full"
                  style={{ width: `${(currentStage / 4) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-zinc-500 uppercase tracking-widest font-mono">
                <span className={currentStage >= 1 ? 'text-gold-pure' : ''}>{t('contact.stages.prep', { defaultValue: isAr ? 'تجهيز' : 'Prepare' })}</span>
                <span className={currentStage >= 2 ? 'text-gold-pure' : ''}>{t('contact.stages.enc', { defaultValue: isAr ? 'تشفير' : 'Encrypt' })}</span>
                <span className={currentStage >= 3 ? 'text-gold-pure' : ''}>{t('contact.stages.trans', { defaultValue: isAr ? 'إرسال' : 'Transmit' })}</span>
                <span className={currentStage >= 4 ? 'text-gold-pure' : ''}>{t('contact.stages.fin', { defaultValue: isAr ? 'إنهاء' : 'Finalize' })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* 2, 3, 4, 5. SUCCESS MODAL */}
      {/* ====================================================== */}
      {showSuccessModal && (
        <div 
          aria-live="assertive"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-fade-in px-4"
        >
          <div className="bg-[#0A0A0A] border border-gold-pure/40 p-8 rounded-sm max-w-lg w-full text-center space-y-6 shadow-2xl shadow-gold-pure/15 transform transition-all duration-300">
            
            <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="space-y-3">
              <h3 className="text-white text-xl font-display uppercase tracking-widest font-bold">
                {t('contact.modal.success_title', { defaultValue: isAr ? 'تم تقديم الاستفسار بنجاح' : 'Inquiry Successfully Submitted' })}
              </h3>
              
              <div className="space-y-2 text-zinc-400 text-xs font-sans leading-relaxed">
                <p>
                  {t('contact.modal.success_desc1', { defaultValue: isAr ? 'تم تسليم استفسارك بأمان إلى فريق آل زول.' : 'Your inquiry has been securely delivered to the AL ZOAL team.' })}
                </p>
                <p>
                  {t('contact.modal.success_desc2', { defaultValue: isAr ? 'سيقوم أخصائيونا بمراجعة طلبك بعناية والرد عليك في أقرب وقت ممكن.' : 'Our specialists will carefully review your request and respond as soon as possible.' })}
                </p>
              </div>

              {/* Optional Reference Number */}
              {inquiryRef && (
                <div className="inline-block bg-black/60 border border-gold-pure/20 px-4 py-2 rounded-sm my-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-mono">{t('contact.modal.ref_label', { defaultValue: isAr ? 'الرقم المرجعي' : 'Reference Number' })}</span>
                  <span className="text-gold-pure font-mono text-sm tracking-widest font-bold">{inquiryRef}</span>
                </div>
              )}

              {/* Email confirmation notice */}
              <div className="pt-2 border-t border-white/5 space-y-1 text-[11px] text-zinc-400">
                <p className="flex items-center justify-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {t('contact.modal.status_secure', { defaultValue: isAr ? 'اكتمل الإرسال الآمن' : 'Secure Transmission Completed' })}
                </p>
                <p className="flex items-center justify-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {t('contact.modal.status_recorded', { defaultValue: isAr ? 'تم تسجيل الاستفسار بنجاح' : 'Inquiry Successfully Recorded' })}
                </p>
                <p className="text-[10px] text-zinc-500 pt-1">
                  {t('contact.modal.status_email_notice', { defaultValue: isAr ? 'إذا كان البريد الإلكتروني للتأكيد متاحاً، فستتلقاه قريباً.' : "If a confirmation email is available, you'll receive it shortly." })}
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="flex-1 py-3 bg-gradient-to-r from-gold-dark to-gold-pure text-black font-display font-bold uppercase tracking-widest text-[10px] rounded-sm transition-transform hover:scale-[1.01] cursor-pointer shadow-md shadow-gold-pure/10"
              >
                {t('contact.modal.btn_another', { defaultValue: isAr ? 'تقديم استفسار آخر' : 'Submit Another Inquiry' })}
              </button>
              <button
                type="button"
                onClick={handleReturnToContact}
                className="flex-1 py-3 bg-zinc-900 border border-white/10 hover:border-gold-pure/40 text-white font-display uppercase tracking-widest text-[10px] rounded-sm transition-colors cursor-pointer"
              >
                {t('contact.modal.btn_return', { defaultValue: isAr ? 'العودة لصفحة التواصل' : 'Return to Contact Page' })}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* 7. ERROR STATE MODAL */}
      {/* ====================================================== */}
      {showErrorModal && (
        <div 
          aria-live="assertive"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-fade-in px-4"
        >
          <div className="bg-[#0A0A0A] border border-red-500/40 p-8 rounded-sm max-w-md w-full text-center space-y-6 shadow-2xl shadow-red-950/30 transform transition-all duration-300">
            
            <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>

            <div className="space-y-3">
              <h3 className="text-white text-xl font-display uppercase tracking-widest font-bold">
                {t('contact.modal.error_title', { defaultValue: isAr ? 'تعذر إكمال طلبك' : 'Unable to Complete Your Request' })}
              </h3>
              <div className="space-y-2 text-zinc-400 text-xs font-sans leading-relaxed whitespace-pre-line">
                <p>{t('contact.modal.error_desc1', { defaultValue: isAr ? 'لم نتمكن من إرسال استفسارك في الوقت الحالي.' : "We couldn't send your inquiry at the moment." })}</p>
                <p>{t('contact.modal.error_desc2', { defaultValue: isAr ? 'يرجى التحقق من اتصالك والمحاولة مرة أخرى.' : 'Please check your connection and try again.' })}</p>
                {errorMessage && errorMessage !== 'We couldn\'t send your inquiry at the moment.\n\nPlease check your connection and try again.' && (
                  <p className="text-[11px] text-red-300/80 mt-2 font-mono bg-red-950/20 p-2 rounded-xs border border-red-500/20">{errorMessage}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowErrorModal(false);
                }}
                className="flex-1 py-3 bg-gold-pure text-black font-display font-bold uppercase tracking-widest text-[10px] rounded-sm transition-transform hover:scale-[1.01] cursor-pointer"
              >
                {t('contact.modal.btn_retry', { defaultValue: isAr ? 'المحاولة مرة أخرى' : 'Try Again' })}
              </button>
              <button
                type="button"
                onClick={() => setShowErrorModal(false)}
                className="flex-1 py-3 bg-zinc-900 border border-white/10 hover:border-white/20 text-white font-display uppercase tracking-widest text-[10px] rounded-sm transition-colors cursor-pointer"
              >
                {t('contact.modal.btn_cancel', { defaultValue: isAr ? 'إلغاء' : 'Cancel' })}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
