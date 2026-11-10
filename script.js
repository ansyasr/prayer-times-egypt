(function () {
  "use strict";

  /* ============ أدوات مساعدة ============ */
  const $ = (id) => document.getElementById(id);
  const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
  const num = (s) => String(s).replace(/\d/g, (d) => AR_DIGITS[d]);
  const pad = (n) => String(n).padStart(2, "0");
  const apiDate = (d) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  const toMin = (t) => { const [h, m] = t.slice(0, 5).split(":").map(Number); return h * 60 + m; };
  const addMin = (t, add) => {
    const total = (toMin(t) + add + 1440) % 1440;
    return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
  };
  const fmt12 = (t) => {
    const [h, m] = t.slice(0, 5).split(":").map(Number);
    const h12 = h % 12 || 12;
    return `${num(h12 + ":" + pad(m))} ${h >= 12 ? "م" : "ص"}`;
  };
  const fmtLongDate = (d) =>
    d.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const COMMON_ADHKAR = [
    {
      id: "ayat-kursi",
      title: "آية الكرسي",
      repeat: 1,
      text: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ.",
      virtue: "آية الكرسي أعظم آية في كتاب الله. أُدرجت هنا للتلاوة، دون تخصيص فضل صباحي أو مسائي غير ثابت في هذا المصدر.",
      source: "سورة البقرة، الآية ٢٥٥؛ صحيح مسلم، رقم ٨١٠."
    },
    {
      id: "niama",
      title: "دعاء شكر النعمة",
      repeat: 1,
      text: "اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ.",
      eveningText: "اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ.",
      virtue: "من قالها حين يصبح فقد أدّى شكر يومه، ومن قالها حين يمسي فقد أدّى شكر ليلته.",
      source: "سنن أبي داود، رقم ٥٠٧٣."
    },
    {
      id: "fitrah",
      title: "دعاء الفطرة والتوحيد",
      repeat: 1,
      text: "أَصْبَحْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَكَلِمَةِ الْإِخْلَاصِ، وَدِينِ نَبِيِّنَا مُحَمَّدٍ ﷺ، وَمِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ.",
      eveningText: "أَمْسَيْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَكَلِمَةِ الْإِخْلَاصِ، وَدِينِ نَبِيِّنَا مُحَمَّدٍ ﷺ، وَمِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ.",
      virtue: "تجديد للإقرار بالتوحيد واتباع ملة إبراهيم ودين النبي ﷺ.",
      source: "مسند أحمد، رقم ١٥٣٦٧؛ وحسّنه عدد من أهل العلم."
    },
    {
      id: "witness",
      title: "الشهادة لله بالتوحيد",
      repeat: 4,
      text: "اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ.",
      eveningText: "اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ.",
      virtue: "ورد أن من قالها أربع مرات أعتقه الله من النار.",
      source: "سنن أبي داود، رقم ٥٠٦٩."
    },
    {
      id: "hasbiyallah",
      title: "حسبي الله ونعم الوكيل",
      repeat: 7,
      text: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ.",
      virtue: "ورد قولها سبع مرات صباحًا ومساءً في أثرٍ اختلف أهل العلم في ثبوته مرفوعًا.",
      source: "سنن أبي داود، رقم ٥٠٨١؛ مع التنبيه إلى الخلاف في صحة رفعه."
    },
    {
      id: "subhanallah-100",
      title: "التسبيح مئة مرة",
      repeat: 100,
      text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ.",
      virtue: "من قالها مئة مرة حين يصبح وحين يمسي لم يأت أحد يوم القيامة بأفضل مما جاء به، إلا من قال مثل قوله أو زاد.",
      source: "صحيح مسلم، رقم ٢٦٩٢."
    },
    {
      id: "tahlil-100",
      title: "كلمة التوحيد",
      repeat: 100,
      text: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.",
      virtue: "من قالها مئة مرة في يومه كان له أجر عظيم، وكانت له حرزًا من الشيطان حتى يمسي.",
      source: "صحيح البخاري، رقم ٣٢٩٣؛ صحيح مسلم، رقم ٢٦٩١."
    },
    {
      id: "tahlil-10",
      title: "كلمة التوحيد عشر مرات",
      repeat: 10,
      text: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.",
      virtue: "ورد فيمن قالها عشر مرات صباحًا أو مساءً فضل عظيم وأجر وحرز من الشيطان.",
      source: "سنن أبي داود، رقم ٥٠٧٧؛ وجامع الترمذي، رقم ٣٤٧٤."
    },
  ];

  const ADHKAR = {
    morning: [
      {
        id: "opening",
        title: "ذكر الصباح الجامع",
        repeat: 1,
        text: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ. رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ.",
        virtue: "دعاء جامع بحمد الله وتوحيده، وسؤاله خير اليوم والاستعاذة من شره.",
        source: "صحيح مسلم، رقم ٢٧٢٣."
      },
      {
        id: "bika",
        title: "اللهم بك أصبحنا",
        repeat: 1,
        text: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ.",
        virtue: "يجدّد المسلم توكّله على الله وافتقاره إليه في يومه.",
        source: "سنن أبي داود، رقم ٥٠٦٨؛ وجامع الترمذي، رقم ٣٣٩١ (حسن صحيح)."
      },
      {
        id: "muawwidhat",
        title: "سور الإخلاص والفلق والناس",
        repeat: 3,
        repeatNote: "اقرأ الإخلاص والفلق والناس جميعًا في كل مرة، وكرّر المجموعة ثلاث مرات.",
        text: "سورة الإخلاص:\nقُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ.\n\nسورة الفلق:\nقُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِنْ شَرِّ مَا خَلَقَ ۝ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ.\n\nسورة الناس:\nقُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَهِ النَّاسِ ۝ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ.",
        virtue: "تُقرأ السور الثلاث كل واحدة ثلاث مرات، وجاء أنها تكفي قارئها من كل شيء.",
        source: "سنن أبي داود، رقم ٥٠٨٢؛ وجامع الترمذي، رقم ٣٥٧٥."
      },
      {
        id: "sayyid-istighfar",
        title: "سيد الاستغفار",
        repeat: 1,
        text: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي، فَاغْفِرْ لِي؛ فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ.",
        virtue: "من قاله موقنًا به في النهار ثم مات قبل أن يمسي دخل الجنة.",
        source: "صحيح البخاري، رقم ٦٣٠٦."
      },
      {
        id: "rida",
        title: "رضيت بالله ربًّا",
        repeat: 3,
        text: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا.",
        virtue: "ورد أن من قالها حين يصبح ثلاثًا كان حقًا على الله أن يرضيه يوم القيامة.",
        source: "سنن أبي داود، رقم ٥٠٧٢؛ وجامع الترمذي، رقم ٣٣٨٩."
      },
      {
        id: "bismillah",
        title: "بسم الله الذي لا يضر",
        repeat: 3,
        text: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ.",
        virtue: "ورد أن من قالها ثلاثًا لم تصبه فجأة بلاء حتى يمسي.",
        source: "سنن أبي داود، رقم ٥٠٨٨؛ وجامع الترمذي، رقم ٣٣٨٨."
      },
      {
        id: "afiyah",
        title: "سؤال العفو والعافية",
        repeat: 1,
        text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ وَمِنْ خَلْفِي، وَعَنْ يَمِينِي وَعَنْ شِمَالِي، وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي.",
        virtue: "دعاء جامع بالعفو والعافية والحفظ، وكان النبي ﷺ يقوله صباحًا ومساءً.",
        source: "سنن أبي داود، رقم ٥٠٧٤."
      },
      {
        id: "fatr",
        title: "دعاء فاطر السماوات والأرض",
        repeat: 1,
        text: "اللَّهُمَّ فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ، عَالِمَ الْغَيْبِ وَالشَّهَادَةِ، رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي، وَشَرِّ الشَّيْطَانِ وَشِرْكِهِ.",
        virtue: "تعوّذ بالله من شر النفس والشيطان، وأرشد النبي ﷺ أبا بكر أن يقول هذا الدعاء صباحًا ومساءً.",
        source: "سنن أبي داود، رقم ٥٠٦٧؛ وجامع الترمذي، رقم ٣٣٩٢."
      },
      ...COMMON_ADHKAR,
      {
        id: "morning-rizq",
        title: "سؤال العلم والرزق والعمل الصالح",
        repeat: 1,
        text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا.",
        virtue: "دعاء نبوي كان يُقال بعد صلاة الصبح.",
        source: "سنن ابن ماجه، رقم ٩٢٥."
      },
      {
        id: "morning-subhan",
        title: "تسبيح بعدد الخلق",
        repeat: 3,
        text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ.",
        virtue: "أخبر النبي ﷺ أن هذه الكلمات أربع تُقال ثلاث مرات، وهي أحب إليه مما طلع عليه الشمس.",
        source: "صحيح مسلم، رقم ٢٧٢٦."
      }
    ],
    evening: [
      {
        id: "opening",
        title: "ذكر المساء الجامع",
        repeat: 1,
        text: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا. رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ.",
        virtue: "دعاء جامع بحمد الله وتوحيده، وسؤاله خير الليلة والاستعاذة من شرها.",
        source: "صحيح مسلم، رقم ٢٧٢٣."
      },
      {
        id: "bika",
        title: "اللهم بك أمسينا",
        repeat: 1,
        text: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ.",
        virtue: "يجدّد المسلم توكّله على الله وافتقاره إليه في ليلته.",
        source: "سنن أبي داود، رقم ٥٠٦٨؛ وجامع الترمذي، رقم ٣٣٩١ (حسن صحيح)."
      },
      {
        id: "muawwidhat",
        title: "سور الإخلاص والفلق والناس",
        repeat: 3,
        repeatNote: "اقرأ الإخلاص والفلق والناس جميعًا في كل مرة، وكرّر المجموعة ثلاث مرات.",
        text: "سورة الإخلاص:\nقُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ.\n\nسورة الفلق:\nقُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِنْ شَرِّ مَا خَلَقَ ۝ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ.\n\nسورة الناس:\nقُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَهِ النَّاسِ ۝ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ.",
        virtue: "تُقرأ السور الثلاث كل واحدة ثلاث مرات، وجاء أنها تكفي قارئها من كل شيء.",
        source: "سنن أبي داود، رقم ٥٠٨٢؛ وجامع الترمذي، رقم ٣٥٧٥."
      },
      {
        id: "sayyid-istighfar",
        title: "سيد الاستغفار",
        repeat: 1,
        text: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي، فَاغْفِرْ لِي؛ فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ.",
        virtue: "من قاله موقنًا به في الليل ثم مات قبل أن يصبح دخل الجنة.",
        source: "صحيح البخاري، رقم ٦٣٠٦."
      },
      {
        id: "rida",
        title: "رضيت بالله ربًّا",
        repeat: 3,
        text: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا.",
        virtue: "ورد أن من قالها حين يمسي ثلاثًا كان حقًا على الله أن يرضيه يوم القيامة.",
        source: "سنن أبي داود، رقم ٥٠٧٢؛ وجامع الترمذي، رقم ٣٣٨٩."
      },
      {
        id: "bismillah",
        title: "بسم الله الذي لا يضر",
        repeat: 3,
        text: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ.",
        virtue: "ورد أن من قالها ثلاثًا لم تصبه فجأة بلاء حتى يصبح.",
        source: "سنن أبي داود، رقم ٥٠٨٨؛ وجامع الترمذي، رقم ٣٣٨٨."
      },
      {
        id: "afiyah",
        title: "سؤال العفو والعافية",
        repeat: 1,
        text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ وَمِنْ خَلْفِي، وَعَنْ يَمِينِي وَعَنْ شِمَالِي، وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي.",
        virtue: "دعاء جامع بالعفو والعافية والحفظ، وكان النبي ﷺ يقوله صباحًا ومساءً.",
        source: "سنن أبي داود، رقم ٥٠٧٤."
      },
      {
        id: "fatr",
        title: "دعاء فاطر السماوات والأرض",
        repeat: 1,
        text: "اللَّهُمَّ فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ، عَالِمَ الْغَيْبِ وَالشَّهَادَةِ، رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي، وَشَرِّ الشَّيْطَانِ وَشِرْكِهِ.",
        virtue: "تعوّذ بالله من شر النفس والشيطان، وأرشد النبي ﷺ أبا بكر أن يقول هذا الدعاء صباحًا ومساءً.",
        source: "سنن أبي داود، رقم ٥٠٦٧؛ وجامع الترمذي، رقم ٣٣٩٢."
      },
      {
        id: "kalimatillah",
        title: "الاستعاذة بكلمات الله التامات",
        repeat: 3,
        text: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ.",
        virtue: "من قالها ثلاثًا حين يمسي لم تضره حُمَة تلك الليلة.",
        source: "صحيح مسلم، رقم ٢٧٠٩."
      },
      ...COMMON_ADHKAR
    ]
  };

  /* ============ الاتصال بالـ API (Aladhan) ============ */
  const cache = {};
  async function getData(url) {
    if (cache[url]) return cache[url];
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (json.code !== 200) throw new Error("API error");
    cache[url] = json.data;
    return json.data;
  }
  // method=5 : الهيئة المصرية العامة للمساحة
  const getTimings = (date, lat, lng) =>
    getData(
      `https://api.aladhan.com/v1/timings/${apiDate(date)}?latitude=${lat}&longitude=${lng}&method=5&timezonestring=Africa/Cairo`
    );

  /* ============ اختيار المحافظة والمدينة ============ */
  const selection = { g: "", c: "" };
  let hasSavedSelection = false;
  let selectionRevision = 0;
  try {
    const saved = JSON.parse(localStorage.getItem("egPrayerSel") || "null");
    if (saved && EGYPT[saved.g] && EGYPT[saved.g].c[saved.c]) {
      selection.g = String(saved.g);
      selection.c = String(saved.c);
      hasSavedSelection = true;
    }
  } catch (e) { /* تجاهل */ }

  function saveSelection() {
    try { localStorage.setItem("egPrayerSel", JSON.stringify(selection)); } catch (e) { /* تجاهل */ }
  }

  function fillGovs(sel) {
    sel.innerHTML = '<option value="">اختر المحافظة</option>' +
      EGYPT.map((x, i) => `<option value="${i}">${x.g}</option>`).join("");
  }
  function fillCities(sel, gIdx) {
    if (gIdx === "") {
      sel.innerHTML = '<option value="">اختر المدينة</option>';
      sel.disabled = true;
      return;
    }
    sel.innerHTML = '<option value="">اختر المدينة</option>' +
      EGYPT[gIdx].c.map((x, i) => `<option value="${i}">${x[0]}</option>`).join("");
    sel.disabled = false;
  }
  function applySelectionToForms() {
    [["dGov", "dCity"], ["oGov", "oCity"]].forEach(([g, c]) => {
      $(g).value = selection.g;
      fillCities($(c), selection.g);
      $(c).value = selection.c;
    });
  }
  function currentPlace() {
    if (selection.g === "" || selection.c === "") return null;
    const gov = EGYPT[selection.g];
    const city = gov.c[selection.c];
    return {
      gov: gov.g,
      name: city[0],
      lat: city[1],
      lng: city[2]
    };
  }

  function onGovChange(e) {
    selectionRevision++;
    selection.g = e.target.value;
    selection.c = "";
    saveSelection();
    applySelectionToForms();
    renderAll();
  }
  function onCityChange(e) {
    selectionRevision++;
    selection.c = e.target.value;
    saveSelection();
    applySelectionToForms();
    renderAll();
  }

  function setLocationStatus(message) {
    const status = $("locationStatus");
    status.textContent = message;
    status.hidden = !message;
  }

  function nearestPlace(lat, lng) {
    const radians = (degrees) => degrees * Math.PI / 180;
    let nearest = null;
    let shortest = Infinity;

    EGYPT.forEach((gov, g) => {
      gov.c.forEach((city, c) => {
        const latDistance = radians(city[1] - lat);
        const lngDistance = radians(city[2] - lng);
        const a = Math.sin(latDistance / 2) ** 2 +
          Math.cos(radians(lat)) * Math.cos(radians(city[1])) * Math.sin(lngDistance / 2) ** 2;
        const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (distance < shortest) {
          shortest = distance;
          nearest = { g, c, distance };
        }
      });
    });

    return nearest;
  }

  function locateUser() {
    if (!navigator.geolocation) {
      setLocationStatus("تحديد الموقع غير متاح في هذا المتصفح. اختر المحافظة والمدينة يدويًا.");
      return;
    }

    const revision = selectionRevision;
    const button = $("locateBtn");
    button.disabled = true;
    setLocationStatus("جاري تحديد موقعك...");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        button.disabled = false;
        if (revision !== selectionRevision) {
          setLocationStatus("تم الاحتفاظ بالمحافظة والمدينة اللتين اخترتهما يدويًا.");
          return;
        }

        const { latitude, longitude } = coords;
        if (latitude < 21.5 || latitude > 32.5 || longitude < 24.5 || longitude > 37.5) {
          setLocationStatus("الموقع خارج مصر. اختر المحافظة والمدينة يدويًا.");
          return;
        }

        const nearest = nearestPlace(latitude, longitude);
        if (!nearest || nearest.distance > 100) {
          setLocationStatus("تعذر تحديد أقرب مدينة لموقعك. اختر المحافظة والمدينة يدويًا.");
          return;
        }

        selection.g = String(nearest.g);
        selection.c = String(nearest.c);
        saveSelection();
        applySelectionToForms();
        renderAll();

        const place = currentPlace();
        setLocationStatus(`تم تحديد موقعك بالقرب من ${place.name}، محافظة ${place.gov}.`);
      },
      (error) => {
        button.disabled = false;
        if (revision !== selectionRevision) {
          setLocationStatus("تم الاحتفاظ بالمحافظة والمدينة اللتين اخترتهما يدويًا.");
          return;
        }
        const message = error.code === error.PERMISSION_DENIED
          ? "لم يتم السماح بالوصول إلى الموقع. اختر المحافظة والمدينة يدويًا أو اسمح بالموقع."
          : error.code === error.TIMEOUT
            ? "استغرق تحديد الموقع وقتًا طويلًا. اختر المحافظة والمدينة يدويًا أو حاول مرة أخرى."
            : "تعذر تحديد موقعك. اختر المحافظة والمدينة يدويًا أو حاول مرة أخرى.";
        setLocationStatus(message);
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 }
    );
  }

  function autoLocateWhenAvailable() {
    if (!navigator.geolocation) return;
    if (!hasSavedSelection) {
      locateUser();
      return;
    }
    if (!navigator.permissions || !navigator.permissions.query) return;

    const revision = selectionRevision;
    navigator.permissions.query({ name: "geolocation" }).then((permission) => {
      if (permission.state === "granted" && revision === selectionRevision) locateUser();
    }).catch(() => {
      setLocationStatus("يمكنك تحديد موقعك تلقائيًا من الزر، أو اختيار المحافظة والمدينة يدويًا.");
    });
  }

  /* ============ التبويبات ============ */
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll(".tab").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("active", on);
        b.setAttribute("aria-selected", on);
      });
      $("tab-daily").hidden = tab !== "daily";
      $("tab-other").hidden = tab !== "other";
    });
  });

  /* ============ أذكار الصباح والمساء ============ */
  let adhkarPeriod = "";
  let adhkarDate = "";
  const adhkarProgress = { morning: {}, evening: {} };

  function getAdhkarDate() {
    const today = new Date();
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  }

  function setAdhkarStatus(message) {
    const status = $("adhkarStatus");
    status.textContent = message;
    status.hidden = !message;
  }

  function readAdhkarProgress(period) {
    try {
      const saved = JSON.parse(localStorage.getItem(`egAdhkar:${adhkarDate}:${period}`) || "{}");
      const progress = {};
      ADHKAR[period].forEach((item) => {
        const count = saved[item.id];
        if (Number.isInteger(count) && count >= 0) {
          progress[item.id] = Math.min(count, item.repeat);
        }
      });
      return progress;
    } catch (error) {
      setAdhkarStatus("تعذرت قراءة التقدّم المحفوظ على هذا الجهاز.");
      return {};
    }
  }

  function saveAdhkarProgress() {
    try {
      localStorage.setItem(
        `egAdhkar:${adhkarDate}:${adhkarPeriod}`,
        JSON.stringify(adhkarProgress[adhkarPeriod])
      );
      setAdhkarStatus("");
    } catch (error) {
      setAdhkarStatus("تعذر حفظ التقدّم على هذا الجهاز؛ سيظل ظاهرًا حتى إغلاق الصفحة.");
    }
  }

  function refreshAdhkarDate() {
    const today = getAdhkarDate();
    if (today === adhkarDate) return;
    adhkarDate = today;
    adhkarProgress.morning = readAdhkarProgress("morning");
    adhkarProgress.evening = readAdhkarProgress("evening");
  }

  function renderAdhkar() {
    refreshAdhkarDate();
    $("adhkarContent").hidden = !adhkarPeriod;
    $("adhkarPrompt").hidden = Boolean(adhkarPeriod);
    if (!adhkarPeriod) {
      document.querySelectorAll(".adhkar-period").forEach((button) => {
        button.classList.remove("active");
        button.setAttribute("aria-pressed", "false");
      });
      return;
    }

    const entries = ADHKAR[adhkarPeriod];
    const progress = adhkarProgress[adhkarPeriod];
    const list = $("adhkarList");
    list.replaceChildren();

    document.querySelectorAll(".adhkar-period").forEach((button) => {
      const selected = button.dataset.period === adhkarPeriod;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    let completed = 0;
    entries.forEach((item) => {
      const count = progress[item.id] || 0;
      if (count >= item.repeat) completed++;

      const card = document.createElement("article");
      card.className = "adhkar-card";

      const title = document.createElement("h3");
      title.className = "adhkar-title";
      title.textContent = item.title;

      const text = document.createElement("p");
      text.className = "adhkar-text";
      text.textContent = adhkarPeriod === "evening" && item.eveningText ? item.eveningText : item.text;

      if (item.repeatNote) {
        const repeatNote = document.createElement("p");
        repeatNote.className = "adhkar-repeat-note";
        repeatNote.textContent = item.repeatNote;
        card.append(title, text, repeatNote);
      } else {
        card.append(title, text);
      }

      const virtue = document.createElement("p");
      virtue.className = "adhkar-virtue";
      const virtueLabel = document.createElement("strong");
      virtueLabel.textContent = "الفضل: ";
      virtue.append(virtueLabel, document.createTextNode(item.virtue));

      const source = document.createElement("p");
      source.className = "adhkar-source";
      const sourceLabel = document.createElement("strong");
      sourceLabel.textContent = "الحديث: ";
      source.append(sourceLabel, document.createTextNode(item.source));

      const controls = document.createElement("div");
      controls.className = "adhkar-controls";
      const countLabel = document.createElement("span");
      countLabel.className = "adhkar-count";
      countLabel.textContent = `التكرار: ${num(count)} / ${num(item.repeat)}`;

      const countButton = document.createElement("button");
      countButton.className = "adhkar-count-button";
      countButton.type = "button";
      countButton.textContent = count >= item.repeat ? "اكتمل الذكر" : "سجّلت مرة";
      countButton.disabled = count >= item.repeat;
      countButton.setAttribute("aria-label", `تسجيل تكرار الذكر: ${num(count + 1)} من ${num(item.repeat)}`);
      countButton.addEventListener("click", () => {
        refreshAdhkarDate();
        const currentProgress = adhkarProgress[adhkarPeriod];
        if ((currentProgress[item.id] || 0) >= item.repeat) return;
        currentProgress[item.id] = (currentProgress[item.id] || 0) + 1;
        saveAdhkarProgress();
        renderAdhkar();
      });
      controls.append(countLabel, countButton);

      card.append(virtue, source, controls);
      list.append(card);
    });

    $("adhkarProgress").textContent =
      `أتممت ${num(completed)} من ${num(entries.length)} أذكار هذه الفترة`;
  }

  document.querySelectorAll(".adhkar-period").forEach((button) => {
    button.addEventListener("click", () => {
      refreshAdhkarDate();
      adhkarPeriod = button.dataset.period;
      adhkarProgress[adhkarPeriod] = readAdhkarProgress(adhkarPeriod);
      renderAdhkar();
    });
  });

  $("adhkarReset").addEventListener("click", () => {
    refreshAdhkarDate();
    adhkarProgress[adhkarPeriod] = {};
    saveAdhkarProgress();
    renderAdhkar();
  });

  /* ============ مواعيد الصلاة اليومية ============ */
  const PRAYERS = [
    { key: "Fajr", name: "الفجر" },
    { key: "Sunrise", name: "الشروق", minor: true },
    { key: "Dhuhr", name: "الظهر" },
    { key: "Asr", name: "العصر" },
    { key: "Maghrib", name: "المغرب" },
    { key: "Isha", name: "العشاء" }
  ];
  let daily = null;       // { times, tomorrowFajr }
  let dailyToken = 0;
  let hijriYear = null;

  function show(prefix, state) {
    // state: hint | loading | error | result
    $(prefix + "Hint").hidden = state !== "hint";
    $(prefix + "Loading").hidden = state !== "loading";
    $(prefix + "Error").hidden = state !== "error";
    $(prefix + "Result").hidden = state !== "result";
  }

  async function renderDaily() {
    const place = currentPlace();
    const token = ++dailyToken;
    daily = null;
    if (!place) { show("d", "hint"); return; }
    show("d", "loading");
    try {
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 86400000);
      const [t, tm] = await Promise.all([
        getTimings(today, place.lat, place.lng),
        getTimings(tomorrow, place.lat, place.lng)
      ]);
      if (token !== dailyToken) return;
      hijriYear = parseInt(t.date.hijri.year, 10);
      daily = { times: t.timings, tomorrowFajr: tm.timings.Fajr };

      $("dList").innerHTML = PRAYERS.map((p) =>
        `<li data-key="${p.key}" class="${p.minor ? "minor" : ""}">
           <span class="name">${p.name}</span>
           <span class="time">${fmt12(t.timings[p.key])}</span>
         </li>`
      ).join("");
      $("dPlace").textContent = `المواعيد بتوقيت ${place.name} - ${place.gov} (الهيئة المصرية العامة للمساحة)`;
      show("d", "result");
      updateNext();
    } catch (err) {
      if (token !== dailyToken) return;
      show("d", "error");
    }
  }

  function updateNext() {
    if (!daily) return;
    const now = new Date();
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const five = PRAYERS.filter((p) => !p.minor);
    let next = null, remain = 0, timeStr = "";

    for (const p of five) {
      const sec = toMin(daily.times[p.key]) * 60;
      if (sec > nowSec) { next = p; remain = sec - nowSec; timeStr = daily.times[p.key]; break; }
    }
    if (!next) {
      next = five[0];
      timeStr = daily.tomorrowFajr;
      remain = 86400 - nowSec + toMin(daily.tomorrowFajr) * 60;
    }

    document.querySelectorAll("#dList li").forEach((li) =>
      li.classList.toggle("next", li.dataset.key === next.key)
    );
    $("nextName").textContent = next.name;
    $("nextTime").textContent = fmt12(timeStr);
    const h = Math.floor(remain / 3600), m = Math.floor((remain % 3600) / 60), s = remain % 60;
    $("nextCount").textContent = num(`${pad(h)}:${pad(m)}:${pad(s)}`);
  }
  setInterval(updateNext, 1000);

  // لو الصفحة فضلت مفتوحة وعدّى منتصف الليل، نحدّث التاريخ والمواعيد تلقائياً
  let lastDay = new Date().getDate();
  setInterval(() => {
    const d = new Date().getDate();
    if (d !== lastDay) {
      lastDay = d;
      $("todayText").textContent = fmtLongDate(new Date());
      renderAll();
      renderAdhkar();
    }
  }, 30000);

  /* ============ صلوات أخرى ============ */
  let otherToken = 0;

  function parseApiDate(str) {
    const [d, m, y] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  async function hijriToGreg(day, month, year) {
    const data = await getData(`https://api.aladhan.com/v1/hToG/${pad(day)}-${pad(month)}-${year}`);
    return parseApiDate(data.gregorian.date);
  }
  async function getHijriYear(place) {
    if (hijriYear) return hijriYear;
    const t = await getTimings(new Date(), place.lat, place.lng);
    hijriYear = parseInt(t.date.hijri.year, 10);
    return hijriYear;
  }

  function showOther(title, big, sub, details, note) {
    $("oTitle").textContent = title;
    $("oBig").textContent = big;
    $("oSub").textContent = sub;
    $("oDetails").innerHTML = details.map((d) => `<li><span>${d[0]}</span><span>${d[1]}</span></li>`).join("");
    $("oNote").textContent = note;
    show("o", "result");
  }

  async function renderOther() {
    const place = currentPlace();
    const token = ++otherToken;
    if (!place) { show("o", "hint"); return; }
    show("o", "loading");
    const type = $("oType").value;
    const today = new Date();

    try {
      if (type === "qiyam") {
        const tomorrow = new Date(today.getTime() + 86400000);
        const [t, tm] = await Promise.all([
          getTimings(today, place.lat, place.lng),
          getTimings(tomorrow, place.lat, place.lng)
        ]);
        if (token !== otherToken) return;
        showOther(
          "قيام الليل",
          fmt12(t.timings.Lastthird),
          "بداية الثلث الأخير من الليل",
          [
            ["أذان المغرب", fmt12(t.timings.Maghrib)],
            ["منتصف الليل", fmt12(t.timings.Midnight)],
            ["بداية الثلث الأخير", fmt12(t.timings.Lastthird)],
            ["ينتهي عند أذان الفجر", fmt12(tm.timings.Fajr)]
          ],
          "الثلث الأخير من الليل هو أفضل وقت للقيام والدعاء. يمكن القيام في أي وقت بعد صلاة العشاء حتى الفجر."
        );
      } else if (type === "jumua") {
        const diff = (5 - today.getDay() + 7) % 7;
        const friday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diff);
        const t = await getTimings(friday, place.lat, place.lng);
        if (token !== otherToken) return;
        showOther(
          "صلاة الجمعة",
          fmt12(t.timings.Dhuhr),
          diff === 0 ? "اليوم" : "الجمعة القادمة",
          [
            ["اليوم", fmtLongDate(friday)],
            ["دخول وقت الظهر (الأذان)", fmt12(t.timings.Dhuhr)],
            ["أذان العصر", fmt12(t.timings.Asr)]
          ],
          "تبدأ صلاة الجمعة بعد الأذان والخطبة، ويختلف موعد إقامتها قليلاً من مسجد لآخر."
        );
      } else {
        const isFitr = type === "fitr";
        const year = await getHijriYear(place);
        let date = isFitr ? await hijriToGreg(1, 10, year) : await hijriToGreg(10, 12, year);
        if (date < startOfDay(today)) {
          date = isFitr ? await hijriToGreg(1, 10, year + 1) : await hijriToGreg(10, 12, year + 1);
        }
        const t = await getTimings(date, place.lat, place.lng);
        if (token !== otherToken) return;
        const prayerTime = addMin(t.timings.Sunrise, 20);
        const days = Math.round((startOfDay(date) - startOfDay(today)) / 86400000);
        showOther(
          isFitr ? "صلاة عيد الفطر" : "صلاة عيد الأضحى",
          fmt12(prayerTime),
          days === 0 ? "اليوم" : `بعد ${num(days)} يوم`,
          [
            ["التاريخ المتوقع", fmtLongDate(date)],
            ["شروق الشمس", fmt12(t.timings.Sunrise)],
            ["موعد الصلاة (تقريباً)", fmt12(prayerTime)]
          ],
          "تُصلّى صلاة العيد بعد شروق الشمس بحوالي 15 إلى 20 دقيقة. التاريخ والموعد الرسميان تحددهما رؤية الهلال ووزارة الأوقاف، وقد يختلف الموعد من مسجد لآخر."
        );
      }
    } catch (err) {
      if (token !== otherToken) return;
      show("o", "error");
    }
  }

  /* ============ تشغيل ============ */
  function renderAll() {
    renderDaily();
    renderOther();
  }

  function init() {
    $("todayText").textContent = fmtLongDate(new Date());
    $("year").textContent = num(new Date().getFullYear());

    fillGovs($("dGov"));
    fillGovs($("oGov"));
    applySelectionToForms();

    $("dGov").addEventListener("change", onGovChange);
    $("oGov").addEventListener("change", onGovChange);
    $("dCity").addEventListener("change", onCityChange);
    $("oCity").addEventListener("change", onCityChange);
    $("oType").addEventListener("change", renderOther);
    $("dRetry").addEventListener("click", renderDaily);
    $("oRetry").addEventListener("click", renderOther);
    $("locateBtn").addEventListener("click", locateUser);

    renderAdhkar();
    renderAll();
    autoLocateWhenAvailable();
  }

  init();
})();