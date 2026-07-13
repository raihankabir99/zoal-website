import React from 'react';
import { 
  Compass, 
  Eye, 
  Award, 
  Coffee, 
  ShoppingBag, 
  Utensils, 
  ChefHat, 
  Scissors, 
  Shield, 
  Users, 
  Lightbulb, 
  Sparkles, 
  CheckCircle2,
  Heart
} from 'lucide-react';
import { motion } from 'motion/react';
import ScrollZoomImage from './ScrollZoomImage';
import BranchLocation from './BranchLocation';
import { useTranslation } from 'react-i18next';
import logoImg from '../assets/images/zoal_logo_fixed_1780848794781.png';

export default function About() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // Core content translation mapping for absolute reliability
  const content = {
    badge: isAr ? 'تراثنا' : 'OUR HERITAGE',
    title: isAr ? 'تراث زول' : 'THE ZOAL HERITAGE',
    subtitle: isAr 
      ? 'حيث يلتقي التراث السوداني بالتميز السعودي الحديث' 
      : 'Where Sudanese Heritage Meets Modern Saudi Excellence',
    
    intro_1: isAr
      ? 'تأسست زول في قلب مدينة الهفوف النابضة بالحياة بالمملكة العربية السعودية، برؤية تتجاوز مجرد تجارة التجزئة. نحن نؤمن بأن كل منتج يحمل قصة، وأن كل تقليد يستحق الحفاظ عليه، وأن كل عميل يستحق تجربة تحددها الأصالة والأناقة والضيافة الاستثنائية.'
      : 'Nestled in the vibrant city of Al Hofuf, Saudi Arabia, ZOAL was founded with a vision far greater than retail. We believe that every product carries a story, every tradition deserves to be preserved, and every customer deserves an experience defined by authenticity, elegance, and exceptional hospitality.',
    
    intro_2: isAr
      ? 'مستوحاة من التراث الثقافي الغني للسودان والضيافة الخالدة للمملكة العربية السعودية، تطورت زول لتصبح وجهة حياة فريدة من نوعها حيث يتعايش التراث والحرفية والمعيشة المعاصرة في انسجام تام. تم تصميم كل زيارة لتلهم وتصل وتحتفل بالثقافات من خلال منتجات منسقة بعناية وتجارب لا تُنسى.'
      : 'Inspired by the rich cultural heritage of Sudan and the timeless hospitality of the Kingdom of Saudi Arabia, ZOAL has evolved into a unique lifestyle destination where heritage, craftsmanship, and contemporary living exist in perfect harmony. Every visit is designed to inspire, connect, and celebrate cultures through thoughtfully curated products and unforgettable experiences.',

    destinations_title: isAr ? 'وجهة التميز والفرادة' : 'A Destination of Distinction',
    destinations_desc: isAr
      ? 'في زول، تم تصميم كل مساحة بعناية لتعكس شغفنا بالجودة والتقاليد والفخامة الحديثة.'
      : 'At ZOAL, every space has been carefully crafted to reflect our passion for quality, tradition, and modern luxury.',

    commitment_title: isAr ? 'التزامنا الراسخ' : 'Our Commitment',
    commitment_subtitle: isAr
      ? 'يعكس كل منتج وكل خدمة وكل تفاعل التزامنا الثابت بالقيم التالية:'
      : 'Every product, every service, and every interaction reflects our unwavering commitment to:',
    commitment_footer: isAr
      ? 'نحن نختار بعناية كل مكون، وكل نسيج، وكل منتج لضمان توافقه مع المعايير الفاخرة التي يستحقها عملاؤنا.'
      : 'We carefully select every ingredient, every fabric, and every product to ensure it meets the standards our customers deserve.',

    more_title: isAr ? 'أكثر من مجرد وجهة تجارية' : 'More Than a Marketplace',
    more_desc1: isAr
      ? 'إن زول أكثر من مجرد وجهة للتسوق — إنها تجربة ثقافية حيوية يتم فيها الحفاظ على التراث، وتواصل المجتمعات، والاحتفاء بالتقاليد بفخر.'
      : 'ZOAL is more than a shopping destination—it is a vibrant cultural experience where heritage is preserved, communities are connected, and traditions are celebrated with pride.',
    more_desc2: isAr
      ? 'من خلال دمج الجمال الخالد للثقافة السودانية مع رقي الحياة السعودية الحديثة، نستمر في ابتكار تجارب هادفة تلهم كل ضيف يمر عبر أبوابنا.'
      : 'By blending the timeless beauty of Sudanese culture with the sophistication of modern Saudi living, we continue to create meaningful experiences that inspire every guest who walks through our doors.',
    more_desc3: isAr
      ? 'سواء كنت تستمتع بكوب قهوة معد بشكل مثالي، أو تكتشف منتجات تخصصية أصيلة، أو تختار أزياء تقليدية أنيقة، أو تشارك لحظات مميزة مع العائلة والأصدقاء، فإن كل زيارة إلى زول مصممة لتترك أثراً دائماً.'
      : "Whether you're enjoying a perfectly crafted cup of coffee, discovering authentic specialty products, selecting elegant traditional attire, or sharing moments with family and friends, every visit to ZOAL is designed to leave a lasting impression.",

    mission_title: isAr ? 'رسالتنا' : 'Our Mission',
    mission_text: isAr
      ? 'الحفاظ على التراث السوداني والارتقاء به من خلال الضيافة المتميزة، والحرفية الاستثنائية، والمنتجات المنسقة بعناية، وتجارب العملاء التي لا تُنسى والتي تجمع بين الثقافات بأصالة وجودة وأناقة.'
      : 'To preserve and elevate Sudanese heritage through premium hospitality, exceptional craftsmanship, carefully curated products, and unforgettable customer experiences that bring cultures together with authenticity, quality, and elegance.',

    vision_title: isAr ? 'رؤيتنا' : 'Our Vision',
    vision_text: isAr
      ? 'أن نصبح الوجهة الرائدة في المملكة العربية السعودية للتراث السوداني، والقهوة المختصة، والمواد الغذائية المتميزة، والمخبز الحرفي، والأزياء، وتجارب نمط الحياة — والمعروفة بالتميز والابتكار ورضا العملاء المطلق.'
      : "To become Saudi Arabia's leading destination for Sudanese heritage, specialty coffee, premium grocery, artisan bakery, fashion, and lifestyle experiences—recognized for excellence, innovation, and uncompromising customer satisfaction.",

    values_title: isAr ? 'قيمنا الأساسية' : 'Our Core Values',
    closing_title: isAr ? 'بيان الختام والالتزام' : 'Closing Statement',
    closing_text: isAr
      ? 'في زول، نؤمن بأن الفخامة الحقيقية لا تحددها الحصرية وحدها — بل تُخلق من خلال الأصالة والثقة والحرفية والعلاقات الإنسانية الهادفة. يعكس كل منتج نقدمه وكل تجربة نبتكرها شغفنا بالاحتفاء بالتراث السوداني مع احتضان مستقبل نمط الحياة السعودي الحديث. مرحباً بكم في زول، حيث تلتقي التقاليد بالأناقة الخالدة.'
      : 'At ZOAL, we believe true luxury is not defined by exclusivity alone—it is created through authenticity, trust, craftsmanship, and meaningful human connections. Every product we offer and every experience we create reflects our passion for celebrating Sudanese heritage while embracing the future of modern Saudi lifestyle. Welcome to ZOAL, where tradition meets timeless elegance.'
  };

  const destinations = [
    {
      title: isAr ? 'بيت القهوة المختصة' : 'Specialty Coffee House',
      desc: isAr 
        ? 'تذوق القهوة العربية والسودانية والإقليمية المحمصة بخبرة والمحضرة بتقنيات تقليدية وحرفية رفيعة، لتستمتع بنكهات غنية في كل كوب.'
        : 'Experience expertly roasted Arabic, Sudanese, and regional coffees prepared with traditional techniques and refined craftsmanship, delivering rich flavors in every cup.',
      icon: Coffee
    },
    {
      title: isAr ? 'متجر المواد الغذائية المتميز' : 'Premium Grocery Market',
      desc: isAr
        ? 'اكتشف مجموعة حصرية من الأساسيات السودانية المختارة بعناية، والمنتجات العالمية الفاخرة، والبهارات الأصيلة، والمكونات المتخصصة، والمفضلة اليومية المصدرة بجودة لا تضاهى.'
        : 'Discover an exclusive collection of carefully selected Sudanese essentials, premium international products, authentic spices, specialty ingredients, and everyday favorites sourced with uncompromising quality.',
      icon: ShoppingBag
    },
    {
      title: isAr ? 'المقهى الحديث' : 'Modern Café',
      desc: isAr
        ? 'استمتع بالوجبات الطازجة، والمشروبات المعدة يدويًا، والإبداعات الموسمية المصنوعة من مكونات فاخرة في أجواء دافئة وراقية.'
        : 'Enjoy freshly prepared meals, handcrafted beverages, and seasonal culinary creations made from premium ingredients in a warm and sophisticated atmosphere.',
      icon: Utensils
    },
    {
      title: isAr ? 'المخبز التقليدي' : 'Traditional Bakery',
      desc: isAr
        ? 'خبز حرفي طازج، ومعجنات سودانية أصيلة، وحلويات دقيقة، وبسكويت، وحلويات مصنوعة يدويًا يوميًا باستخدام وصفات متوارثة عبر الأجيال.'
        : 'Freshly baked artisan breads, authentic Sudanese pastries, delicate desserts, biscuits, and handcrafted sweets prepared daily using time-honored recipes.',
      icon: ChefHat
    },
    {
      title: isAr ? 'الأزياء والخياطة' : 'Fashion & Tailoring',
      desc: isAr
        ? 'احتفل بالأناقة الخالدة من خلال الثياب المفصلة خصيصاً، والملابس السودانية التقليدية، والأزياء النسائية، وملابس الأطفال، والأقمشة الفاخرة، والحجاب، والأوشحة، وخدمات الخياطة المهنية المصممة باهتمام استثنائي بالتفاصيل.'
        : "Celebrate timeless elegance through bespoke thobes, Sudanese traditional garments, women's fashion, children's clothing, premium fabrics, hijabs, scarves, and professional tailoring services designed with exceptional attention to detail.",
      icon: Scissors
    }
  ];

  const commitments = [
    { title: isAr ? 'التراث الأصيل' : 'Authentic Heritage', color: 'border-gold-pure/20' },
    { title: isAr ? 'الجودة الاستثنائية' : 'Exceptional Quality', color: 'border-white/10' },
    { title: isAr ? 'الحرفية الصادقة' : 'Honest Craftsmanship', color: 'border-gold-pure/20' },
    { title: isAr ? 'الضيافة المتميزة' : 'Premium Hospitality', color: 'border-white/10' },
    { title: isAr ? 'ثقة العملاء' : 'Customer Trust', color: 'border-gold-pure/20' },
    { title: isAr ? 'الابتكار المستمر' : 'Continuous Innovation', color: 'border-white/10' }
  ];

  const coreValues = [
    {
      title: isAr ? 'الأصالة' : '✦ Authenticity',
      desc: isAr 
        ? 'نحن نكرم جذورنا الثقافية بينما نحتضن المستقبل بنزاهة.'
        : 'We honor our cultural roots while embracing the future with integrity.',
      icon: Compass
    },
    {
      title: isAr ? 'الجودة' : '✦ Quality',
      desc: isAr
        ? 'نحن لا نساوم أبداً على التميز، من المصادر إلى خدمة العملاء.'
        : 'We never compromise on excellence, from sourcing to customer service.',
      icon: Shield
    },
    {
      title: isAr ? 'الضيافة' : '✦ Hospitality',
      desc: isAr
        ? 'نرحب بكل ضيف بالدفء والاحترام والرعاية الصادقة.'
        : 'Every guest is welcomed with warmth, respect, and genuine care.',
      icon: Heart
    },
    {
      title: isAr ? 'الحرفية' : '✦ Craftsmanship',
      desc: isAr
        ? 'نحتفي بالفن الكامن وراء كل منتج وتجربة.'
        : 'We celebrate the artistry behind every product and every experience.',
      icon: Award
    },
    {
      title: isAr ? 'المجتمع' : '✦ Community',
      desc: isAr
        ? 'نخلق مساحات تلتقي فيها الشعوب والثقافات والتقاليد معاً.'
        : 'We create spaces where people, cultures, and traditions come together.',
      icon: Users
    },
    {
      title: isAr ? 'الابتكار' : '✦ Innovation',
      desc: isAr
        ? 'نتطور باستمرار مع الحفاظ على القيم التي تحدد هويتنا.'
        : 'We continuously evolve while preserving the values that define our identity.',
      icon: Lightbulb
    }
  ];

  return (
    <div className="bg-black text-white min-h-screen pt-[80px] sm:pt-[84px] md:pt-[88px] lg:pt-[92px] pb-20 overflow-hidden relative font-sans">
      
      {/* Background elegant golden radial glow */}
      <div className="absolute top-[10%] right-[-15%] w-[500px] h-[500px] bg-gold-pure/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-15%] w-[500px] h-[500px] bg-gold-pure/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* SECTION 1: Brand Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 flex flex-col items-center justify-center"
        >
          {/* Logo Badge Container */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 mb-6 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.15)] ring-1 ring-gold-pure/20 bg-black">
            <img
              src={logoImg}
              alt="AL ZOAL Badge"
              className="w-[145%] h-[145%] max-w-[145%] object-cover select-none pointer-events-none"
            />
          </div>
          
          <span className="text-[10px] sm:text-xs tracking-[0.45em] text-gold-pure uppercase font-display block mb-3 font-semibold">
            {content.badge}
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-[0.2em] uppercase font-display text-white">
            {content.title}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-4 max-w-2xl mx-auto tracking-widest font-display uppercase border-t border-b border-white/5 py-3">
            {content.subtitle}
          </p>
        </motion.div>

        {/* SECTION 2: Heritage Story Narrative & Graphic */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-28">
          
          <motion.div 
            initial={{ opacity: 0, x: isAr ? 40 : -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 space-y-6"
          >
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed tracking-wider text-justify">
              {content.intro_1}
            </p>
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed tracking-wider text-justify">
              {content.intro_2}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: isAr ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 rounded-xs overflow-hidden border border-white/5 bg-zinc-950/40 p-4 aspect-video relative group"
          >
            <ScrollZoomImage
              src="/src/assets/images/about-hq.jpg"
              alt="ZOAL Design Boardroom"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              containerClassName="w-full h-full overflow-hidden relative rounded-xs"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </motion.div>

        </div>

        {/* SECTION 3: A Destination of Distinction */}
        <div className="mb-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block mb-2">
              AL ZOAL spaces
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold tracking-widest uppercase text-white">
              {content.destinations_title}
            </h2>
            <div className="w-12 h-[1px] bg-gold-pure mx-auto mt-3 mb-4" />
            <p className="text-zinc-400 text-xs max-w-xl mx-auto leading-relaxed">
              {content.destinations_desc}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destinations.map((dest, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="p-8 border border-white/5 bg-[#050505] hover:border-gold-pure/20 transition-all rounded-xs flex flex-col justify-between group hover:shadow-[0_4px_30px_rgba(212,175,55,0.03)]"
              >
                <div className="space-y-4">
                  <div className="p-3 bg-white/5 rounded-xs w-fit text-gold-pure group-hover:scale-110 transition-transform duration-300">
                    <dest.icon className="w-5 h-5" />
                  </div>
                  <h3 
                    className="text-[#ddddb4] text-xs sm:text-sm font-display uppercase tracking-widest font-semibold"
                    style={idx === 0 ? { fontFamily: 'Syncopate' } : undefined}
                  >
                    {dest.title}
                  </h3>
                  <p className="text-zinc-400 text-xs leading-relaxed tracking-wide text-justify">
                    {dest.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* SECTION 4: Our Commitment */}
        <div className="mb-28">
          <div className="p-8 sm:p-12 border border-white/5 bg-[#050505]/80 rounded-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-pure/5 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block">
                  PROMISE & PROTOCOLS
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-semibold tracking-widest uppercase text-white">
                  {content.commitment_title}
                </h2>
                <div className="w-12 h-[1px] bg-gold-pure my-3" />
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed text-justify">
                  {content.commitment_subtitle}
                </p>
              </div>

              <div className="lg:col-span-7">
                <div className="grid grid-cols-2 gap-4">
                  {commitments.map((item, idx) => (
                    <div 
                      key={idx}
                      className={`p-4 border ${item.color} rounded-xs bg-black/40 text-center flex items-center justify-center`}
                    >
                      <span className="text-[#ddddb4] text-xs tracking-wider font-display uppercase font-semibold">
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-zinc-500 text-[11px] italic tracking-wide">
                {content.commitment_footer}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 5: More Than a Marketplace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block">
              Beyond retail
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold tracking-widest uppercase text-white">
              {content.more_title}
            </h2>
            <div className="w-12 h-[1px] bg-gold-pure my-3" />
            <p className="text-zinc-300 text-xs leading-relaxed tracking-wider text-justify">
              {content.more_desc1}
            </p>
            <p className="text-zinc-300 text-xs leading-relaxed tracking-wider text-justify">
              {content.more_desc2}
            </p>
          </motion.div>

          <div className="p-6 sm:p-8 border border-white/5 bg-zinc-950/20 rounded-xs space-y-4">
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed tracking-wider text-justify font-sans">
              {content.more_desc3}
            </p>
            <div className="flex justify-end pt-2">
              <Sparkles className="w-5 h-5 text-gold-pure animate-pulse" />
            </div>
          </div>
        </div>

        {/* SECTION 6: Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-28">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 border border-gold-pure/10 bg-[#050505] rounded-xs space-y-4 hover:border-gold-pure/30 transition-all shadow-[0_4px_30px_rgba(212,175,55,0.02)]"
          >
            <div className="p-3 bg-gold-pure/5 rounded-xs w-fit text-gold-pure">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-white text-sm font-display uppercase tracking-widest font-semibold">
              {content.mission_title}
            </h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed text-justify">
              {content.mission_text}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="p-8 border border-gold-pure/10 bg-[#050505] rounded-xs space-y-4 hover:border-gold-pure/30 transition-all shadow-[0_4px_30px_rgba(212,175,55,0.02)]"
          >
            <div className="p-3 bg-gold-pure/5 rounded-xs w-fit text-gold-pure">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-white text-sm font-display uppercase tracking-widest font-semibold">
              {content.vision_title}
            </h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed text-justify">
              {content.vision_text}
            </p>
          </motion.div>
        </div>

        {/* SECTION 7: Our Core Values */}
        <div className="mb-28">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block mb-2">
              FOUNDATIONAL PILLARS
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold tracking-widest uppercase text-white">
              {content.values_title}
            </h2>
            <div className="w-12 h-[1px] bg-gold-pure mx-auto mt-3" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreValues.map((val, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.08 }}
                className="p-6 border border-white/5 bg-[#050505]/60 hover:border-gold-pure/20 transition-all rounded-xs space-y-3 hover:shadow-[0_4px_30px_rgba(212,175,55,0.02)]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-xs text-gold-pure shrink-0">
                    <val.icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-[#989835] text-xs font-display uppercase tracking-wider font-semibold">
                    {val.title}
                  </h4>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed text-justify">
                  {val.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* SECTION 8: Closing Statement */}
        <div className="mb-28 border-t border-white/5 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center space-y-6"
          >
            <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block">
              {content.closing_title}
            </span>
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed tracking-wider text-justify sm:text-center italic font-sans px-4">
              "{content.closing_text}"
            </p>
            <div className="pt-4 flex justify-center">
              <div className="w-8 h-8 rounded-full border border-gold-pure/30 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-gold-pure" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* SECTION 9: Branch Location & Interactive Protocol */}
        <BranchLocation />

      </div>
    </div>
  );
}
