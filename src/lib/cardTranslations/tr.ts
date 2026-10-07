import type { CardTextTable } from "./types";

/**
 * Turkish card readings, translated from the English in cardMeanings.ts.
 * The minors' derivation and correspondence rows use one fixed glossary so
 * every card names the suits, worlds and series the same way.
 */
const tr: CardTextTable = {
  "arcana-0": {
    "upright": "Papus, Le Mat'ı diğer bütün kartlardan ayrı bir yere koyar: kendi yüzünde hiçbir sayı taşımayan tek arkandır ve bu yokluğun kendisi öğretidir. O, tümüyle duyulara düşmüş ruhtur — kendi eylemlerinin sonuçlarını sırtında taşıyan ve hiçbirini okumayan, heybesiyle dolaşan gezgin. Düz geldiğinde dürtüyle ve iştahla sürdürülen bir hayattan söz eder: aptallık değil, bağsız kalmış irade, yöneleceği bir terim olmadan hareket eden irade. Papus'un bu kart için kullandığı kehanet sözcüğü delilik, onun ardında da kefarettir.",
    "reversed": "Ters geldiğinde Papus'un yoksunluk kutbu: masum olmaktan çıkmış delilik. Gezginlik artık seçilmiştir, heybe bile bile boş bırakılmıştır, ders yalnızca kaçırılmamış, reddedilmiştir. Düz kart henüz öğrenmemiş bir adamsa, ters kart öğrenmeyi geri çevirmiş bir adamdır — özgürlük kılığına girmiş bir irade feragati. Gezginin kaçıp durduğu sonuçların sonunda geldiği anı da gösterebilir.",
    "inSpread": "Papus bir kartı tek başına değil, düştüğü yere göre okur — başlangıç, karşıtlık, denge, sonuç. Deli açılımın başında, işin bir plan olmadan başladığını ve bir planla yönlendirilemeyeceğini söyler. Karşıtlık konumunda, işin yerine oturmasını engelleyen savrulmadır. Sonuç olarak destenin en dolaysız kartıdır: soru, hiçbir terimi olmayan bir duruma soruluyor ve bir terim kabul edilene dek bedel ödetmeyi sürdürecek.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "21 — Papus, Le Mat'ı sıfırıncı değil, Le Monde'dan önce yirmi birinci sıraya koyar"
      },
      {
        "label": "İbrani harfi",
        "value": "Şin (ש)"
      },
      {
        "label": "Hiyeroglif",
        "value": "Bir diş; genişletilmiş anlamıyla ok — delip geçen ve dağıtan şey"
      },
      {
        "label": "Yedili",
        "value": "Üçüncü yedili (15–21), Doğa dünyası — maddi dizinin kendini tükettiği yedinci ve geçiş terimi"
      },
      {
        "label": "Kehanet anlamı",
        "value": "Delilik; duyusal hayat; kefaret"
      }
    ]
  },
  "arcana-1": {
    "upright": "Papus'un ilk kartı bir panayır hokkabazı değil, bütün destenin saymaya başladığı birliktir — hiyeroglifi insanın kendisi olan Alef. Bu, henüz bir nesne seçmemiş iradedir: etkin ilke, bir şeyin, birisi öyle olması gerektiğine karar verdiği için mümkün hâle geldiği nokta. Masasındaki dört amblem dört takımdır; Papus'un okumasında bu, dört dünyanın da ona açık olduğu ve henüz hiçbirine bağlanmadığı anlamına gelir. Kehanet anlamı: irade.",
    "reversed": "Nesnesiz irade ya da sonuca değil etkiye harcanan irade — dört aletin dördüne de sahip olup onları göz boyamak için kullanan adam. Ters geldiğinde sonsuza dek ertelenen kararı da gösterir: olasılığın özenle olasılık olarak korunması, çünkü onu tek bir dünyaya bağlamak, öbür üçünde mümkün olmasına son verirdi.",
    "inSpread": "Açılımın başında iş, birisi onu iradesiyle var ettiği için vardır — o kişiyi bulun, çünkü açılım ona aittir. Karşıtlık konumunda rakip bir irade vardır, rakip bir koşul değil. Denge konumunda durum ancak irade etkin biçimde uygulandığı sürece ayakta kalır. Sonuç olarak Papus duygusallığa yer vermez: sonuç soruyu soranın kendi elindedir, başka hiçbir yerde değil.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "1"
      },
      {
        "label": "İbrani harfi",
        "value": "Alef (א)"
      },
      {
        "label": "Hiyeroglif",
        "value": "İnsan — irade eden varlık"
      },
      {
        "label": "Yedili",
        "value": "Birinci yedili (1–7), İlahi dünya — birinci terim, mutlak etkin (Yod)"
      },
      {
        "label": "Kehanet anlamı",
        "value": "İrade"
      }
    ]
  },
  "arcana-2": {
    "upright": "Büyücü'nün iradesine karşılık veren edilgen kutup. Bet insanın ağzıdır — ve genişletilmiş anlamıyla ev, kabul eden ve içine alan şey. Papus, La Papesse'i uygulanan değil, elde tutulan bilgi olarak okur: dizindeki kitap kapalı ya da yarı örtülüdür ve bu, gizlemenin kendisi için yapılmış bir gizleme değil, edilgen terimin koşuludur. O, söylenmeden önce bilinendir; etkin ilkeyi anlaşılır kılan yansıtıcı ilke. Kehanet anlamı: bilim, bilgi.",
    "reversed": "Saklamanın artık hiçbir işe yaramadığı noktadan sonra da esirgenen bilgi ya da salt edilgenliğe gevşemiş alıcılık — bilgelik sanılan bekleyiş. Ters geldiğinde, yüzeyin ötesine hiç geçmemiş bir öğrenmeyi de aynı ölçüde gösterebilir: her yere taşınan ama hiç açılmayan kitap, gerçekte çalışılmamış bir konudan ödünç alınmış otorite.",
    "inSpread": "Açılımın başında iş, bilinen ama söylenmeyen bir şeyle başlar; genellikle bunu yalnızca taraflardan biri bilir. Karşıtlık konumunda o, soruyu soranın sahip olmadığı ve üstüne giderek elde edemeyeceği bilgidir. Denge konumunda bütün durum bir sessizlikle yerinde tutulmaktadır. Sonuç olarak Papus'un verdiği yanıt eylem değil bilgidir: burada kazanılacak şey kavrayıştır ve o gelmeden harekete geçmek onu bozar.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "2"
      },
      {
        "label": "İbrani harfi",
        "value": "Bet (ב)"
      },
      {
        "label": "Hiyeroglif",
        "value": "İnsanın ağzı; ev, içine alan şey"
      },
      {
        "label": "Yedili",
        "value": "Birinci yedili (1–7), İlahi dünya — ikinci terim, mutlak edilgen (He)"
      },
      {
        "label": "Kehanet anlamı",
        "value": "Bilim; bilgi; gizli olduğu hâlde yine de var olan şey"
      }
    ]
  },
  "arcana-3": {
    "upright": "Papus'un üçüncü terimi her zaman ilk ikisini birbirine bağlayandır ve Gimel'in hiyeroglifi bu bağın nasıl kurulduğunu söyler: kavrama eylemi içindeki insan eli. İmparatoriçe, üretken hâle gelmiş irade ve bilgidir — bir duygu olarak doğurganlık değil, bir mekanizma olarak üreme; bir fikrin beden kazandığı ve kendine ait sonuçlar doğurmaya başladığı nokta. Kehanet anlamı: eylem. Dizide zihnin dışında bir şeyin değiştiği ilk kart odur.",
    "reversed": "Biçimsiz üreme: durmadan üreten ama hiçbir zaman bir sonuca varmayan etkinlik. Ya da fazla sıkı kapanmış kavrayan el — üretimin olması gereken yerde sahiplenme, büyüyemeyecek kadar sıkı tutulan bir şey. Ters geldiğinde, kendisine hiç beden tanınmamış bir fikri de gösterebilir.",
    "inSpread": "Açılımın başında iş, niyet edilen değil gerçekten yapılan bir şeyle başlar. Karşıtlık konumunda, kendi amacının hep önüne geçen bir etkinlik. Denge konumunda o, iki tarafa yapacak bir şey vererek onları bir arada tutan üretken ortadır. Sonuç olarak: soru eylemde çözülür ve Papus'un üçüncü terimi onu her zaman dışarıda çözer — zihinde değil, dünyada bir değişiklik bekleyin.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "3"
      },
      {
        "label": "İbrani harfi",
        "value": "Gimel (ג)"
      },
      {
        "label": "Hiyeroglif",
        "value": "Kavrama eylemi içindeki insan eli"
      },
      {
        "label": "Yedili",
        "value": "Birinci yedili (1–7), İlahi dünya — üçüncü terim, etkini edilgene bağlayan nötr ilke (Vav)"
      },
      {
        "label": "Kehanet anlamı",
        "value": "Eylem"
      }
    ]
  },
  "arcana-4": {
    "upright": "Dördüncü terim, ilk üçünün harekete geçirdiğini gerçekleştirir ve Dalet'in hiyeroglifi göğüstür — içine alan ve koruyan şey. Papus'un İmparator'u, sabit bir biçime indirilmiş etkin ilkedir: otorite, çerçeve, bir şeyi yerinde tutan kural. Büyücü irade ise, İmparator bir yapıya dönüşerek katılaşmış ve artık kimsenin onu irade etmeyi sürdürmesine bağlı olmayan iradedir. Kehanet anlamı: gerçekleşme.",
    "reversed": "Kendisini haklı kılan amaçtan daha uzun yaşayan yapı — kendi uğruna sürdürülen çerçeve, düzen sanılan katılık. Ters geldiğinde, onu hak ettirecek emek olmadan sahiplenilen otoriteyi de kapsar: onu kurmamış ve ayakta tutamayacak birinin oturduğu taht.",
    "inSpread": "Açılımın başında iş, var olan bir yapının içinde başlar — bir sözleşme, bir kurum, zaten yürürlükte olan bir kural. Karşıtlık konumunda, tartışmaya gelmeyen otorite. Denge konumunda İmparator durumu istikrarlı tutan şeydir ve onu ortadan kaldırmak göründüğünden pahalıdır. Sonuç olarak: şey sabitlenir ve Papus'un dördüncü terimi aynı zamanda bir eksendir — burada sabitlenen, bir sonraki diziyi başlatır.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "4"
      },
      {
        "label": "İbrani harfi",
        "value": "Dalet (ד)"
      },
      {
        "label": "Hiyeroglif",
        "value": "Göğüs — içine alan ve koruyan şey"
      },
      {
        "label": "Yedili",
        "value": "Birinci yedili (1–7), İlahi dünya — dördüncü terim, gerçekleşme; Büyücü'yü dizinin alt düzeyinde yansıtır"
      },
      {
        "label": "Kehanet anlamı",
        "value": "Gerçekleşme"
      }
    ]
  },
  "arcana-5": {
    "upright": "Beşinci terim ikinciyi yansıtır: bilgi, bu kez aktarılan bilgi. He nefesin harfidir — bir varlıktan çıkıp ötekine geçen şeyin. Papus'un Papa'sı kanaldır: öğreti, gelenek, bilinenin onu henüz bilmeyen birine ulaştığı araç. Kaynak değildir ve öyle olduğunu da iddia etmez; otoritesi bütünüyle aktarımın sadakatindedir. Kehanet anlamı: esin.",
    "reversed": "İçeriği gitmiş aktarım — titizlikle korunan biçim, çoktan yitip gitmiş anlam. Ya da özgürleştirmek yerine bağlayan öğretim, kendini kaynak sanan kanal. Ters geldiğinde tam karşıt hatayı da aynı ölçüde gösterebilir: alınan her şeyin ilke gereği reddedilmesi; böylece hiçbir şey miras kalmaz ve her dersin bedeli iki kez ödenir.",
    "inSpread": "Açılımın başında iş, öğretilen, öğütlenen ya da miras kalan bir şeyle başlar. Karşıtlık konumunda ortodoksluk — işin alışılmış yapılış biçimi, ki yolu tıkayan da odur. Denge konumunda o arabulucudur ve durum, biri iki taraf arasında tercümanlık yaptığı için ayakta kalır. Sonuç olarak: yanıt soruyu soranın dışından, bir vahiy yoluyla değil bir kanal aracılığıyla gelir.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "5"
      },
      {
        "label": "İbrani harfi",
        "value": "He (ה)"
      },
      {
        "label": "Hiyeroglif",
        "value": "Nefes — insanın solunumu"
      },
      {
        "label": "Yedili",
        "value": "Birinci yedili (1–7), İlahi dünya — beşinci terim, Yüksek Rahibe'yi yansıtır: dışa dönmüş bilgi"
      },
      {
        "label": "Kehanet anlamı",
        "value": "Esin"
      }
    ]
  },
  "arcana-6": {
    "upright": "Vav'ın hiyeroglifi göz ve kulaktır — bir insanın içindekini dışındakine bağlayan organlar. Papus altıncı arkanı seçim sınavı olarak okur: adam iki yol arasında durur, ok çoktan üzerinde gerilmiştir. Bu bir aşk hikâyesi değildir ve onu aşk hikâyesi olarak okumak kartı yitirmek demektir. Bağlayıcı terimin bir birey tarafından uygulanması gereken andır; seçim bir kez yapıldığında geri alınamaz.",
    "reversed": "Kaçınılan seçim — koşullar birini kapatana dek iki yolu da açık tutmak; bu, kendiliğinden yapılmış bir seçimdir ve genellikle daha kötü olanıdır. Ya da göz ve kulakla değil iştahla yapılan seçim: önce ne bakmadan ne dinlemeden, yalnızca istemenin gücüyle verilen karar.",
    "inSpread": "Açılımın başında bütün iş zaten verilmiş bir karara dayanır ve okuma, o kararın içinde yaşamakla ilgilidir. Karşıtlık konumunda, çekiciliğini yitirmeyen ikinci bir seçenek. Denge konumunda durum gerçekten askıdadır ve onu orada tutan soruyu soranın kendisidir. Sonuç olarak: bir seçim gerekir, bu seçim onundur ve Papus'un sınavı iyi niyetlerle yumuşamaz.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "6"
      },
      {
        "label": "İbrani harfi",
        "value": "Vav (ו)"
      },
      {
        "label": "Hiyeroglif",
        "value": "Göz ve kulak — içi dışa bağlayan şey"
      },
      {
        "label": "Yedili",
        "value": "Birinci yedili (1–7), İlahi dünya — altıncı terim, İmparatoriçe'yi yansıtır: tek bir karara daralmış eylem"
      },
      {
        "label": "Kehanet anlamı",
        "value": "Çile; sınav; bağlayan seçim"
      }
    ]
  },
  "arcana-7": {
    "upright": "Yedinci terim her zaman geçiştir ve Zayin oktur — bir yerden ötekine geçen şey. Papus'un Savaş Arabası, tamamlanıp öteye taşınan birinci yedilidir: irade, bilgi ve eylem artık kendi gücüyle hareket eden bir sonuç üretmiştir. Zafer, ama bir varış değil bir geçiş olarak zafer. İki sfenks farklı yönlere çeker ve onları tek bir yolda tutan yalnızca sürücüdür.",
    "reversed": "Süreni olmayan hareket — bir şeyi durması gereken noktanın çok ötesine taşıyan ivme. Ters geldiğinde, kolay yarısı olduğu anlaşılan zaferi de gösterebilir: geçiş yapılmıştır ama karşı kıyı için hiçbir hazırlık yoktur.",
    "inSpread": "Açılımın başında iş, soruyu soranın daha önce bitirdiği bir şeyden devralınarak zaten hareket hâlinde başlar. Karşıtlık konumunda, tartışmanın yavaşlatamayacağı, kendi ivmesi olan bir güç. Denge konumunda Savaş Arabası doğası gereği istikrarsızdır — ancak hareket ettiği sürece ayakta kalır. Sonuç olarak Papus zaferi kelimenin tam anlamıyla kasteder, ama ondan sonraki konumu da okuyun: bir geçiş her zaman bir şeye devreder.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "7"
      },
      {
        "label": "İbrani harfi",
        "value": "Zayin (ז)"
      },
      {
        "label": "Hiyeroglif",
        "value": "Bir ok; bir silah — geçen şey"
      },
      {
        "label": "Yedili",
        "value": "Birinci yedili (1–7), İlahi dünya — İlahi diziyi İnsan dünyasına taşıyan yedinci ve geçiş terimi"
      },
      {
        "label": "Kehanet anlamı",
        "value": "Zafer"
      }
    ]
  },
  "arcana-8": {
    "upright": "İkinci yedili İnsan dünyasını açar ve onu terazi ile açar. Het'in hiyeroglifi bir tarladır — çevrili bir alan, ölçülmüş ve sınırlanmış toprak. Papus'un Adalet'i insan düzeyindeki etkin ilkedir ve etkin biçimde yaptığı şey ölçmektir: merhamet değil, orantı. Kılıç karta terazi kadar aittir, çünkü onun okumasında uygulanamayan bir hüküm verilmiş sayılmaz. Kehanet anlamı: adalet, denge.",
    "reversed": "Yanlış uygulanan ölçü — lafzın korunup orantının yitirilmesi; doğru bir usul yanlış bir sonucu tam da böyle üretir. Ya da kefelerin nerede duracağında çıkarı olan birinin tuttuğu terazi. Ters geldiğinde kılıçsız verilen hükmü de kapsar: kusursuzca sağlam, hiç uygulanmamış ve bu yüzden henüz gerçek olmayan.",
    "inSpread": "Açılımın başında iş, kapatılmakta olan bir hesapla başlar. Karşıtlık konumunda, soruyu soranın kendisiyle ölçüldüğü ve belki de hiç kabul etmediği bir ölçüt. Denge konumunda Adalet tam olarak konumun söylediğidir — durum dengededir ve ancak iki kefe de gözetildiği sürece dengede kalır. Sonuç olarak: orantı, kimin lehine olursa olsun yeniden kurulur.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "8"
      },
      {
        "label": "İbrani harfi",
        "value": "Het (ח)"
      },
      {
        "label": "Hiyeroglif",
        "value": "Bir tarla — çevrili ve ölçülmüş toprak"
      },
      {
        "label": "Yedili",
        "value": "İkinci yedili (8–14), İnsan dünyası — birinci terim, etkin ilke (Yod)"
      },
      {
        "label": "Kehanet anlamı",
        "value": "Adalet; denge"
      }
    ]
  },
  "arcana-9": {
    "upright": "İnsan dünyasının edilgen kutbu. Tet bir çatıdır — barınak, korumak için çevreleyen şey. Papus'un Ermiş'i kendi ışığını ve kendi korunağını taşır: kalabalıkların görünmez kıldığı bir şey görülebilsin diye üstlenilen, bilinçli ve geçici bir çekilme. Onun anladığı anlamda sağduyu ürkeklik değil, bir şeyin biçimi seçilebilene dek onu bilinçli olarak yavaşlatmaktır. Kehanet anlamı: sağduyu, bilgelik.",
    "reversed": "Saklanmaya dönüşmüş barınak — nedeninden daha uzun yaşamış ve artık durumu incelemenin bir yöntemi olmaktan çıkıp durumun kendisi olmuş bir çekilme. Ters geldiğinde, soruyu soranın vermek istemediği bir karara verilen ad olarak kullanılan sağduyuyu da kapsar: her yere taşınan ama hiç gerçekten kaldırılmayan fener.",
    "inSpread": "Açılımın başında iş, bilinçli bir geri çekilişle başlar — ve Papus bu geri çekilişi gecikme olarak değil, neden olarak okurdu. Karşıtlık konumunda birinin yokluğu, varlığının yapacağından fazlasını yapmaktadır. Denge konumunda durum istikrarlıdır, çünkü kendi hâline bırakılmıştır. Sonuç olarak: yanıt daha yavaş gitmektir ve kart bu konuda alışılmadık ölçüde düz anlamlıdır.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "9"
      },
      {
        "label": "İbrani harfi",
        "value": "Tet (ט)"
      },
      {
        "label": "Hiyeroglif",
        "value": "Bir çatı; bir barınak — korumak için çevreleyen şey"
      },
      {
        "label": "Yedili",
        "value": "İkinci yedili (8–14), İnsan dünyası — ikinci terim, edilgen ilke (He)"
      },
      {
        "label": "Kehanet anlamı",
        "value": "Sağduyu; bilgelik"
      }
    ]
  },
  "arcana-10": {
    "upright": "İnsan yedilisinin bağlayıcı terimi; Papus ona Yod'u verir — işaret eden parmak, Tetragrammaton'u açan ve onun sisteminde her döngüyü başlatan harf. Çark koşullardır: tek bir kişinin başlatmadığı ve herkesi sürükleyen hareket. Talih burada ne ödül ne cezadır; iradeye ve sağduyuya üzerinde iş görecekleri bir şey veren mekanizmadır. O olmasa insan yedilisinin işleyecek malzemesi olmazdı.",
    "reversed": "Bir hareket olarak değil, bir tuzak olarak hissedilen çark — koşulların kişisel algılanması, ki bu Papus'un şemasında bir kategori hatasıdır. Ters geldiğinde, çoktan geçilmiş dönüşü de gösterebilir: fırsat doğru okunmuştur ama çok geç; dolayısıyla okuma artık yükselişle değil inişle ilgilidir.",
    "inSpread": "Açılımın başında iş kimsenin seçimiyle değil, koşulların sonucu olarak başlamıştır — bu da ondan kimin sorumlu olduğunu değiştirir. Karşıtlık konumunda engel zamanlamanın kendisidir. Denge konumunda durum, izlense de izlenmese de dönmektedir. Sonuç olarak Papus, çoğu destenin olmadığı biçimde tarafsızdır: talih hareket eder ve okuma kimin lehine olduğunu söylemez.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "10"
      },
      {
        "label": "İbrani harfi",
        "value": "Yod (י)"
      },
      {
        "label": "Hiyeroglif",
        "value": "Uzatılmış işaret parmağı — Tetragrammaton'u başlatan harf"
      },
      {
        "label": "Yedili",
        "value": "İkinci yedili (8–14), İnsan dünyası — üçüncü terim, hükmü sağduyuya bağlayan nötr ilke (Vav)"
      },
      {
        "label": "Kehanet anlamı",
        "value": "Talih"
      }
    ]
  },
  "arcana-11": {
    "upright": "On birinci, sekizinciyi yansıtır: Adalet'in ölçtüğünü Güç uygular. Kaf, kavrama eylemi içinde yarı kapanmış eldir — tutmuş ama sıkmamış bir kavrayış. Papus'un Force'u bilerek şiddet değildir; kadın aslanın çenelerini silahsız, elleriyle açar; bu, bir dirence karşı değil, ustalık yoluyla uygulanan güçtür. Nesnesiyle orantılı güç — kalıcı olan tek güç türü budur. Kehanet anlamı: güç.",
    "reversed": "Sonuna kadar kapanmış el — zorlamaya dönüşmüş güç; baskı daha çabuk olduğu için ustalıktan vazgeçilmiş. Ters geldiğinde, zamanı geçene dek geri tutulan gücü de kapsar: hiç kurulmamış kavrayış ve artık serbest kalmış aslan.",
    "inSpread": "Açılımın başında iş, birinin baskıyı iyi uygulamasıyla başlar. Karşıtlık konumunda, karşıdan karşılanamayan ve kartın aslana davrandığı gibi ele alınması gereken bir güç. Denge konumunda Güç her şeyi sabit tutan çabadır ve bu çaba, onu gösteren kişiye pahalıya mal olmaktadır. Sonuç olarak: ustalık; özellikle de tartışmayla boyun eğmeyecek bir şey üzerindeki ustalık.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "11"
      },
      {
        "label": "İbrani harfi",
        "value": "Kaf (כ)"
      },
      {
        "label": "Hiyeroglif",
        "value": "Kavrama eylemi içinde yarı kapanmış el"
      },
      {
        "label": "Yedili",
        "value": "İkinci yedili (8–14), İnsan dünyası — dördüncü terim, Adalet'i yansıtır: uygulamaya taşınan ölçü"
      },
      {
        "label": "Kehanet anlamı",
        "value": "Güç"
      }
    ]
  },
  "arcana-12": {
    "upright": "Ermiş'in çekilmesinin yansıması, bu kez istem dışı ve topyekûn. Lamed uzatılmış koldur — erişim ve erişmenin bedeli. Papus, Le Pendu'yü kurbanın terimi olarak okur: üstlenilen ya da kabul edilen bir askıda kalış; bunda bir insanla dünya arasındaki olağan ilişki bilinçli olarak tersine çevrilir. Hiçbir şey kıpırdamaz ve bu kartın başarısızlığı değil, içeriğidir. Kehanet anlamı: kurban.",
    "reversed": "Nesnesiz askıda kalış — haklı çıkarılması gerekmesin diye kurban olarak yeniden adlandırılmış bekleyiş. Ya da soruyu soranın aslında hiç vazgeçmeye niyet etmediği bir şey için yüksek sesle ve tekrar tekrar ödenen bedel. Ters geldiğinde ipin erken kesildiği ve bütün bedelin boşuna ödendiği anlamına da gelebilir.",
    "inSpread": "Açılımın başında iş, vazgeçilen bir şeyle başlar. Karşıtlık konumunda, soruyu soranın ödemeyi reddettiği ve durumun önüne koymayı sürdüreceği bir bedel. Denge konumunda kurban verilene dek hiçbir şey kıpırdamaz — bu konumu istikrar olarak okumak yaygın bir hatadır. Sonuç olarak: sonuç satın alınır ve Papus bedelin sembolik olduğunu iddia etmez.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "12"
      },
      {
        "label": "İbrani harfi",
        "value": "Lamed (ל)"
      },
      {
        "label": "Hiyeroglif",
        "value": "Kol — uzatılmış kol"
      },
      {
        "label": "Yedili",
        "value": "İkinci yedili (8–14), İnsan dünyası — beşinci terim, Ermiş'i yansıtır: artık seçilmemiş bir çekilme"
      },
      {
        "label": "Kehanet anlamı",
        "value": "Kurban"
      }
    ]
  },
  "arcana-13": {
    "upright": "Kader Çarkı'nın yansıması: yine koşullar, ama artık geri döndürülemez. Mem'in hiyeroglifi bir kadındır ve Papus'un dayandığı gelenekte bu, doğuşun ve anneliğin harfidir — dolayısıyla on üçüncü arkan yok oluş değil, dönüşümdür. Bir hâli, bir başkası açılabilsin diye kapatan karttır bu; Papus da bu kapanışın pazarlığa açık olmadığını dolandırmadan söyler. Kehanet anlamı: ölüm; dönüşüm.",
    "reversed": "Direnilen dönüşüm — vadesi dolmuş bir hâlin, sürdürüldüğü her ay artan bir bedelle hayatta tutulması. Ya da değişim takvimine uygun ilerlerken soruyu soranın hiçbir şey olmadığında ısrar etmesi; bu, değişimi yavaşlatmaz, ama onun alacağı biçim üzerindeki bütün söz hakkını ortadan kaldırır.",
    "inSpread": "Açılımın başında iş, başka bir şey sona erdiği için başlar. Karşıtlık konumunda, soruyu soranın kabullenmeyip tartıştığı bir son. Denge konumunda durum çoktan ölmüştür ve yalnızca alışkanlıkla ayakta tutulmaktadır. Sonuç olarak Papus'un kastettiği, kapanan bir hâl ve açılan bir başkasıdır — okuma hangi hâlin bittiğini söyler, yerine neyin geleceğini asla söylemez; bunu yalnızca bu karttan çıkarmaya kalkmak bir hatadır.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "13"
      },
      {
        "label": "İbrani harfi",
        "value": "Mem (מ)"
      },
      {
        "label": "Hiyeroglif",
        "value": "Bir kadın — doğuşun harfi"
      },
      {
        "label": "Yedili",
        "value": "İkinci yedili (8–14), İnsan dünyası — altıncı terim, Kader Çarkı'nı yansıtır: geri döndürülemez hâle gelmiş koşullar"
      },
      {
        "label": "Kehanet anlamı",
        "value": "Ölüm; dönüşüm"
      }
    ]
  },
  "arcana-14": {
    "upright": "İnsan yedilisinden çıkış geçidi; Nun'un hiyeroglifi meyvedir — üretilen ve ileriye taşınan şey. Papus'un Ölçülülük'ü birleştirmedir: iki kap ve aralarındaki alışveriş; kartın bütün işleyişi bundan ibarettir. Kısıtlama anlamında bir ılımlılık değil, iki şeyin üçüncü bir şeyi mümkün kılacak biçimde doğru oranlanması. Son insani terimdir ve devrettiği şey bir sonuç değil, bir karışımdır.",
    "reversed": "Yanlış oran — kaplardan birinden fazlası ya da ikisinin birbirinden ayrı tutulması, öyle ki hiçbir şey üretilmez. Ters konum, bir şeyin bitmesine asla izin vermeyen bitmek bilmez ayarlamayı da kapsar: ileri geri dökmek başlı başına uğraşın kendisi olur ve üçüncü bir şey hiçbir zaman amaçlanmaz.",
    "inSpread": "Açılımın başında iş, daha önce ayrı olan iki şeyin karışımı olarak başlar. Karşıtlık konumunda, birleşmeyecek bir şey; zorlamak ikisini de bozar. Denge konumu Ölçülülük'e en çok yakışan konumdur: durum, iki güç doğru oranda tutulduğu için işler. Sonuç olarak: bir sentez; bu bir geçiştir ve yeniden bir sonrakine devredecektir.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "14"
      },
      {
        "label": "İbrani harfi",
        "value": "Nun (נ)"
      },
      {
        "label": "Hiyeroglif",
        "value": "Bir meyve — üretilen ve taşınan şey"
      },
      {
        "label": "Yedili",
        "value": "İkinci yedili (8–14), İnsan dünyası — yedinci ve geçiş terimi; insan dizisini Doğa dünyasına taşır"
      },
      {
        "label": "Kehanet anlamı",
        "value": "Ölçülülük; birleştirme"
      }
    ]
  },
  "arcana-15": {
    "upright": "Üçüncü yedili maddi dünyayı açar ve Papus onu yazgıyla açar. Samek bir oktur — salıverilen ve geri çağrılamayan şey. Kartın ayak ucundaki figürler zincirlidir, ama zincirler gevşektir ve Papus'un bütün meselesi de budur: maddi zorunluluk, en az zorla bağladığı kadar sık rızayla da bağlar. Buradaki kader, önceden seçilmiş olanın mekanik sonucu demektir. Kehanet anlamı: kader, yazgı.",
    "reversed": "Fark edilen zincir — gevşek tasmanın ne olduğunun görülmesi; onu çıkarmanın ilk koşulu da budur. Ters konum düz konumdan daha kötü de olabilir: rıza öylesine eksiksizdir ki bağ artık bir bağ olarak hissedilmez ve özgürlük diye anlatılır olmuştur.",
    "inSpread": "Açılımın başında iş, soruyu soranın daha önce razı olduğu bir şeyin sonucu içinde başlar. Karşıtlık konumunda bir bağımlılık — Papus bunun ne sağladığına bakardı, çünkü hiçbir şey boşuna zincirli kalmaz. Denge konumunda düzen istikrarlıdır ve sorun da tam bu istikrardır. Sonuç olarak: zorunluluk; yani sonuç, soru sorulmadan önce alınmış kararlarla zaten belirlenmiştir.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "15"
      },
      {
        "label": "İbrani harfi",
        "value": "Samek (ס)"
      },
      {
        "label": "Hiyeroglif",
        "value": "Bir ok — salıverilen ve geri çağrılamayan şey"
      },
      {
        "label": "Yedili",
        "value": "Üçüncü yedili (15–21), Doğa dünyası — birinci terim, maddi dünyanın etkin ilkesi (Yod)"
      },
      {
        "label": "Kehanet anlamı",
        "value": "Kader; yazgı"
      }
    ]
  },
  "arcana-16": {
    "upright": "Ayin maddi duyudur — dokunulabilen, tartılabilen ve sahip olunabilen şeye bağlanış. On altıncı arkan maddi yedilinin edilgen terimidir: madde, taşıyabileceğinin ötesinde inşa edildiğinde ne yaparsa odur. Papus'un Maison-Dieu'sü dışarıdan gelen bir talihsizlik değildir. Kendi sınırına dayanan bir yapıdır; yıldırım yalnızca andır, neden değil. Kehanet anlamı: yıkım, çöküş.",
    "reversed": "Ertelenen çöküş — bilinen çatlak, maliyeti hesaplanmış ama yapılmamış onarım, ödünç zamanla ayakta duran kule. Ya da çoktan tamamlanmış bir yıkım; bu durumda okuma kulenin yıkılıp yıkılmayacağıyla değil, enkazın içinde ne yapılacağıyla ilgilidir — ki bu başka ve daha işe yarar bir sorudur.",
    "inSpread": "Açılımın başında iş, uzun zamandır ayakta duran bir şeyin enkazında başlar. Karşıtlık konumunda, soruyu soranın onunla ilgili planları ne olursa olsun çökecek bir yapı. Denge konumunda Kule bir hâl değil, bir uyarıdır — burada dengede olan hiçbir şey yoktur; yalnızca henüz yıkılmamıştır. Sonuç olarak: yapı gider ve Papus'a göre nasıl inşa edildiği yüzünden gider.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "16"
      },
      {
        "label": "İbrani harfi",
        "value": "Ayin (ע)"
      },
      {
        "label": "Hiyeroglif",
        "value": "Maddi bağ; maddi duyu"
      },
      {
        "label": "Yedili",
        "value": "Üçüncü yedili (15–21), Doğa dünyası — ikinci terim, maddi dünyanın edilgen ilkesi (He)"
      },
      {
        "label": "Kehanet anlamı",
        "value": "Yıkım; çöküş"
      }
    ]
  },
  "arcana-17": {
    "upright": "Maddi yedilinin bağlayıcı terimi. Pe ağız ve dildir — ifade, dışarı dökülen şey. Papus'un sıralamasında Yıldız, Kule'nin ardından gelir ve anlamı bu sıra taşır: bir yapı çöktükten sonra geriye kalan, yeniden dökebilme yetisidir. Onun okumasında umut bir ruh hâli değil, bir işleyiştir — akışın yeniden başlaması; bunu da az önce temizlenmiş toprağa iki kabı boşaltan bir figür gösterir.",
    "reversed": "Onu tutmayacak toprağa dökmek — çaba fazla erken, dolduracağı bir şey henüz yokken yeniden başlatılmıştır. Ya da umudun bilerek bir planın yerine konması; maddi yedilide bu, yapılabilecek en pahalı hatadır.",
    "inSpread": "Açılımın başında iş, bir kaybın hemen ardından başlar — bütün okumayı bir toparlanma olarak okuyun. Karşıtlık konumunda, hiçbir işe yaramayan bir iyimserlik. Denge konumunda Yıldız durumu açık tutar; doğru kullanımı da budur. Sonuç olarak Papus ölçülüdür: vaat edilen, yeniden başlayabilme yetisidir, inşa edilecek olan şey değil.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "17"
      },
      {
        "label": "İbrani harfi",
        "value": "Pe (פ)"
      },
      {
        "label": "Hiyeroglif",
        "value": "Ağız; dil — dışarı dökülen şey"
      },
      {
        "label": "Yedili",
        "value": "Üçüncü yedili (15–21), Doğa dünyası — üçüncü terim, zorunluluğu yıkıma bağlayan nötr ilke (Vav)"
      },
      {
        "label": "Kehanet anlamı",
        "value": "Umut"
      }
    ]
  },
  "arcana-18": {
    "upright": "Maddi yedilinin alt düzeyinde Şeytan'ın yansıması. Tsadi'nin hiyeroglifi bir sığınaktır ve, genişletilmiş anlamıyla, bir sınır ya da bir son. Ay, yetersiz ışıkta görülen maddi dünyadır: kuleler arasındaki yol gerçektir, köpek ve kurt gerçektir, ama bu ışıkta hiçbiri birbirinden ayırt edilemez. Papus'un anlamı aldatmacadır — buna kendini aldatma da dahildir; yakalanması çok daha zor olan yarısı. Kehanet anlamı: gizli düşmanlar, aldatmaca.",
    "reversed": "Geri dönen ışık ya da sonunda adı konan aldatmaca — burada ters konum çoğu zaman ikisinin daha iyisidir. Ama daha kötü de olabilir: soruyu soranın görebildiğinden tamamen emin olması, hem de kesinliğin çare değil tam da belirti olduğu koşullarda.",
    "inSpread": "Açılımın başında iş, yanlış bir anlatımdan başlar — çoğu zaman iyi niyetle yapılmış bir anlatımdan. Karşıtlık konumunda gizlenmiş bir şey; Papus'un yöntemi onu sezmeye çalışmayı değil, aramayı söyler. Denge konumunda durum ancak kimse yakından bakmadığı sürece ayakta kalır. Sonuç olarak: cevap, sorunun henüz dürüstçe cevaplanamayacağıdır — ki bu da kendi başına kullanılabilir bir sonuçtur.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "18"
      },
      {
        "label": "İbrani harfi",
        "value": "Tsadi (צ)"
      },
      {
        "label": "Hiyeroglif",
        "value": "Bir çatı, bir sığınak; genişletilmiş anlamıyla sınır, son"
      },
      {
        "label": "Yedili",
        "value": "Üçüncü yedili (15–21), Doğa dünyası — dördüncü terim, Şeytan'ı yansıtır: artık açıkça görülmeyen zorunluluk"
      },
      {
        "label": "Kehanet anlamı",
        "value": "Aldatmaca; gizli düşmanlar"
      }
    ]
  },
  "arcana-19": {
    "upright": "Kule'nin yansıması ve bu tersine çevirme kasıtlıdır: on altı yıkılan bir yapıysa, on dokuz ayakta kalan bir yapıdır. Kof bir baltadır — bir alet; yalnızca maruz kalınan değil, yapılan ve kullanılan bir şey. Papus'un anlamı dünyevi mutluluktur ve buradaki niteleme gerçekten iş görür: bu, maddi dünyanın sade bir biçimde, gizemsiz işleyişidir. İki çocuk açıkta durur; onlarda gizli hiçbir şey yoktur.",
    "reversed": "Sıcaklığı olmayan ışık — tamamen görünür olan ama hiç hissedilmeyen başarı. Ters konum, sırf ilke gereği güvenilmeyen düpedüz iyi talihe de işaret edebilir: tadını çıkarma mevsimi geçene dek bir tuzak aranarak incelenen iyi talihe.",
    "inSpread": "Açılımın başında iş sade ve elverişli koşullarda başlar; bu destede bu, kulağa geldiğinden daha nadirdir. Karşıtlık konumunda, soruyu soranı dikkatsizleştiren bir rahatlık. Denge konumunda Güneş dolaysızca iyidir — durum işler ve içindeki herkes bunu görür. Sonuç olarak: maddi iyi talih; Papus'un abartmamaya özen gösterdiği, sıradan, gün ışığı türünden.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "19"
      },
      {
        "label": "İbrani harfi",
        "value": "Kof (ק)"
      },
      {
        "label": "Hiyeroglif",
        "value": "Bir balta — yapılan ve kullanılan bir alet"
      },
      {
        "label": "Yedili",
        "value": "Üçüncü yedili (15–21), Doğa dünyası — beşinci terim, Kule'yi yansıtır: ayakta duran maddi yapı"
      },
      {
        "label": "Kehanet anlamı",
        "value": "Dünyevi mutluluk"
      }
    ]
  },
  "arcana-20": {
    "upright": "Yıldız'ın yansıması: on yedi dışarı dökerken, yirmi geri çağırır. Reş bir insan başıdır — tanıyan ve yanıt verenin yeri. Papus'un yirminci arkanı yenilenmedir, özellikle de çağrıyla gelen yenilenme: bitmiş sayılan bir şeyden hesap vermesi istenir. Figürler çağrıldıkları için kalkarlar. Saati onlar seçmedi ve kart gücünü tam da bundan alır.",
    "reversed": "Görmezden gelinen ya da yanlış bir nedenle yanıtlanan çağrı — hesap vermeden yalnızca boy göstermek. Ters konum, aslında yalnızca bir tekrar olan bir yenilenmeye de işaret edebilir: aynı hayatın yeni bir adla sürdürülmesi; ilk sınavına dek değişim diye geçer.",
    "inSpread": "Açılımın başında iş, eski bir şey yeniden açıldığı için başlar. Karşıtlık konumunda, başkasının takvimine göre gelen bir hesaplaşma. Denge konumunda durum, henüz verilmemiş bir yanıtı beklerken askıda tutulmaktadır. Sonuç olarak: yenilenme; Papus'un kastettiği türü seçilmez — zorunludur ve tek soru, onun nasıl karşılanacağıdır.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "20"
      },
      {
        "label": "İbrani harfi",
        "value": "Reş (ר)"
      },
      {
        "label": "Hiyeroglif",
        "value": "Bir insan başı — tanıyan şey"
      },
      {
        "label": "Yedili",
        "value": "Üçüncü yedili (15–21), Doğa dünyası — altıncı terim, Yıldız'ı yansıtır: dışarı dökülen geri çağrılır"
      },
      {
        "label": "Kehanet anlamı",
        "value": "Yenilenme; değişim"
      }
    ]
  },
  "arcana-21": {
    "upright": "Yirmi ikinci ve son arkan, Tav — alfabeyi bitiren ve Papus'un okumasında çemberi Alef'e geri kapatan harf. Figür bir çelenk içinde durur, köşelerde dört canlı varlık: dört dünya, dört takım; dördü birden aynı anda mevcut ve uzlaşmış. Tamamlanış; ve ödül, ona herhangi bir şey eklenmesinde değil, şeyin bitmiş olmasında yatar. Kehanet anlamı: ödül, tamamlanış.",
    "reversed": "Erken ilan edilen tamamlanış — çelenk, hâlâ açıkça yarım olan bir şeyin çevresine, bir kenara bırakılabilsin diye çizilir. Ya da gerçekten tamamlanmış bir şeyi soruyu soranın kapatmaması; Papus'un şemasında bu, bütün diziyi açık tutar ve bir sonraki Alef'in başlamasını engeller.",
    "inSpread": "Açılımın başında iş, gerçekten bitmiş bir şeyden başlar; bu, olabilecek en sağlam zemindir. Karşıtlık konumunda, başka bir yerde gerçekleşen ve soruyu soranın payına yer bırakmayan bir tamamlanış. Denge konumunda her şey yerli yerindedir ve okuma onu bozmamakla ilgilidir. Sonuç olarak: iş kapanır ve Papus'un sisteminde bir kapanış aynı zamanda bir dönüştür — bir sonraki sorunun bu sorunun bittiği yerde başlamasını bekleyin.",
    "correspondences": [
      {
        "label": "Papus'a göre sayı",
        "value": "22"
      },
      {
        "label": "İbrani harfi",
        "value": "Tav (ת)"
      },
      {
        "label": "Hiyeroglif",
        "value": "Göğüs, göğüs kafesi; bir işaret, bir im"
      },
      {
        "label": "Yedili",
        "value": "Üç yedilinin dışında — bütün diziyi kapatan ve onu Alef'e döndüren yirmi ikinci terim"
      },
      {
        "label": "Kehanet anlamı",
        "value": "Ödül; tamamlanış"
      }
    ]
  },
  "wands-1": {
    "upright": "Etkin takımın etkin ilkesi — Papus'un en saf kökeni, Yod içinde Yod. Ondan önce hiçbir şey gelmez ve onu hiçbir şey koşullamaz: henüz bir nesnesi, planı ya da bedeli olmayan dürtünün kendisi. Atzilut'ta, arketipler dünyasında, bu arketipsel başlangıçtır; kartın her zaman koşullarından büyük hissettirmesinin nedeni de budur. Kendine ait bir içeriği yoktur. Takımın sonrasında yaptığı her şey, bu gücün bir içerik edinmesidir.",
    "reversed": "Dağılan dürtü — gelen, bir kanal bulamayan ve hiçbir şeye harcanıp giden güç. Ya da başlangıcın koşullar uygun olana dek ertelenmesi; bir Yod için bu, süresiz ertelenmek demektir.",
    "inSpread": "Açılımın başında iş saf bir dürtüyle başlar ve Papus açılımın geri kalanını o dürtünün neyle karşılaştığı olarak okurdu. Karşıtlık konumunda, başka birinin girişimi. Denge konumunda durum, henüz yönlendirilmemiş bir güç tarafından ayakta tutulur. Sonuç olarak: bir başlangıç, bir sonuç değil.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Asalar: Yod (י), etkin, başlatıcı ilke; bu takım Atzilut'ta, arketipler dünyasında etki eder; 1 sayısı: birinci serinin Yod'u, takımın saf etkin kaynağı. Aşağıdaki anlam bu birleşimin okunuşudur (etkin ilke, 1. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Asalar — Yod (י), Atzilut, arketipler dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "etkin, başlatıcı ilke"
      },
      {
        "label": "Sayı",
        "value": "1 — birinci serinin Yod'u"
      },
      {
        "label": "Sayının rolü",
        "value": "takımın saf etkin kaynağı"
      }
    ]
  },
  "wands-2": {
    "upright": "Dürtünün edilgen yansıması: kendine döndürülüp bakılan güç. Figür elinde bir küre tutar ve biri sabit, biri elde tutulan iki asanın arasında durur. Papus'un ikinci terimi eylemez, gözden geçirir. Bu plandır — dürtünün nereye gidebileceğine bakılarak incelenmesi — ve kart, dünyanın yoldan değil bir surun üstünden değerlendirildiği konusunda kesindir.",
    "reversed": "Yola çıkılmayan gözden geçirme — planlamanın, planlanan şeyin yerine geçmesi. Ya da dürtünün, ona bir kez bile bakılmadan eyleme dökülmesi; bu, kartın kendi işlevini reddetmesidir.",
    "inSpread": "Açılımın başında iş, kapsamla ilgili bir kararla başlar. Karşıtlık konumunda, girişkenliği yitirten bir enine boyuna düşünme. Denge konumunda durum, hiçbir şeye bağlanılmadığı için istikrarlıdır. Sonuç olarak: bir plan — Papus'un ikinci terimi hiçbir zaman bundan fazlasını vermez.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Asalar: Yod (י), etkin, başlatıcı ilke; bu takım Atzilut'ta, arketipler dünyasında etki eder; 2 sayısı: birinci serinin He'si, bu kaynağın edilgen yansıması. Aşağıdaki anlam bu birleşimin okunuşudur (etkin ilke, 2. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Asalar — Yod (י), Atzilut, arketipler dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "etkin, başlatıcı ilke"
      },
      {
        "label": "Sayı",
        "value": "2 — birinci serinin He'si"
      },
      {
        "label": "Sayının rolü",
        "value": "bu kaynağın edilgen yansıması"
      }
    ]
  },
  "wands-3": {
    "upright": "Etkin takımın bağlayıcı terimi: dürtü ve plan, artık yürümekte olan bir girişimde birleşmiştir. Gemiler denizdedir; figür kıyıdan izler. Papus'un üçüncü terimi ilk ikisinin içermediği bir şey üretir ve burada bu, bağlanmadır — girişim başlatılmış, yeniden düşünmenin bedelsiz olduğu noktayı geçmiştir. Etkin dünyada denge, aynı anda hareket hâlinde birkaç şey olması ve hiçbirinin denetlenememesi demektir.",
    "reversed": "İkinci terim olmadan başlatılan girişim — dürtü ve bağlanma var, gözden geçirme yok; takım bunun hesabını beşte sorar. Ya da gemilerin öylesine uzun süre izlenmesi ki izlemek girişimin kendisi olmuştur.",
    "inSpread": "Açılımın başında iş, çoktan yola çıkarılmış bir şeyle başlar. Karşıtlık konumunda, geri alınamayacak bir bağlanma. Denge konumunda birkaç girişim aynı anda yoldadır ve birbirini dengeler. Sonuç olarak: girişim yürümektedir; getirileri ise bu kartın işi değildir.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Asalar: Yod (י), etkin, başlatıcı ilke; bu takım Atzilut'ta, arketipler dünyasında etki eder; 3 sayısı: birinci serinin Vav'ı, ikisini birbirine bağlayan denge. Aşağıdaki anlam bu birleşimin okunuşudur (etkin ilke, 3. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Asalar — Yod (י), Atzilut, arketipler dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "etkin, başlatıcı ilke"
      },
      {
        "label": "Sayı",
        "value": "3 — birinci serinin Vav'ı"
      },
      {
        "label": "Sayının rolü",
        "value": "ikisini birbirine bağlayan denge"
      }
    ]
  },
  "wands-4": {
    "upright": "Mihver. Gerçekleşen etkin ilke yerleşik bir şeye dönüşür — ayakta duran dört asa, aralarında çelenk, sınırları çizilmiş toprak. Papus'un dördüncü terimi sabitler ve burada sabitlenen bir çerçevedir: bir hane, bir ortaklık, kurulmuş bir kurum. Takımın tek durağan kartıdır ve bir mihver olduğu için, ikinci dizinin uğrunda çekiştiği her şey burada inşa edilenden başlar.",
    "reversed": "Hiçbir şeyin üzerine kurulmamış çerçeve — özü olmayan kutlama, erkenden sahiplenilen dördüncü terim. Ya da kendi başına öylesine tatmin edici bir temel ki kimse onu kullanmaya geçmez.",
    "inSpread": "Açılımın başında iş, yakın zamanda kurulmuş bir şeyin içinde başlar. Karşıtlık konumunda, istikrarı yolu tıkayan bir düzen. Denge konumunda bu, takımın sunduğu en sağlam zemindir. Sonuç olarak: bir şey kurulur — ve Papus'un mihveri doğrudan beşteki çekişmeye devreder.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Asalar: Yod (י), etkin, başlatıcı ilke; bu takım Atzilut'ta, arketipler dünyasında etki eder; 4 sayısı: birinci serinin son He'si ve ikinci serinin Yod'u, gerçekleşme — ve bir sonraki hareketi başlatan dönüm noktası. Aşağıdaki anlam bu birleşimin okunuşudur (etkin ilke, 4. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Asalar — Yod (י), Atzilut, arketipler dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "etkin, başlatıcı ilke"
      },
      {
        "label": "Sayı",
        "value": "4 — birinci serinin son He'si ve ikinci serinin Yod'u"
      },
      {
        "label": "Sayının rolü",
        "value": "gerçekleşme — ve bir sonraki hareketi başlatan dönüm noktası"
      }
    ]
  },
  "wands-5": {
    "upright": "Dördün kurduğu şeye edilgen tepki: rekabet. Bir şey kurulduğu anda, onu sınamak için başka iradeler gelir. Beş figür, beş asa, görünürde bir bahis yok — ve Papus'un beşinci terimi bir saldırı değil bir tepkidir, dolayısıyla bu savaş değil sürtüşmedir. Rekabet, itiş kakış, herkesin aynı anda konuştuğu toplantı. Bu, çerçevenin doğal sonucudur; onun başına gelen bir talihsizlik değil.",
    "reversed": "Kaçınılan mücadele — savunulmak yerine teslim edilen zemin. Ya da katılaşıp düşmanlığa dönüşmüş rekabet; bu, çekilen karttan farklı ve daha kötü bir karttır.",
    "inSpread": "Açılımın başında iş kalabalık bir alanda başlar. Karşıtlık konumunda birden çok rakip vardır — Papus'un beşinci terimi nadiren tek bir hasımdır. Denge konumunda durum, herkes aynı anda ittiği için yerinde durur. Sonuç olarak: çözülmemiş bir mücadele; onu çözecek olan altıdır.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Asalar: Yod (י), etkin, başlatıcı ilke; bu takım Atzilut'ta, arketipler dünyasında etki eder; 5 sayısı: ikinci serinin He'si, gerçekleşene verilen edilgen tepki. Aşağıdaki anlam bu birleşimin okunuşudur (etkin ilke, 5. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Asalar — Yod (י), Atzilut, arketipler dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "etkin, başlatıcı ilke"
      },
      {
        "label": "Sayı",
        "value": "5 — ikinci serinin He'si"
      },
      {
        "label": "Sayının rolü",
        "value": "gerçekleşene verilen edilgen tepki"
      }
    ]
  },
  "wands-6": {
    "upright": "İtiş kakıştan sonra yeniden kurulan denge: diğerlerinin üzerine yükseltilmiş tek bir figür, asasında bir çelenk. Papus'un altıncı terimi beşinciyi onarır ve etkin dünyada bu onarımı öncelik sırasını belirleyerek yapar — mücadele karara bağlanmıştır, hem de herkesin önünde, çünkü Atzilut'ta kimsenin kabul etmediği bir zafer hiçbir şeyi onarmış olmaz. Burada tanınma ödül değil, mekanizmanın kendisidir.",
    "reversed": "Esirgenen ya da yanlış tarafa verilen tanınma — her iki durumda da beşinci terim yerine oturmamıştır ve yeniden başlayacaktır. Ya da alkışın amaç sanılması; böylece girişim, alkışlandığı anda durur.",
    "inSpread": "Açılımın başında iş, kabul görmüş bir zaferden başlar. Karşıtlık konumunda başka birinin itibarı vardır. Denge konumunda durum, öncelik sırası açık olduğu için ayakta kalır. Sonuç olarak: tanınma — herkesin önünde ve yük taşıyan.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Asalar: Yod (י), etkin, başlatıcı ilke; bu takım Atzilut'ta, arketipler dünyasında etki eder; 6 sayısı: ikinci serinin Vav'ı, yeni bir zeminde yeniden kurulan denge. Aşağıdaki anlam bu birleşimin okunuşudur (etkin ilke, 6. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Asalar — Yod (י), Atzilut, arketipler dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "etkin, başlatıcı ilke"
      },
      {
        "label": "Sayı",
        "value": "6 — ikinci serinin Vav'ı"
      },
      {
        "label": "Sayının rolü",
        "value": "yeni bir zeminde yeniden kurulan denge"
      }
    ]
  },
  "wands-7": {
    "upright": "İkinci dönüm noktası: konum gerçekleşmiştir, ama korunması gereken bir şey olarak gerçekleşmiştir. Figür yukarıda durur, altı asa aşağıdan yükselir; yüksek zemin gerçektir, baskı da öyle. Papus'un yedinci terimi tek bir hareketle hem gerçekleştirir hem sarsar — burada gerçekleşen bir savunmadır; bu da son dizinin savunmanın neye mal olduğuyla ilgili olacağı anlamına gelir.",
    "reversed": "Terk edilen zemin ya da uğruna çaba harcamaya değmez hâle geldikten çok sonra hâlâ tutulan zemin. Ya da artık orada olmayan bir karşıtlığa karşı kurulan savunma; bu takımın sekizinci ve dokuzuncu terimleri malzemelerini işte buradan alır.",
    "inSpread": "Açılımın başında iş, zaten baskı altında olan bir konumla başlar. Karşıtlık konumunda birçok yönden gelen sürekli bir direniş vardır. Denge konumunda durum ancak biri onu etkin biçimde savunduğu için ayakta kalır. Sonuç olarak: konum korunur — ve Papus'un yedisi her zaman devreder.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Asalar: Yod (י), etkin, başlatıcı ilke; bu takım Atzilut'ta, arketipler dünyasında etki eder; 7 sayısı: ikinci serinin son He'si ve üçüncü serinin Yod'u, son hareketi kendisi başlatan ikinci bir gerçekleşme. Aşağıdaki anlam bu birleşimin okunuşudur (etkin ilke, 7. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Asalar — Yod (י), Atzilut, arketipler dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "etkin, başlatıcı ilke"
      },
      {
        "label": "Sayı",
        "value": "7 — ikinci serinin son He'si ve üçüncü serinin Yod'u"
      },
      {
        "label": "Sayının rolü",
        "value": "son hareketi kendisi başlatan ikinci bir gerçekleşme"
      }
    ]
  },
  "wands-8": {
    "upright": "Yedinin savunmasına edilgen yanıt: havada uçan sekiz asa ve hiç figür yok. Papus'un sekizinci terimi asla başlatmaz ve bunun destedeki en açık örneği budur — kart, okumadaki kimsenin başlatmadığı ve artık kimsenin yönünü değiştiremeyeceği bir hareketi gösterir. Hız, haber, daha önce harekete geçirilmiş sonuçların ani gelişi. Takımın en az kişisel olduğu hâli.",
    "reversed": "Durdurulan uçuş — havadaki her şeyin aynı anda yere inmesi ya da hiçbir şeyin inmemesi. Ya da enine boyuna düşünülmesi gereken bir şeye uygulanan hız; etkin dünya fırsat bulduğu her an bunu yapar.",
    "inSpread": "Açılımın başında iş bir haberle ya da ani bir hızlanmayla başlar. Karşıtlık konumunda olaylar, soruyu soranın yanıt verebileceğinden daha hızlı ilerler. Denge konumunda hiçbir şey dengede değildir — bu kart bir geçiştir ve konum hızı bildirir. Sonuç olarak: şeyler hızla gelir, büyük ölçüde de kendi koşullarıyla.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Asalar: Yod (י), etkin, başlatıcı ilke; bu takım Atzilut'ta, arketipler dünyasında etki eder; 8 sayısı: üçüncü serinin He'si, bu gerçekleşmeye verilen edilgen yanıt. Aşağıdaki anlam bu birleşimin okunuşudur (etkin ilke, 8. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Asalar — Yod (י), Atzilut, arketipler dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "etkin, başlatıcı ilke"
      },
      {
        "label": "Sayı",
        "value": "8 — üçüncü serinin He'si"
      },
      {
        "label": "Sayının rolü",
        "value": "bu gerçekleşmeye verilen edilgen yanıt"
      }
    ]
  },
  "wands-9": {
    "upright": "Takımın son dengesi: sürdürülen nöbet. Arkada sekiz asa, elde bir asa; figür sargılı ve ayakta. Papus'un dokuzuncu terimi bir diziyi tamamlanmadan önce yerine oturtur ve etkin dünyada son yerleşim, öncesinde olan her şeyle satın alınmış bir tetikteliktir. Bu korku değildir. Zaten darbe almış ve bu yüzden bir daha almayacağını varsaymayı bırakmış birinin isabetli hazırlığıdır.",
    "reversed": "Nedeninden uzun yaşamış tetiklik — hiçbir şeye karşı tutulan bir nöbet; yorucudur ve dışarıdan görünmez. Ya da son asanın tam bir an erken yere bırakılması.",
    "inSpread": "Açılımın başında iş, soruyu soranın hak ettiği bir savunma duruşuyla başlar. Karşıtlık konumunda birinin temkini vardır ve hiçbir güvence onu dağıtmayacaktır. Denge konumunda şey, tek bir kişi hâlâ başında dikildiği için ayakta kalır. Sonuç olarak: konum hayatta kalır, bedeli görünür olsa da.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Asalar: Yod (י), etkin, başlatıcı ilke; bu takım Atzilut'ta, arketipler dünyasında etki eder; 9 sayısı: üçüncü serinin Vav'ı, tamamlanmadan önceki son denge. Aşağıdaki anlam bu birleşimin okunuşudur (etkin ilke, 9. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Asalar — Yod (י), Atzilut, arketipler dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "etkin, başlatıcı ilke"
      },
      {
        "label": "Sayı",
        "value": "9 — üçüncü serinin Vav'ı"
      },
      {
        "label": "Sayının rolü",
        "value": "tamamlanmadan önceki son denge"
      }
    ]
  },
  "wands-10": {
    "upright": "Takım tükenmiştir. Aynı anda taşınan on asa, görünürde kasaba, yükün üzerinden göremeyen taşıyıcı. Papus'un onuncu terimi tamamlar ve tohumlar — etkin ilkenin tamamlarken elinde kalan da başlattığı her şeyin bütün ağırlığıdır. Kart başarısızlıkla ilgili değildir; girişim işe yaramıştır ve işleyen bir girişim işte bu kadar ağırdır. Atzilut'ta başarının aldığı biçim yüktür.",
    "reversed": "Yere bırakılan yük — ters konumda bu ya rahatlamadır ya da vazgeçiş; hangisi olduğunu yalnızca çevredeki kartlar söyler. Ya da kapıda alınan daha fazla asa, çünkü herhangi birini devretmek, girişimin tek bir kişiden büyük olduğunu kabul etmek anlamına gelirdi.",
    "inSpread": "Açılımın başında iş daha baştan aşırı yüklüdür. Karşıtlık konumunda yeni olan her şeyi engelleyen önceki taahhütlerin ağırlığı vardır. Denge konumunda her şeyi tek bir taraf taşır. Sonuç olarak: taşınarak gelen tamamlanma — ve Papus'un onlu dizisinde, bir sonraki takıma devir.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Asalar: Yod (י), etkin, başlatıcı ilke; bu takım Atzilut'ta, arketipler dünyasında etki eder; 10 sayısı: üçüncü serinin son He'si, tam gerçekleşme — takım tükenmiştir ve ardından gelen takımın tohumudur. Aşağıdaki anlam bu birleşimin okunuşudur (etkin ilke, 10. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Asalar — Yod (י), Atzilut, arketipler dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "etkin, başlatıcı ilke"
      },
      {
        "label": "Sayı",
        "value": "10 — üçüncü serinin son He'si"
      },
      {
        "label": "Sayının rolü",
        "value": "tam gerçekleşme — takım tükenmiştir ve ardından gelen takımın tohumudur"
      }
    ]
  },
  "wands-page": {
    "upright": "Gerçekleştirici terim bir kişi olarak: olguya indirilmiş irade. Asa Prensi ayak işidir — biri taşımak zorunda olduğu için taşınan haber, henüz incelenmemiş bir fikir üzerine atılan ilk adım. Papus'un dördüncü terimi şeyleri gerçek kılar ve etkin takımda onları hemen ve hiçbir hazırlık yapmadan gerçek kılar. İş gören coşku; bu, iki yarısından herhangi birinden tek başına daha yararlıdır.",
    "reversed": "Yapılmayan ayak işi; böylece dürtü dünyaya hiç dokunmaz. Ya da duyurunun eylem sanılması — girişimle ilgili haber büyük bir enerjiyle iletilir ve başka hiçbir şey yapılmaz.",
    "inSpread": "Açılımın başında iş, işin içinde daha kıdemsiz birinin attığı ilk adımla başlar. Karşıtlık konumunda kanıtlanmamış bir heves vardır; ona karşı çıkmak, bir gerekçeye karşı çıkmaktan daha zordur. Denge konumunda şeyi hareket hâlinde tutan Prens'tir. Sonuç olarak: gerçekten bir başlangıç yapılır.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Asalar: Yod (י), etkin, başlatıcı ilke; bu takım Atzilut'ta, arketipler dünyasında etki eder; Prens: son He, gerçekleştirici terimin cisimleşmiş hâli — takımın olguya indirilmesi. Aşağıdaki anlam bu birleşimin okunuşudur; Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Asalar — Yod (י), Atzilut, arketipler dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "etkin, başlatıcı ilke"
      },
      {
        "label": "Rütbe",
        "value": "Prens — son He"
      },
      {
        "label": "Rütbenin rolü",
        "value": "gerçekleştirici terimin cisimleşmiş hâli — takımın olguya indirilmesi"
      }
    ]
  },
  "wands-knight": {
    "upright": "Dengeleyici terim bir kişi olarak, saf iradenin takımında: hareketin kendisi. Asa Şövalyesi ayrılıştır — hemen üstlenilen girişim, çekip gidiş, mesafeyi hızla aşarak bir yeri diğerine bağlayan güç. Papus'un Vav'ı bağlar ve bu Şövalye varıp gelerek bağlar. Yanında taşımadığı şey ise varıştan sonra ne olacağına dair herhangi bir hesaptır.",
    "reversed": "Alışkanlık hâline gelmiş ayrılış — her girişime başlanır, hiçbirinde yaşanmaz. Ya da kapıda tutulan at; bütün güç oradadır ama hiçbiri boşalmaz ve etkin takımda bu içe döner.",
    "inSpread": "Açılımın başında iş, birinin ayrılması ya da bir şeyi başlatmasıyla başlar. Karşıtlık konumunda tartışmanın yavaşlatamadığı, hareket hâlinde bir güç vardır. Denge konumunda hiçbir şey dengede kalmaz — Şövalye bir geçiştir. Sonuç olarak: şey kararlılıkla hareket eder ve okumada nereye vardığına bakılmalıdır.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Asalar: Yod (י), etkin, başlatıcı ilke; bu takım Atzilut'ta, arketipler dünyasında etki eder; Şövalye: Vav, dengeleyici terimin cisimleşmiş hâli — taşır, aktarır, arada gidip gelir. Aşağıdaki anlam bu birleşimin okunuşudur; Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Asalar — Yod (י), Atzilut, arketipler dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "etkin, başlatıcı ilke"
      },
      {
        "label": "Rütbe",
        "value": "Şövalye — Vav"
      },
      {
        "label": "Rütbenin rolü",
        "value": "dengeleyici terimin cisimleşmiş hâli — taşır, aktarır, arada gidip gelir"
      }
    ]
  },
  "wands-queen": {
    "upright": "Etkin takımın içindeki alıcı ilke: bir girişimi başlatan değil, sürdüren kişi. Papus'un He'si başlatmaz ve Asa Kraliçesi bu konuda kesindir — otoritesi, bir girişimin sıcaklığını kimsenin coşku duymadığı bölümler boyunca sabit tutmasında yatar. Bir elinde asa, ötekinde ayçiçeği. Başkalarının girişimini alır ve onlara kullanılabilir hâlde geri verir.",
    "reversed": "Seçici biçimde geri çekilen sıcaklık; etkin dünyada bu gerçek bir güç aracıdır. Ya da başka herkesin girişimlerini öylesine eksiksiz sürdürmek ki kendisininkine hiç başlanmaz.",
    "inSpread": "Açılımın başında iş, biri sönmeye yüz tutmuş bir şeyi hayatta tuttuğu için başlar. Karşıtlık konumunda özgüveni bütün odayı taşıyan bir kişi vardır. Denge konumunda girişimde hâlâ enerji olmasının nedeni odur. Sonuç olarak: şey kalıcı olur, çünkü biri onu sürdürmüştür.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Asalar: Yod (י), etkin, başlatıcı ilke; bu takım Atzilut'ta, arketipler dünyasında etki eder; Kraliçe: He, takımın edilgen ilkesinin cisimleşmiş hâli — alır ve yansıtır. Aşağıdaki anlam bu birleşimin okunuşudur; Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Asalar — Yod (י), Atzilut, arketipler dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "etkin, başlatıcı ilke"
      },
      {
        "label": "Rütbe",
        "value": "Kraliçe — He"
      },
      {
        "label": "Rütbenin rolü",
        "value": "takımın edilgen ilkesinin cisimleşmiş hâli — alır ve yansıtır"
      }
    ]
  },
  "wands-king": {
    "upright": "Etkin takımın etkin terimi, cisimleşmiş hâli — Yod içinde Yod, bir kişiye dönüşmüş. Asa Kralı başlatır: kurar, bağlanır ve bunu gerekçe tamamlanmadan önce yapar; kurmak da tam olarak bunu gerektirir. Papus'un Yod'u danışmaz. Otoritesi, başlattığı şeylerin ardından gerçekten var olmuş olmasından gelir ve deste otoriteye bundan daha güçlü bir dayanak sunmaz.",
    "reversed": "Ardında hiçbir şey olmayan girişkenlik — ilkini bitirmek yerine dördüncü bir girişime başlayan kurucu. Ya da yalnızca inancın gücüyle verilen buyruk; bu, tam da yanıldığı ana kadar işe yarar.",
    "inSpread": "Açılımın başında iş, bir kişi onu başlatmaya karar verdiği için başlar. Karşıtlık konumunda saptırılamayan ve beklenerek yıpratılamayan bir irade vardır. Denge konumunda geri kalan her şeyin beslendiği kaynak odur. Sonuç olarak: iş, birinin en başta seçtiği yönde çözülür.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Asalar: Yod (י), etkin, başlatıcı ilke; bu takım Atzilut'ta, arketipler dünyasında etki eder; Kral: Yod, takımın etkin ilkesinin cisimleşmiş hâli — başlatır. Aşağıdaki anlam bu birleşimin okunuşudur; Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Asalar — Yod (י), Atzilut, arketipler dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "etkin, başlatıcı ilke"
      },
      {
        "label": "Rütbe",
        "value": "Kral — Yod"
      },
      {
        "label": "Rütbenin rolü",
        "value": "takımın etkin ilkesinin cisimleşmiş hâli — başlatır"
      }
    ]
  },
  "chalices-1": {
    "upright": "Edilgen bir takımın etkin kökeni; bu, Papus'un en ilginç birleşimidir: bir şey başlar ve başlayan şey bir alma yetisidir. As, içine henüz hiçbir şey dökülmemiş kupadır — mümkün hâle geldiği anda, henüz bir nesneye ya da kişiye bağlanmamış duygu. Ardında gerçek bir güç olan açıklık. Beria'da bu, takımın sonrasında yapacağı her şeyi biçimlendirecek bir duygudaşlığın ilk kıpırtısıdır.",
    "reversed": "Herhangi bir şey giremeden kapanan açıklık — reddedilen alıcılık, çoğunlukla da en son alınan şey kötü sonuçlandığı için. Ya da aynı hareket içinde başlayıp tükenen duygu; kupa aynı anda dolup boşalır, böylece hiçbir şey birikmez.",
    "inSpread": "Açılımın başında iş bir edimle değil, bir açıklıkla başlar. Karşıtlık konumunda soruyu soranın kendi niyetlerine karşı işleyen bir etkilenebilirlik vardır. Denge konumunda durum tamamen birinin almaya istekli olmasına dayanır. Sonuç olarak: bir şey değil, bir yeti kazanılır — Papus ikisinden daha kalıcı olanın bu olduğunu söylerdi.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kupalar: He (ה), edilgen, alıcı ilke; bu takım Beria'da, yaratılış dünyasında etki eder; 1 sayısı: birinci serinin Yod'u, takımın saf etkin kaynağı. Aşağıdaki anlam bu birleşimin okunuşudur (edilgen ilke, 1. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kupalar — He (ה), Beria, yaratılış dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "edilgen, alıcı ilke"
      },
      {
        "label": "Sayı",
        "value": "1 — birinci serinin Yod'u"
      },
      {
        "label": "Sayının rolü",
        "value": "takımın saf etkin kaynağı"
      }
    ]
  },
  "chalices-2": {
    "upright": "İkiye katlanmış edilgen ilke: alıcılığın alıcılıkla buluşması. Papus'un ikinci terimi birinciyi yansıtır ve alıcı dünyada bu yansıma karşılıklılıktır — aynı anda birbirine açılan iki yeti. Bu, birlikteliğin yapısal kartıdır ve koşullar konusunda kesindir: taraflardan hiçbiri başlatmaz, ikisi de alır. Onu sağlam kılan budur; aynı zamanda kırılgan kılan da budur, çünkü içindeki hiçbir şey yeni bir şey üretmez.",
    "reversed": "Yalnızca tek yönde ilerleyen yansıma — uzatılan ve hiç karşılık bulmayan tek bir kupa. Ya da özü gittikten sonra bir biçim olarak sürdürülen karşılıklılık; iki insan birbirinin alışkanlıklarını sadakatle almaya devam eder.",
    "inSpread": "Açılımın başında iş iki taraf arasındaki bir uzlaşmayla başlar. Karşıtlık konumunda soruyu soranın tek başına hareket etmesine izin vermeyen bir bağ vardır. Denge konumunda geri kalan her şeyi ayakta tutan bu çifttir. Sonuç olarak: birliktelik — hiçbir tarafın belirlemediği koşullarda, çünkü ikinci bir terim asla koşul belirlemez.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kupalar: He (ה), edilgen, alıcı ilke; bu takım Beria'da, yaratılış dünyasında etki eder; 2 sayısı: birinci serinin He'si, bu kaynağın edilgen yansıması. Aşağıdaki anlam bu birleşimin okunuşudur (edilgen ilke, 2. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kupalar — He (ה), Beria, yaratılış dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "edilgen, alıcı ilke"
      },
      {
        "label": "Sayı",
        "value": "2 — birinci serinin He'si"
      },
      {
        "label": "Sayının rolü",
        "value": "bu kaynağın edilgen yansıması"
      }
    ]
  },
  "chalices-3": {
    "upright": "Alıcı dünyanın içindeki bağlayıcı terim: birden çok duyguyu dengede tutan şey beraberliktir. Üç, Papus'un onlu dizisinde, kendinden önceki ikiye indirgenemeyen bir şeyin var olduğu ilk sayıdır ve Kupalar'da ortaya çıkan bu şey paylaşılan duygudur — grup, kutlama, herhangi birinin içinde değil insanların arasında yaşayan duygudaşlık.",
    "reversed": "Beraberliğin kendisinin amaç hâline gelmesi — nedeni ortadan kalktıktan çok sonra süren bir bir araya geliş. Ya da bağlamak yerine dengeyi bozan üçüncü kişi; karşılıklı olan bir şeyi seyircili bir gösteriye çevirir.",
    "inSpread": "Açılımın başında iş iki değil, birkaç kişi arasında başlar. Karşıtlık konumunda duygudaşlığı soruyu sorandan yana olmayan bir grup vardır. Denge konumunda durum paylaşıldığı için ayakta kalır. Sonuç olarak: ortaklaşa tutulan bir şey — bu da onun tek başına sahiplenilemeyeceği anlamına gelir.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kupalar: He (ה), edilgen, alıcı ilke; bu takım Beria'da, yaratılış dünyasında etki eder; 3 sayısı: birinci serinin Vav'ı, ikisini birbirine bağlayan denge. Aşağıdaki anlam bu birleşimin okunuşudur (edilgen ilke, 3. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kupalar — He (ה), Beria, yaratılış dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "edilgen, alıcı ilke"
      },
      {
        "label": "Sayı",
        "value": "3 — birinci serinin Vav'ı"
      },
      {
        "label": "Sayının rolü",
        "value": "ikisini birbirine bağlayan denge"
      }
    ]
  },
  "chalices-4": {
    "upright": "Dönüm noktası. Duygu gerçekleşmiştir ve Papus'un mantığında gerçekleşmiş bir duygu bir hareket olmaktan çıkıp bir hâle dönüşür — doygunluk, yeterince sahip olmanın ve bu yüzden artık hiçbir şeye uzanmamanın durumu. Sunulan kupanın fark edilmemesinin nedeni budur: küskünlük değil, doygunluk. Bu gerçek bir gerçekleşmedir ve bir dönüm noktası olduğu için bir sonraki dizinin başladığı nokta da odur.",
    "reversed": "Kırılan doygunluk — sunulan kupa sonunda görülür ve ikinci dizi tam da böyle harekete geçer. Ya da tersi: bilerek beslenen bir hoşnutsuzluk, çünkü istemek, sahip olmaktan daha kolay içinde yaşanan bir hâldir.",
    "inSpread": "Açılımın başında iş, kimsenin sorgulamadığı, yerleşmiş bir duygusal hâlden başlar. Karşıtlık konumunda, soruyu soranın kendi yeterliliği sessizce bir şeyi geri çevirmektedir. Denge konumunda durum istikrarlı ve hareketsizdir. Sonuç olarak: varılmış bir hâl — ve Papus'un dördüncü terimi her zaman devreder, o yüzden ardından geleni okuyun.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kupalar: He (ה), edilgen, alıcı ilke; bu takım Beria'da, yaratılış dünyasında etki eder; 4 sayısı: birinci serinin son He'si ve ikinci serinin Yod'u, gerçekleşme — ve bir sonraki hareketi başlatan dönüm noktası. Aşağıdaki anlam bu birleşimin okunuşudur (edilgen ilke, 4. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kupalar — He (ה), Beria, yaratılış dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "edilgen, alıcı ilke"
      },
      {
        "label": "Sayı",
        "value": "4 — birinci serinin son He'si ve ikinci serinin Yod'u"
      },
      {
        "label": "Sayının rolü",
        "value": "gerçekleşme — ve bir sonraki hareketi başlatan dönüm noktası"
      }
    ]
  },
  "chalices-5": {
    "upright": "Dörtlünün doygunluğuna edilgen tepki; Papus'un sıralaması, kaybın sabitlenmenin içinde zaten saklı olduğunu söyler. Üç kupa devrilmiş, ikisi ayakta: kartın bütünü bu orandadır. Bu, bütüncül değil isabetli bir yastır — her şeyin gittiğini iddia etmez ve figürün geriye kalana bakmadığını da kesin bir dille gösterir. Sabitlenmesini kendisinin seçmediği bir hâle tepki veren duygu.",
    "reversed": "Ayaktaki iki kupa fark edilir — aynı kayıp, sonunda doğru orantısıyla. Ya da bilerek sürdürülen yas, çünkü arkasını dönmek, geriye kalanla ne yapılacağına karar vermek demek olurdu.",
    "inSpread": "Açılımın başında iş, soruyu soranın henüz saymayı bitirmediği bir kayıpla başlar. Karşıtlık konumunda, durumun doğru görülmesini engelleyen bir yas. Denge konumunda her şeyi yerinde tutan şey bir yokluktur. Sonuç olarak: kayıp — kısmi, belirli ve hâlâ ayakta duran bir şeyle birlikte.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kupalar: He (ה), edilgen, alıcı ilke; bu takım Beria'da, yaratılış dünyasında etki eder; 5 sayısı: ikinci serinin He'si, gerçekleşene verilen edilgen tepki. Aşağıdaki anlam bu birleşimin okunuşudur (edilgen ilke, 5. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kupalar — He (ה), Beria, yaratılış dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "edilgen, alıcı ilke"
      },
      {
        "label": "Sayı",
        "value": "5 — ikinci serinin He'si"
      },
      {
        "label": "Sayının rolü",
        "value": "gerçekleşene verilen edilgen tepki"
      }
    ]
  },
  "chalices-6": {
    "upright": "Beşliden sonra yeniden kurulan denge; alıcı dünyada dengeyi onaran şey geçmiştir — anı, bir zamanlar verilmiş bir şeyin geri dönüşü. Papus'un altıncı terimi beşincinin bozduğunu her zaman onarır ve burada onarım süreklilik yoluyla olur: olmuş olan hâlâ el altındadır. Ardında bir geçmiş olan yakınlık; sıfırdan kurulması gerekmez, bu yüzden yeniden başlatılması da ucuzdur.",
    "reversed": "Bir kaynak olarak değil bir sığınak olarak kullanılan geçmiş — aslında yola devam etmeyi reddetmek olan bir dönüş. Ya da bir ilişkinin anısının ilişkinin kendisine tercih edilmesi; aynı hatanın sessiz biçimi.",
    "inSpread": "Açılımın başında iş, yeniden ele alınan bir şeyle başlar. Karşıtlık konumunda, soruyu soranın altından çıkamadığı bir geçmiş. Denge konumunda bunu sabit tutan şey geçmiştir. Sonuç olarak: onarım — aynı zemin, yerine yenisi konmadan geri kazanılmış.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kupalar: He (ה), edilgen, alıcı ilke; bu takım Beria'da, yaratılış dünyasında etki eder; 6 sayısı: ikinci serinin Vav'ı, yeni bir zeminde yeniden kurulan denge. Aşağıdaki anlam bu birleşimin okunuşudur (edilgen ilke, 6. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kupalar — He (ה), Beria, yaratılış dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "edilgen, alıcı ilke"
      },
      {
        "label": "Sayı",
        "value": "6 — ikinci serinin Vav'ı"
      },
      {
        "label": "Sayının rolü",
        "value": "yeni bir zeminde yeniden kurulan denge"
      }
    ]
  },
  "chalices-7": {
    "upright": "İkinci dönüm noktası; alıcı dünyada gerçekleşme, olasılıkların bir anda görünür hâle gelmesi biçimini alır. Yedi kupa, yedi içerik, hiçbiri seçilmemiş. Papus'un yedinci terimi aynı hareketle hem gerçekleştirir hem sarsar: bu, aralarından seçim yapılabilecek kadar somutlaşmış hayal gücüdür; gerçek bir başarıdır ama seçmekle aynı şey değildir.",
    "reversed": "Seçim yapılmış, altı olasılık bir kalemde silinmiştir — ters kart bunu, tümüyle çevresindeki kartlara bağlı olarak ya rahatlama ya da kayıp olarak gösterir. Ya da gösteri süresiz sürdürülür, çünkü hiçbir şey seçilmedikçe hiçbir şey yanlış olamaz.",
    "inSpread": "Açılımın başında iş, canlı birkaç seçenekle başlar. Karşıtlık konumunda, felç işlevi gören bir seçenek bolluğu. Denge konumunda durum, hiçbir şeye bağlanılmadığı için ayakta kalır. Sonuç olarak: seçenekler — ve yedinci terim devreder, yani okuma burada bitmez.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kupalar: He (ה), edilgen, alıcı ilke; bu takım Beria'da, yaratılış dünyasında etki eder; 7 sayısı: ikinci serinin son He'si ve üçüncü serinin Yod'u, son hareketi kendisi başlatan ikinci bir gerçekleşme. Aşağıdaki anlam bu birleşimin okunuşudur (edilgen ilke, 7. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kupalar — He (ה), Beria, yaratılış dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "edilgen, alıcı ilke"
      },
      {
        "label": "Sayı",
        "value": "7 — ikinci serinin son He'si ve üçüncü serinin Yod'u"
      },
      {
        "label": "Sayının rolü",
        "value": "son hareketi kendisi başlatan ikinci bir gerçekleşme"
      }
    ]
  },
  "chalices-8": {
    "upright": "Yedilinin bolluğuna edilgen yanıt: ayrılış. Sunulan her şeyi gördükten sonra alıcı ilke ondan çekilir. Papus'un sekizinci terimi asla başlatmaz — bu bir karardan çok, gelip boyun eğilen bir fark ediştir. Geride bırakılan şey açıkça değersiz değildir; kupalar üst üste dizilmiş ve sağlamdır. Kartı zorlaştıran da, dürüst kılan da budur.",
    "reversed": "Reddedilen ayrılış — bittiği bilinen bir şeyde kalmak; bu takım, mesele halledilene kadar onu gündeme getirmeyi sürdürecektir. Ya da alışkanlığa dönüşmüş ayrılış; öyle ki hiçbir şeye, uğruna kalmaya değer hâle gelecek kadar uzun süre tanınmaz.",
    "inSpread": "Açılımın başında iş, birinin çekip gitmesiyle başlar. Karşıtlık konumunda, soruyu soranın beklemediği ve itiraz edemeyeceği bir geri çekiliş. Denge konumunda durum yalnızca biri zihnen çoktan gitmiş olduğu için istikrarlıdır. Sonuç olarak: yeterince iyi işleyen bir şeyden ayrılış.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kupalar: He (ה), edilgen, alıcı ilke; bu takım Beria'da, yaratılış dünyasında etki eder; 8 sayısı: üçüncü serinin He'si, bu gerçekleşmeye verilen edilgen yanıt. Aşağıdaki anlam bu birleşimin okunuşudur (edilgen ilke, 8. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kupalar — He (ה), Beria, yaratılış dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "edilgen, alıcı ilke"
      },
      {
        "label": "Sayı",
        "value": "8 — üçüncü serinin He'si"
      },
      {
        "label": "Sayının rolü",
        "value": "bu gerçekleşmeye verilen edilgen yanıt"
      }
    ]
  },
  "chalices-9": {
    "upright": "Takımın son dengesi: kendi içinde dinlenen duygu. Sıralanmış, dolu dokuz kupa, tek bir figür, ikinci bir taraf yok. Papus'un dokuzuncu terimi, bir dizinin tamamlanmadan önce durulduğu yerdir ve Beria'da bu duruluş hoşnutluktur — gerçek, yeterli ve dikkat çekecek kadar mahrem. Takımın üretebileceği her şey buradadır; hiçbiri paylaşılmıyor ve hiçbirinin paylaşılması da gerekmiyor.",
    "reversed": "Rehavete dönmüş yeterlilik — gösteri sürdürülür, içerik sorgulanmaz. Ya da sessizce yalnızlığa dönüşmüş hoşnutluk; sıralanmış kupalar bir azık olarak değil bir duvar olarak işler.",
    "inSpread": "Açılımın başında iş, duygusal yeterlilik konumundan başlar. Karşıtlık konumunda, birinin hoşnutluğu, aksi hâlde kolay olacak bir değişikliği engellemektedir. Denge konumunda bu, takımın en istikrarlı kartıdır. Sonuç olarak: tek başına sahip olunan bir tatmin.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kupalar: He (ה), edilgen, alıcı ilke; bu takım Beria'da, yaratılış dünyasında etki eder; 9 sayısı: üçüncü serinin Vav'ı, tamamlanmadan önceki son denge. Aşağıdaki anlam bu birleşimin okunuşudur (edilgen ilke, 9. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kupalar — He (ה), Beria, yaratılış dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "edilgen, alıcı ilke"
      },
      {
        "label": "Sayı",
        "value": "9 — üçüncü serinin Vav'ı"
      },
      {
        "label": "Sayının rolü",
        "value": "tamamlanmadan önceki son denge"
      }
    ]
  },
  "chalices-10": {
    "upright": "Tükenmiş takım. Alıcı ilkenin tutabileceği her şey tutulmuştur — ve Papus'un onuncu terimi her zaman aynı zamanda bir tohumdur, dolayısıyla bu, duran türden değil devreden türden bir tamamlanmadır. Tümüyle gerçekleşmiş duygu bir haneye dönüşür: bir yoğunluk değil bir düzen; kalıcı ve onu başlatanlardan daha fazla insanı barındıran. Kart bilerek sessizdir.",
    "reversed": "Duygu içinden çekildikten sonra da sürdürülen düzen — dolu bir hayatın biçimi, içindeki herkes tarafından herkesin hatırı için korunur. Ya da direnilen tamamlanma, çünkü tamamlamak devretmek demektir ve devretmek, artık sizin olmaması demektir.",
    "inSpread": "Açılımın başında iş, zaten tümüyle biçimlenmiş bir şeyin içinde başlar. Karşıtlık konumunda, soruyu soranın planlarının bozacağı yerleşik bir duygusal düzen. Denge konumunda her şey yerli yerindedir. Sonuç olarak: tamamlanma — ve Papus'un onlu dizisinde, bir sonraki takımın işinin başlangıcı.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kupalar: He (ה), edilgen, alıcı ilke; bu takım Beria'da, yaratılış dünyasında etki eder; 10 sayısı: üçüncü serinin son He'si, tam gerçekleşme — takım tükenmiştir ve ardından gelen takımın tohumudur. Aşağıdaki anlam bu birleşimin okunuşudur (edilgen ilke, 10. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kupalar — He (ה), Beria, yaratılış dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "edilgen, alıcı ilke"
      },
      {
        "label": "Sayı",
        "value": "10 — üçüncü serinin son He'si"
      },
      {
        "label": "Sayının rolü",
        "value": "tam gerçekleşme — takım tükenmiştir ve ardından gelen takımın tohumudur"
      }
    ]
  },
  "chalices-page": {
    "upright": "Kişileşmiş gerçekleştirici terim: ilk kez olgu düzlemine indirilen duygu. Prens, bir yakınlığın içsel olmaktan çıkıp bir şey yaptığı andır — yapılan bir teklif, gönderilen bir mesaj, tam olarak düşünülmeden harekete dökülen bir duyarlılık. Papus'un dördüncü terimi şeyleri gerçek kılandır ve bir Prens onları beceriksizce gerçek kılar; bu, karttan bir yakınma değil, kartın bir tarifidir.",
    "reversed": "Son anda geri çekilen teklif; böylece hiçbir şey gerçek olmaz. Ya da öyle hızlı ve öyle sık harekete dökülen duygu ki hiçbiri yerine ulaşmaz — gerçekleştirilecek bir şey yokken denenen gerçekleşme.",
    "inSpread": "Açılımın başında iş, küçük bir duygusal hareketle başlar: bir mesaj, bir yaklaşım. Karşıtlık konumunda, birinin sınanmamış içtenliği; bunu geri çevirmek bir talebi geri çevirmekten çok daha zordur. Denge konumunda bir duyguyu dolaşımda tutan Prens'tir. Sonuç olarak: hissedilen bir şey yapılan bir şeye dönüşür.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kupalar: He (ה), edilgen, alıcı ilke; bu takım Beria'da, yaratılış dünyasında etki eder; Prens: son He, gerçekleştirici terimin cisimleşmiş hâli — takımın olguya indirilmesi. Aşağıdaki anlam bu birleşimin okunuşudur; Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kupalar — He (ה), Beria, yaratılış dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "edilgen, alıcı ilke"
      },
      {
        "label": "Rütbe",
        "value": "Prens — son He"
      },
      {
        "label": "Rütbenin rolü",
        "value": "gerçekleştirici terimin cisimleşmiş hâli — takımın olguya indirilmesi"
      }
    ]
  },
  "chalices-knight": {
    "upright": "Kişileşmiş dengeleyici terim: duyguyu bir yerden başka bir yere taşıyan kişi. Kupa Şövalyesi yaklaşmanın ta kendisidir — kur yapmak, bir yakınlık adına üstlenilen görev, henüz temas kurmamış iki taraf arasındaki hareket. Papus'un Vav'ı bağlar ve bir Şövalye yol alarak bağlar. Taşıdığı şey gerçektir; varıp varmayacağı ise bu kartın yanıtlamadığı ayrı bir sorudur.",
    "reversed": "Hiç yerine ulaşmayan hareket — yaklaşma, bir niyet olmaktan çıkıp bir tavra dönüşene dek tekrarlanır. Ya da kupa öyle özenle taşınır ki hiç teslim edilmez; aktarım bir meşguliyete dönüşmüştür.",
    "inSpread": "Açılımın başında iş, dışarıdan gelen bir yaklaşımla başlar. Karşıtlık konumunda, açık olan bir şeyi karmaşıklaştıran bir talip, bir teklif ya da bir aracı. Denge konumunda bağlantı odur ve bağlantı hareket hâlindedir. Sonuç olarak: bir şey gelir — Papus'un Vav'ı teslim eder, karar vermez.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kupalar: He (ה), edilgen, alıcı ilke; bu takım Beria'da, yaratılış dünyasında etki eder; Şövalye: Vav, dengeleyici terimin cisimleşmiş hâli — taşır, aktarır, arada gidip gelir. Aşağıdaki anlam bu birleşimin okunuşudur; Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kupalar — He (ה), Beria, yaratılış dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "edilgen, alıcı ilke"
      },
      {
        "label": "Rütbe",
        "value": "Şövalye — Vav"
      },
      {
        "label": "Rütbenin rolü",
        "value": "dengeleyici terimin cisimleşmiş hâli — taşır, aktarır, arada gidip gelir"
      }
    ]
  },
  "chalices-queen": {
    "upright": "Edilgen bir takımın edilgen ilkesi, vücut bulmuş hâliyle — Papus'un en yoğunlaşmış alıcılığı. Kupa Kraliçesi duyguyu ona göre davranmadan taşır ve çarpıtmadan geri yansıtır; bu, kulağa geldiğinden çok daha zahmetli bir işlemdir. Başkalarının içini döktüğü kişidir o. Otoritesi kimsenin üzerinde değildir; tümüyle, alırken gösterdiği isabetten ibarettir.",
    "reversed": "Yansıttığı her şeyin rengini almış yansıma — sınırı olmayan alıcılık, ta ki Kraliçe'nin kendine ait bir konumu kalmayana dek. Ya da hiçbir şeyi içeri almayı reddederek pürüzsüz tutulan bir yüzey.",
    "inSpread": "Açılımın başında iş, birinin onu kavrayışıyla başlar. Karşıtlık konumunda, soruyu soranı açıkça gören ve araya girmeye hiç niyeti olmayan biri. Denge konumunda o, herkesin duygusunun kendisine göre ölçüldüğü durgun noktadır. Sonuç olarak: mesele çözülmez, anlaşılır — ki Kupalar'da çözüm budur.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kupalar: He (ה), edilgen, alıcı ilke; bu takım Beria'da, yaratılış dünyasında etki eder; Kraliçe: He, takımın edilgen ilkesinin cisimleşmiş hâli — alır ve yansıtır. Aşağıdaki anlam bu birleşimin okunuşudur; Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kupalar — He (ה), Beria, yaratılış dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "edilgen, alıcı ilke"
      },
      {
        "label": "Rütbe",
        "value": "Kraliçe — He"
      },
      {
        "label": "Rütbenin rolü",
        "value": "takımın edilgen ilkesinin cisimleşmiş hâli — alır ve yansıtır"
      }
    ]
  },
  "chalices-king": {
    "upright": "Alıcı dünyanın içindeki etkin terim: duygu ortamında başlatan biri. Papus'un Yod'u her zaman bir şeyi başlatır ve Kupa Kralı, sonrasında her şeyin üzerinde ilerleyeceği duygusal koşulları belirleyerek başlatır — bir hanenin tonu, bir işyerinin havası. Duygularını dışa vuran biri değildir. Buradaki etkin ilke talepte bulunarak değil, bir iklim kurarak işler.",
    "reversed": "Tek bir kişinin işine gelecek biçimde kurulmuş iklim — bir denetim aracı olarak atmosfer; hiç yüksek sesle dile getirilmediği için de bir o kadar etkili. Ya da çok şey hisseden ama hiçbir şey başlatmayan birinin oturduğu taht; böylece koşulları kim en yüksek sesle konuşuyorsa o belirler.",
    "inSpread": "Açılımın başında iş, biri duygusal koşulları belirlediği için başlar. Karşıtlık konumunda, hiçbir zaman açık bir iddiada bulunmadığı için itiraz edilemeyen bir otorite. Denge konumunda sıcaklığı sabit tutan odur. Sonuç olarak: mesele başkasının belirlediği koşullarla çözülür, hem de sakince.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kupalar: He (ה), edilgen, alıcı ilke; bu takım Beria'da, yaratılış dünyasında etki eder; Kral: Yod, takımın etkin ilkesinin cisimleşmiş hâli — başlatır. Aşağıdaki anlam bu birleşimin okunuşudur; Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kupalar — He (ה), Beria, yaratılış dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "edilgen, alıcı ilke"
      },
      {
        "label": "Rütbe",
        "value": "Kral — Yod"
      },
      {
        "label": "Rütbenin rolü",
        "value": "takımın etkin ilkesinin cisimleşmiş hâli — başlatır"
      }
    ]
  },
  "swords-1": {
    "upright": "Çatışma takımının etkin kökeni; doğan şey bir ayrımdır. Papus'un Vav'ı iki şeyi aralarında durarak birbirine bağlar; bu yüzden o takımın ilk terimi, ortada iki şey bulunduğunu tesis eden kesiktir: dile getirilen görüş, söylenen hakikat, hiçbir çizginin olmadığı yere çekilen çizgi. Bir ruh hâli olarak değil bir eylem olarak berraklık — ve takımda sonradan gelen her çatışma, birinin burada üstelediği bir ayrımdan doğar.",
    "reversed": "Kendi uğruna atılan kesik — bir araç olarak ayrım, görmek için değil bölmek için kullanılan berraklık. Ya da görüş hiç dile getirilmez; böylece bütün takımın işi, kimsenin adını koymaya yanaşmadığı bir karışıklık üzerinde ilerler.",
    "inSpread": "Açılımın başında iş, açıkça söylenen bir şeyle başlar. Karşıtlık konumunda, soruyu soranın yapmamayı yeğleyeceği bir ayrım. Denge konumunda durumu tek bir açık ifade bir arada tutar. Sonuç olarak: berraklık; bedeli, berraklığın bedeli neyse o olacaktır.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kılıçlar: Vav (ו), dengeleyici ilke, ikisi arasındaki bağ; bu takım Yetzira'da, biçimlenme dünyasında etki eder; 1 sayısı: birinci serinin Yod'u, takımın saf etkin kaynağı. Aşağıdaki anlam bu birleşimin okunuşudur (dengeleyici ilke, 1. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kılıçlar — Vav (ו), Yetzira, biçimlenme dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "dengeleyici ilke, ikisi arasındaki bağ"
      },
      {
        "label": "Sayı",
        "value": "1 — birinci serinin Yod'u"
      },
      {
        "label": "Sayının rolü",
        "value": "takımın saf etkin kaynağı"
      }
    ]
  },
  "swords-2": {
    "upright": "Çatışmanın edilgen kabulü. İki güç mevcuttur ve hiçbiri kullanılmamaktadır; kılıçlar çaprazlanmış ve öylece tutulmaktadır. Papus'un ikinci terimi eylemez, yansıtır; bu yüzden bu bir çözüm değil, çözülmemiş bir şeyin isabetle tutulmasıdır. Göz bağı cehalet değildir — soruyu soranın dengede kalması gerektiğine karar verdiği bir terazinin, görmenin etkisiyle bir yana devrilmesine izin vermeyi reddetmektir.",
    "reversed": "Bozulan denge, tercihle ya da bitkinlikle — ters kart genellikle kılıçlardan birinin indiği anlamına gelir. Ya da öylesine uzun süre korunan bir kilitlenme ki karar olmaktan çıkıp durumun ta kendisi olmuştur.",
    "inSpread": "Açılımın başında iş bir çıkmazda başlar. Karşıtlık konumunda, her şeyi bekleten bir karar vermeme direnci. Denge konumunda bu, kartın tam da onun için yapıldığı konumdur. Sonuç olarak: hiçbir şey çözülmez — ve Papus, okumanın yanıt vermekte başarısız olmadığını, soruyu sorana bunu açıkça söylediğini belirtirdi.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kılıçlar: Vav (ו), dengeleyici ilke, ikisi arasındaki bağ; bu takım Yetzira'da, biçimlenme dünyasında etki eder; 2 sayısı: birinci serinin He'si, bu kaynağın edilgen yansıması. Aşağıdaki anlam bu birleşimin okunuşudur (dengeleyici ilke, 2. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kılıçlar — Vav (ו), Yetzira, biçimlenme dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "dengeleyici ilke, ikisi arasındaki bağ"
      },
      {
        "label": "Sayı",
        "value": "2 — birinci serinin He'si"
      },
      {
        "label": "Sayının rolü",
        "value": "bu kaynağın edilgen yansıması"
      }
    ]
  },
  "swords-3": {
    "upright": "Dengeleyici takımın dengeleyici terimi — iki katına çıkmış çatışma ve bu yüzden, bu dünyanın onu çözebildiği tek yolla çözülmüş çatışma: bir yarayla. Tek bir kalbi delen üç kılıç bir ruh hâli değil, bir yapıdır. Papus'un üçüncü terimi bağlar; birbirine karşıt iki gücü bağlayan da buluştukları noktada açılan hasardır. İsabetli ve kişisel olmayan bir keder.",
    "reversed": "Tedavi edilen yara ya da beslenip büyütülen yara — ters konum burada keskin biçimde ikiye ayrılır ve hangisi olduğuna çevredeki kartlar karar verir. Acının daha güvenli bir hedefe yönlendirilmesini de gösterebilir; bu hiçbir şeyi çözmez ama kanamayı görünen yerde durdurur.",
    "inSpread": "Açılımın başında iş, çoktan yaşanmış bir incinmeyle başlar. Karşıtlık konumunda, birinin adına tartışmayı yürüten bir yara vardır. Denge konumunda durumu acı verici ama işlevsel bir şey bir arada tutar. Sonuç olarak: keder — ve Papus'un şemasında bir çözüm; bu kartın bu kadar sık haklı çıkıp bu kadar nadir hoş karşılanmasının nedeni de budur.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kılıçlar: Vav (ו), dengeleyici ilke, ikisi arasındaki bağ; bu takım Yetzira'da, biçimlenme dünyasında etki eder; 3 sayısı: birinci serinin Vav'ı, ikisini birbirine bağlayan denge. Aşağıdaki anlam bu birleşimin okunuşudur (dengeleyici ilke, 3. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kılıçlar — Vav (ו), Yetzira, biçimlenme dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "dengeleyici ilke, ikisi arasındaki bağ"
      },
      {
        "label": "Sayı",
        "value": "3 — birinci serinin Vav'ı"
      },
      {
        "label": "Sayının rolü",
        "value": "ikisini birbirine bağlayan denge"
      }
    ]
  },
  "swords-4": {
    "upright": "Dönüm noktası: gerçekleşmiş çatışma; biçimlenme dünyasında gerçekleşmiş bir çatışma ise yerleşik bir konuma dönüşür — ateşkes, bırakılmış silahlar, dinlenen yatık heykel. Papus'un dördüncü terimi sabitler ve burada sabitlenen şey bir barıştan çok bir durmadır. Duvarda üç kılıç, altta bir tane: bu düzen kasıtlıdır. Bu bir iyileşmedir; aynı zamanda bir sonraki dizinin üzerinde savaşacağı topraktır.",
    "reversed": "İşini görmeden, erkenden bölünen dinlenme. Ya da sessizce kalıcı hâle gelmiş bir ateşkes; öyle ki çatışma ne çözülmüştür ne de artık ilgili herhangi biri tarafından kabul edilmektedir.",
    "inSpread": "Açılımın başında iş, bir kavganın ardından gelen bir duraklamayla başlar. Karşıtlık konumunda, birini koruyan bir hareketsizlik vardır. Denge konumunda durum tam da kimse üstüne gitmediği için ayakta kalır. Sonuç olarak: dinlenme — ve Papus'un dördüncü terimi devreder; bu yüzden dinlenmenin neye hazırlık olduğunu okuyun.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kılıçlar: Vav (ו), dengeleyici ilke, ikisi arasındaki bağ; bu takım Yetzira'da, biçimlenme dünyasında etki eder; 4 sayısı: birinci serinin son He'si ve ikinci serinin Yod'u, gerçekleşme — ve bir sonraki hareketi başlatan dönüm noktası. Aşağıdaki anlam bu birleşimin okunuşudur (dengeleyici ilke, 4. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kılıçlar — Vav (ו), Yetzira, biçimlenme dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "dengeleyici ilke, ikisi arasındaki bağ"
      },
      {
        "label": "Sayı",
        "value": "4 — birinci serinin son He'si ve ikinci serinin Yod'u"
      },
      {
        "label": "Sayının rolü",
        "value": "gerçekleşme — ve bir sonraki hareketi başlatan dönüm noktası"
      }
    ]
  },
  "swords-5": {
    "upright": "Dörtlünün durmasına verilen edilgen tepki: yerleşmiş bir çatışmanın, onu kaybedenin koşullarıyla sona erdiren kişiye yaptığı. Bir figür kılıçları tutar, ikisi uzaklaşır ve kart kazananı memnun göstermemeye özen gösterir. Papus'un beşinci terimi her zaman dördüncünün bedelidir. Uğruna savaşılan şeye zarar vermiş bir zafer — uygulanmış bir yenilgi; bedelini de iki taraf birlikte öder.",
    "reversed": "Kabul edilen bedel — kılıçlar yere bırakılır, geri dönüş yolu başlar. Ya da aynı içi boş zafer yüksek sesle savunulur, çünkü onu incelemek ona bir fiyat biçmek anlamına gelirdi.",
    "inSpread": "Açılımın başında iş, birinin pişman olduğu bir zaferin ardından başlar. Karşıtlık konumunda, soruyu soranın kazanabileceği ama girmemesi gereken bir çatışma vardır. Denge konumunda durum istikrarlıdır ve onu böyle kılan aşağılanmayı biri sineye çekmektedir. Sonuç olarak: hedefin değerinden daha pahalıya mal olan bir zafer.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kılıçlar: Vav (ו), dengeleyici ilke, ikisi arasındaki bağ; bu takım Yetzira'da, biçimlenme dünyasında etki eder; 5 sayısı: ikinci serinin He'si, gerçekleşene verilen edilgen tepki. Aşağıdaki anlam bu birleşimin okunuşudur (dengeleyici ilke, 5. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kılıçlar — Vav (ו), Yetzira, biçimlenme dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "dengeleyici ilke, ikisi arasındaki bağ"
      },
      {
        "label": "Sayı",
        "value": "5 — ikinci serinin He'si"
      },
      {
        "label": "Sayının rolü",
        "value": "gerçekleşene verilen edilgen tepki"
      }
    ]
  },
  "swords-6": {
    "upright": "Beşliden sonra geri kazanılan denge; biçimlenme dünyasında denge uzaklaşarak yeniden kurulur: buradan ayrılan geçiş. Sal, sığ su, kullanılmak yerine taşınan kılıçlar. Papus'un altıncı terimi her zaman beşinciyi onarır ve burada onarım koşulları değil, zemini değiştirerek yapılır. Hiçbir şey çözülmemiştir — çatışma, geçerli olmadığı bir yere taşınmıştır.",
    "reversed": "Reddedilen ya da yapılıp sonra geri alınan geçiş — çatışmanın asıl yaşadığı zemine dönüş. Ya da yanında getirilip karşı kıyıya aynen dikilen kılıçlar.",
    "inSpread": "Açılımın başında iş, sorundan uzaklaşan bir hamleyle başlar. Karşıtlık konumunda, hiçbir şeyi çözmeyen ama bir çözüm gibi görünen bir ayrılış vardır. Denge konumunda durum, yolda olduğu için sabittir. Sonuç olarak: geçiş — denge yeniden kurulur, yeni bir zeminde ve kimsenin taviz vermesiyle değil.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kılıçlar: Vav (ו), dengeleyici ilke, ikisi arasındaki bağ; bu takım Yetzira'da, biçimlenme dünyasında etki eder; 6 sayısı: ikinci serinin Vav'ı, yeni bir zeminde yeniden kurulan denge. Aşağıdaki anlam bu birleşimin okunuşudur (dengeleyici ilke, 6. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kılıçlar — Vav (ו), Yetzira, biçimlenme dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "dengeleyici ilke, ikisi arasındaki bağ"
      },
      {
        "label": "Sayı",
        "value": "6 — ikinci serinin Vav'ı"
      },
      {
        "label": "Sayının rolü",
        "value": "yeni bir zeminde yeniden kurulan denge"
      }
    ]
  },
  "swords-7": {
    "upright": "İkinci dönüm noktası: çatışma yeniden gerçekleşir ve bu kez dolambaçla gerçekleşir. Beş kılıç alınmış, ikisi bırakılmış, hiçbir şey ilan edilmemiş. Papus'un yedinci terimi gerçek bir gerçekleşmedir — hile işe yarar — ve aynı zamanda son dizinin istikrarsız açılışıdır; takımın bundan sonra kötüleşmesinin nedeni de budur. Temas olmadan yürütülen çatışma: manevra, çekince, toplantıda söylenmeyen şey.",
    "reversed": "Hilenin açığa çıkması; bu çoğu zaman herkes için mümkün olan en iyi sonuçtur. Ya da geriye kalan tek dil dolambaç olmuştur; öyle ki artık basit şeylere bile dolaylı yoldan yaklaşılır.",
    "inSpread": "Açılımın başında iş, saklı tutulan bir şeyle başlar. Karşıtlık konumunda bir rakipten çok bir manevra vardır — Papus'un yöntemi kötü adamı değil, mekanizmayı aramayı söyler. Denge konumunda durum, her şey söylenmediği için ayakta kalır. Sonuç olarak: iş dolambaçlı yoldan başarılır ve bir yedinci terim devreder.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kılıçlar: Vav (ו), dengeleyici ilke, ikisi arasındaki bağ; bu takım Yetzira'da, biçimlenme dünyasında etki eder; 7 sayısı: ikinci serinin son He'si ve üçüncü serinin Yod'u, son hareketi kendisi başlatan ikinci bir gerçekleşme. Aşağıdaki anlam bu birleşimin okunuşudur (dengeleyici ilke, 7. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kılıçlar — Vav (ו), Yetzira, biçimlenme dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "dengeleyici ilke, ikisi arasındaki bağ"
      },
      {
        "label": "Sayı",
        "value": "7 — ikinci serinin son He'si ve üçüncü serinin Yod'u"
      },
      {
        "label": "Sayının rolü",
        "value": "son hareketi kendisi başlatan ikinci bir gerçekleşme"
      }
    ]
  },
  "swords-8": {
    "upright": "Yedilinin manevralarına edilgen yanıt: kısıtlanma; çatışma artık içeri girmiştir. Bağlı, gözleri bağlı, kılıçlar figürün içinden geçmiyor, çevresine dikili — Papus'un sekizinci terimi asla başlatmaz ve kartın bütün gücü, kısıtlamanın gerçek olmasında ama figürü tutan şeyin o olmamasındadır. Durumun yarattığı ve soruyu soranın artık sürdürdüğü bir kısıtlanma; hangisinin hangisi olduğunu ayırt edemeden.",
    "reversed": "Sınanan bağlar — ters konum genellikle bunlardan birinin gevşek çıktığı anlamına gelir. Ya da tümüyle içselleştirilmiş kısıtlanma; öyle ki kılıçlar kaldırılsa davranışta hiçbir değişiklik olmazdı.",
    "inSpread": "Açılımın başında iş, daha baştan kısıtlanmış olarak başlar. Karşıtlık konumunda, soruyu soranın hak ettiğinden fazla inandığı bir sınır vardır. Denge konumunda durum istikrarlıdır ve bu istikrar kafesin ta kendisidir. Sonuç olarak: kısıtlanma — ve Papus'un sistemi, nasıl kurulduğunu görmek için yediliye geri bakmayı söyler.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kılıçlar: Vav (ו), dengeleyici ilke, ikisi arasındaki bağ; bu takım Yetzira'da, biçimlenme dünyasında etki eder; 8 sayısı: üçüncü serinin He'si, bu gerçekleşmeye verilen edilgen yanıt. Aşağıdaki anlam bu birleşimin okunuşudur (dengeleyici ilke, 8. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kılıçlar — Vav (ו), Yetzira, biçimlenme dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "dengeleyici ilke, ikisi arasındaki bağ"
      },
      {
        "label": "Sayı",
        "value": "8 — üçüncü serinin He'si"
      },
      {
        "label": "Sayının rolü",
        "value": "bu gerçekleşmeye verilen edilgen yanıt"
      }
    ]
  },
  "swords-9": {
    "upright": "Takımın son dengesi; bir çatışma takımında son denge tamamen tek bir kişinin içinde kurulur. Duvarda dokuz kılıç, karanlıkta doğrulmuş figür. Papus'un dokuzuncu terimi bir diziyi tamamlanmadan önce yerine oturtur ve burada yerine oturan şey ıstıraptır — dışarıda hiçbir tarafı kalmamış, bu yüzden kusursuzca dengelenmiş ve kendi kendini çözemeyen bir çatışma. Gece doğru sahnedir: hiçbir şey olmamaktadır.",
    "reversed": "Biten gece ya da kılıç sayısının yanlış çıkması — ters konum, orantısızlığın görünür hâle geldiği yerdir. Daha kötüsü de olabilir: ıstırap düzene sokulur, bir rutine bağlanır, katlanılabilir ve dolayısıyla kalıcı kılınır.",
    "inSpread": "Açılımın başında iş, durumdan önce de var olan bir korkuyla başlar. Karşıtlık konumunda, kanıtların desteklemeyeceği işi gören bir dehşet vardır. Denge konumunda kişi dayanmaktadır ve bu ona her şeyine mal olmaktadır. Sonuç olarak: çatışma içeride, tanıksız biter ve Papus bu konuda hiçbir teselli sunmaz.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kılıçlar: Vav (ו), dengeleyici ilke, ikisi arasındaki bağ; bu takım Yetzira'da, biçimlenme dünyasında etki eder; 9 sayısı: üçüncü serinin Vav'ı, tamamlanmadan önceki son denge. Aşağıdaki anlam bu birleşimin okunuşudur (dengeleyici ilke, 9. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kılıçlar — Vav (ו), Yetzira, biçimlenme dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "dengeleyici ilke, ikisi arasındaki bağ"
      },
      {
        "label": "Sayı",
        "value": "9 — üçüncü serinin Vav'ı"
      },
      {
        "label": "Sayının rolü",
        "value": "tamamlanmadan önceki son denge"
      }
    ]
  },
  "swords-10": {
    "upright": "Tükenmiş takım. On kılıç, çekişecek hiçbir şey kalmamış; Papus'un onuncu terimi ise her zaman aynı zamanda bir tohumdur — dolayısıyla bu, çatışma için gerçekten nihai, ardından gelecek her şey için de gerçekten bir başlangıç olan bir tamamlanmadır. Kart bir uyarı değildir; belirli bir şeyin en kötüsünün yaşanıp bittiğinin beyanıdır. Biçimlenme dünyasında tartışılacak hiçbir şey kalmamıştır.",
    "reversed": "Reddedilen son — bittikten sonra yeniden canlandırılan bir çatışma; bu takımda yapılabilecek en pahalı hamle budur. Ya da ardından gelenin başlangıcı, çünkü tükenmiş bir takım devreder: kartın ufkunda beliren ilk ışık.",
    "inSpread": "Açılımın başında iş, tam bir yenilgiden başlar; bu, kısmi bir yenilgiden daha sağlam bir zemindir. Karşıtlık konumunda, soruyu soranın hâlâ itiraz ettiği bir son vardır. Denge konumunda hiçbir şey dengede değildir — bu konum yalnızca işin bittiğini bildirir. Sonuç olarak: çatışma her bakımdan sona ermiştir ve bir sonraki takımın işi başlar.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kılıçlar: Vav (ו), dengeleyici ilke, ikisi arasındaki bağ; bu takım Yetzira'da, biçimlenme dünyasında etki eder; 10 sayısı: üçüncü serinin son He'si, tam gerçekleşme — takım tükenmiştir ve ardından gelen takımın tohumudur. Aşağıdaki anlam bu birleşimin okunuşudur (dengeleyici ilke, 10. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kılıçlar — Vav (ו), Yetzira, biçimlenme dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "dengeleyici ilke, ikisi arasındaki bağ"
      },
      {
        "label": "Sayı",
        "value": "10 — üçüncü serinin son He'si"
      },
      {
        "label": "Sayının rolü",
        "value": "tam gerçekleşme — takım tükenmiştir ve ardından gelen takımın tohumudur"
      }
    ]
  },
  "swords-page": {
    "upright": "Kişi olarak gerçekleştirici terim: çatışmanın gözlem yoluyla olguya indirilmesi. Kılıç Prensi tetikteliktir — fark eden, kontrol eden, kimsenin sormadığı soruyu soran ve sonra bunu bildiren kişi. Papus'un dördüncü terimi şeyleri gerçek kılar ve bu Prensin gerçek kıldığı şey bilgidir: henüz yargı değil, henüz güç değil, ama ikisinin de ihtiyaç duyduğu ham madde; yanıtta hiçbir çıkarı olmayan biri tarafından toplanmış.",
    "reversed": "Şüpheye dönüşmüş gözlem — sonucu önceden belirlenmiş tetiktelik. Ya da durmaksızın toplanan ama hiç aktarılmayan bilgi; öyle ki sonunda hiçbir şey gerçekleşmez.",
    "inSpread": "Açılımın başında iş, birisi bir şey fark ettiği için başlar. Karşıtlık konumunda bir gözlemci vardır — Papus'un yöntemi ona kızmak yerine onu teşhis etmeyi söyler. Denge konumunda durum, izlendiği için ayakta kalır. Sonuç olarak: bir şey gün yüzüne çıkar.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kılıçlar: Vav (ו), dengeleyici ilke, ikisi arasındaki bağ; bu takım Yetzira'da, biçimlenme dünyasında etki eder; Prens: son He, gerçekleştirici terimin cisimleşmiş hâli — takımın olguya indirilmesi. Aşağıdaki anlam bu birleşimin okunuşudur; Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kılıçlar — Vav (ו), Yetzira, biçimlenme dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "dengeleyici ilke, ikisi arasındaki bağ"
      },
      {
        "label": "Rütbe",
        "value": "Prens — son He"
      },
      {
        "label": "Rütbenin rolü",
        "value": "gerçekleştirici terimin cisimleşmiş hâli — takımın olguya indirilmesi"
      }
    ]
  },
  "swords-knight": {
    "upright": "Kişi olarak dengeleyici terim, dengenin çatışma olduğu takımda: hareket hâlindeki güç. Kılıç Şövalyesi hücumdur — argümanın, varınca ne olacağına dair hiçbir hazırlık yapılmadan, hızla doğrudan hedefine götürülmesi. Papus'un Vav'ı bağlar ve bu Şövalye çarpışarak bağlar. Kartta sahtekârca hiçbir şey yoktur; o yalnızca takımın en hızlı ve geri alınması en zor şeyidir.",
    "reversed": "Yanlış yöne giden ya da kararlılığından hiçbir şey yitirmeden yanlış hedefe yöneltilen hücum. Ya da her an uygulanmak üzere olan güç — dizginleri çekilmiş at; bu kartta bu da kendine özgü bir hasardır.",
    "inSpread": "Açılımın başında iş, hızlı ve doğrudan hareket eden biriyle başlar. Karşıtlık konumunda, yavaşlamayacak ve yanından dolaşılamayacak bir rakip vardır. Denge konumunda hiçbir şey uzun süre dengede kalmaz — Şövalye geçici bir durumdur. Sonuç olarak: iş doğrudan güçle, çabucak halledilir; bedeli için bir sonraki karta bakın.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kılıçlar: Vav (ו), dengeleyici ilke, ikisi arasındaki bağ; bu takım Yetzira'da, biçimlenme dünyasında etki eder; Şövalye: Vav, dengeleyici terimin cisimleşmiş hâli — taşır, aktarır, arada gidip gelir. Aşağıdaki anlam bu birleşimin okunuşudur; Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kılıçlar — Vav (ו), Yetzira, biçimlenme dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "dengeleyici ilke, ikisi arasındaki bağ"
      },
      {
        "label": "Rütbe",
        "value": "Şövalye — Vav"
      },
      {
        "label": "Rütbenin rolü",
        "value": "dengeleyici terimin cisimleşmiş hâli — taşır, aktarır, arada gidip gelir"
      }
    ]
  },
  "swords-queen": {
    "upright": "Vav'ın He'si: dengeleyici takımın alıcı kutbu. Kılıçlar iki gücün buluştuğu yerdeki sürtünmedir ve Kraliçe buna güç eklemez — onu alır ve aslına uygun biçimde geri yansıtır. Bu saldırı değil, yargıdır: bir çatışmanın ölçüsünü almış ve onu yumuşatmadan dile getirebilen kişi. Papus'un edilgen terimi asla zayıf değildir, kesindir; Kılıç Kraliçesi bir kavganın yapısını gören ve iki tarafın anlattıklarından da etkilenmeyen birinin kartıdır.",
    "reversed": "Ters konumda yansıtma soğur, ardından onu yapan kişiye döner. Aynı isabet, kendisinden başka hiçbir nesnesi olmadan uygulanır: eski bir yarayı zihninde tekrar tekrar prova eden, bir çatışmanın anısını çatışmanın kendisi sanan bir zihin. Eşit ölçüde, verilmiş ve bir daha gözden geçirilmeyecek bir yargıya da işaret edebilir — durum değiştikten çok sonra bile korunan isabetli okuma; öyle ki artık hiç de isabetli değildir.",
    "inSpread": "Papus'un yönteminde saray kartları çoğu zaman bir kişi olduğu kadar bir mizaçtır. Açılımın başında iş, birinin bir çatışmayı açık gözle değerlendirmesiyle başlar. Karşıtlık konumunda, iltifata kanmayacak biri tarafından doğru okunmayı bekleyin. Denge konumunda işi dürüst tutan odur. Sonuç olarak: iş güçle değil yargıyla çözülür ve yargı nazik değil, kesin olacaktır.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kılıçlar: Vav (ו), dengeleyici ilke, ikisi arasındaki bağ; bu takım Yetzira'da, biçimlenme dünyasında etki eder; Kraliçe: He, takımın edilgen ilkesinin cisimleşmiş hâli — alır ve yansıtır. Aşağıdaki anlam bu birleşimin okunuşudur; Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kılıçlar — Vav (ו), Yetzira, biçimlenme dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "dengeleyici ilke, ikisi arasındaki bağ"
      },
      {
        "label": "Rütbe",
        "value": "Kraliçe — He"
      },
      {
        "label": "Rütbenin rolü",
        "value": "takımın edilgen ilkesinin cisimleşmiş hâli — alır ve yansıtır"
      }
    ]
  },
  "swords-king": {
    "upright": "Çatışma takımının içindeki etkin terim: buyuran yargı. Kraliçe bir çatışmayı aslına uygun biçimde alırken Kral onun hangi koşullarla karara bağlanacağını belirler ve takımda bu koşulları uygulatacak konuma sahip tek figür odur. Papus'un Yod'u şeyleri başlatır; Kılıç Kralı neyin yanıt sayılacağını tanımlayarak başlar. Dil aracılığıyla kullanılan ve tam da bu yüzden bağlayıcı olan otorite.",
    "reversed": "Kuralı, kendisi ona bağlı kalmayacak biri koyar — bir disiplin olarak değil, bir konum olarak yargı. Ya da karar vermek için değil, üstün gelmek için kullanılan zekâ; bu da karşı çıkılamayan ama yanlış hükümler üretir.",
    "inSpread": "Açılımın başında iş bir hükümle başlar. Karşıtlık konumunda, soruyu soranın kazanamayacağı biçimde soruyu çoktan çerçevelemiş bir otorite vardır. Denge konumunda koşulları yerinde tutan odur. Sonuç olarak: iş, ona karar vermeye yetkili biri tarafından karara bağlanır ve karar geçerliliğini koruyacaktır.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Kılıçlar: Vav (ו), dengeleyici ilke, ikisi arasındaki bağ; bu takım Yetzira'da, biçimlenme dünyasında etki eder; Kral: Yod, takımın etkin ilkesinin cisimleşmiş hâli — başlatır. Aşağıdaki anlam bu birleşimin okunuşudur; Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Kılıçlar — Vav (ו), Yetzira, biçimlenme dünyası"
      },
      {
        "label": "Takımın ilkesi",
        "value": "dengeleyici ilke, ikisi arasındaki bağ"
      },
      {
        "label": "Rütbe",
        "value": "Kral — Yod"
      },
      {
        "label": "Rütbenin rolü",
        "value": "takımın etkin ilkesinin cisimleşmiş hâli — başlatır"
      }
    ]
  },
  "pentacles-1": {
    "upright": "Maddi dünyanın etkin kaynağı: verilen imkân. Papus'un Yod'u şeyleri başlatır ve Asiya'da başlayan şey bir kaynaktır — sermaye, bir alet, bir değer biçilmiş bir fırsat. As, takımda maddenin saf potansiyel olduğu tek karttır ve maddi dünyada potansiyelin elde tutulabilecek bir şey biçimini alması tam yerindedir. Kendine ait bir yönü yoktur; içine konduğu her şeye dönüşür.",
    "reversed": "Verilen ama kullanılmayan imkân — elde tutulan, hayranlıkla bakılan, el sürülmeden saklanan kaynak. Ya da bedeli hiç okunmamış bir fırsat; takımın geri kalanı bu bedeli usulünce tahsil edecektir.",
    "inSpread": "Açılımın başında iş, somut bir şeyin gelişiyle başlar. Karşıtlık konumunda, koşullara bağlanmış bir kaynak vardır. Denge konumunda durum tek bir maddi olguya dayanır. Sonuç olarak: bir netice değil, imkân — bununla ne yapılacağına takımın geri kalanı karar verir.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Tılsımlar: son He (ה), gerçekleştirici ilke, olguyu yaratan terim; bu takım Asiya'da, maddi dünyada etki eder; 1 sayısı: birinci serinin Yod'u, takımın saf etkin kaynağı. Aşağıdaki anlam bu birleşimin okunuşudur (gerçekleştirici ilke, 1. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Tılsımlar — son He (ה), Asiya, maddi dünya"
      },
      {
        "label": "Takımın ilkesi",
        "value": "gerçekleştirici ilke, olguyu yaratan terim"
      },
      {
        "label": "Sayı",
        "value": "1 — birinci serinin Yod'u"
      },
      {
        "label": "Sayının rolü",
        "value": "takımın saf etkin kaynağı"
      }
    ]
  },
  "pentacles-2": {
    "upright": "As'ın edilgen yansıması: iki talep olarak görülen tek bir kaynak. Papus'un ikinci terimi yaratmaz, ikiye katlar ve yansıtır; maddi dünyada bu yansıma, hiçbiri bırakılamayan iki yükümlülük arasındaki sürekli ayardır. Figür hokkabazlık yapar, çünkü iki sikke de gerçektir. Bu kaos değil yetkinliktir — ama hiçbir yerinde boşluk bırakmayan bir yetkinlik.",
    "reversed": "Denge düşmüş — yükümlülüklerden biri terk edilmiş, genellikle daha sessiz olanı. Ya da hokkabazlık, gerekli olduğu noktanın çok ötesine kadar sürdürülüyor, çünkü hareketin kendisi kimlik hâline gelmiş.",
    "inSpread": "Açılımın başında iş, iki taahhüt ve tek bir imkân kümesiyle başlar. Karşıtlık konumunda kimsenin hesaba katmadığı ikinci bir yükümlülük vardır. Denge konumunda olan tam olarak budur ve bedelsiz değildir. Sonuç olarak: ikisi de sürdürülür ve Papus'un ikinci terimi bunun ötesinde hiçbir şey vaat etmez.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Tılsımlar: son He (ה), gerçekleştirici ilke, olguyu yaratan terim; bu takım Asiya'da, maddi dünyada etki eder; 2 sayısı: birinci serinin He'si, bu kaynağın edilgen yansıması. Aşağıdaki anlam bu birleşimin okunuşudur (gerçekleştirici ilke, 2. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Tılsımlar — son He (ה), Asiya, maddi dünya"
      },
      {
        "label": "Takımın ilkesi",
        "value": "gerçekleştirici ilke, olguyu yaratan terim"
      },
      {
        "label": "Sayı",
        "value": "2 — birinci serinin He'si"
      },
      {
        "label": "Sayının rolü",
        "value": "bu kaynağın edilgen yansıması"
      }
    ]
  },
  "pentacles-3": {
    "upright": "Maddi dünyanın bağlayıcı terimi: birleşen emek. Üç, ilk iki terimin hiçbirinin içermediği bir şeyin var olduğu yerdir ve Asiya'da beliren bu şey zanaattir — duvarcı, plan ve hami; hiçbiri binayı tek başına ortaya çıkaramaz. Papus'un üçüncü terimi her zaman birleştirir ve burada iş bölümüyle birleştirir. Tanınan beceri; hem de özellikle ona ihtiyacı olan insanlarca tanınan.",
    "reversed": "İş birliği yalnızca adda kalmış — üç taraf anılıyor, işi biri yapıyor. Ya da zanaat diğer iki terim olmadan icra ediliyor; öyle ki tamamen yetkin ve büsbütün kullanışsız.",
    "inSpread": "Açılımın başında iş, ortak bir çalışma olarak başlar. Karşıtlık konumunda soruyu soranın bağımlı olduğu ama denetleyemediği bir iş birliği vardır. Denge konumunda ayakta tutan şey bu düzenlemedir. Sonuç olarak: birden fazla kişi tarafından bir şey inşa edilir ve övgü paylaşılacaktır.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Tılsımlar: son He (ה), gerçekleştirici ilke, olguyu yaratan terim; bu takım Asiya'da, maddi dünyada etki eder; 3 sayısı: birinci serinin Vav'ı, ikisini birbirine bağlayan denge. Aşağıdaki anlam bu birleşimin okunuşudur (gerçekleştirici ilke, 3. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Tılsımlar — son He (ה), Asiya, maddi dünya"
      },
      {
        "label": "Takımın ilkesi",
        "value": "gerçekleştirici ilke, olguyu yaratan terim"
      },
      {
        "label": "Sayı",
        "value": "3 — birinci serinin Vav'ı"
      },
      {
        "label": "Sayının rolü",
        "value": "ikisini birbirine bağlayan denge"
      }
    ]
  },
  "pentacles-4": {
    "upright": "Mihver. Gerçekleşmiş madde, elde tutulan maddeye dönüşür — mülkiyet; ve Papus'un dördüncü terimi bunun bir kusur olmadan önce bir başarı olduğunu dürüstçe kabul eder. Dört sikke, hepsinin hesabı belli, hiçbiri yerinden kıpırdamıyor. Kaynakların dolaşmayı bırakıp bir mevkiye dönüştüğü noktadır bu. İlk üç terimin ürettiğini sabitler ve bir mihver olduğundan, ikinci serinin yaptığı her şey ondan başlar.",
    "reversed": "Kavrayış gevşemiş, isteyerek ya da zorla — ters konumda bu cömertlik de olabilir kayıp da; kararı çevredeki kartlar verir. Ya da tutma o kadar ileri götürülmüş ki tutan artık tutulan olmuştur; beşin geliştireceği okuma da budur.",
    "inSpread": "Açılımın başında iş, yerleşik bir maddi konumdan başlar. Karşıtlık konumunda birinin bir kaynağın hareket etmesine razı olmaması vardır. Denge konumunda durum güvencededir ve tamamen durağandır. Sonuç olarak: şey elde tutulur — ve Papus'un mihveri, başka bir şeyi başlatacak biçimde tutulmak demektir.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Tılsımlar: son He (ה), gerçekleştirici ilke, olguyu yaratan terim; bu takım Asiya'da, maddi dünyada etki eder; 4 sayısı: birinci serinin son He'si ve ikinci serinin Yod'u, gerçekleşme — ve bir sonraki hareketi başlatan dönüm noktası. Aşağıdaki anlam bu birleşimin okunuşudur (gerçekleştirici ilke, 4. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Tılsımlar — son He (ה), Asiya, maddi dünya"
      },
      {
        "label": "Takımın ilkesi",
        "value": "gerçekleştirici ilke, olguyu yaratan terim"
      },
      {
        "label": "Sayı",
        "value": "4 — birinci serinin son He'si ve ikinci serinin Yod'u"
      },
      {
        "label": "Sayının rolü",
        "value": "gerçekleşme — ve bir sonraki hareketi başlatan dönüm noktası"
      }
    ]
  },
  "pentacles-5": {
    "upright": "Son He'nin He'si: madde dünyasının içindeki edilgen bir terim, dörtteki mihverin hemen ardında duruyor. Dört maddi bir şeyi sabitledi; beş, sabitlenen o şeyin onu tutan kişiye geri yaptığıdır. Dolayısıyla bu kazara gelen bir kayıp değil, sonucun getirdiği bir kayıptır — getirdiğinden fazlasına mal olduğu ortaya çıkan mülk, nasıl kullanıldığının faturasını gönderen beden, sessizce yoksunluğa dönüşmüş oturmuş düzen. Papus'un maddi dünyası kesin ve duygusallıktan uzaktır; beş, onun pohpohlamayı bıraktığı yerdir.",
    "reversed": "Ters döndüğünde edilgen terim katlanılan bir şey olmaktan çıkar, karşılık verilen bir şeye dönüşür. Ters konumda bu, kabul edilmiş ve bu yüzden üzerinde çalışılabilir hâle gelmiş yoksunluk olarak okunur: borcun adı konmuş, yardım istenmiş, düzen daha fazla tüketmeden bozulmuş. Daha sert bir okumada ise bakılmayı reddeden aynı yoksulluktur — sürdürülen numara, açılmadan bırakılan hesaplar, dörtte başlamış bir dizinin bir terimi yerine kötü şans sanılan yoksunluk.",
    "inSpread": "Açılımın başında iş maddi bir açıktan başlar — sonraki her kartı ona verilen bir yanıt olarak okuyun. Karşıtlık konumunda Tılsım Beşlisi, soruyu soranın bütçesine koymadığı bedeldir. Denge konumunda yük olur: durum, birinin bir kaybı üstlenmesiyle bir arada tutulmaktadır. Sonuç olarak Papus'un sistemi açıktır — iş maddi dünyada sonuçlanır ve eksik sonuçlanır.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Tılsımlar: son He (ה), gerçekleştirici ilke, olguyu yaratan terim; bu takım Asiya'da, maddi dünyada etki eder; 5 sayısı: ikinci serinin He'si, gerçekleşene verilen edilgen tepki. Aşağıdaki anlam bu birleşimin okunuşudur (gerçekleştirici ilke, 5. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Tılsımlar — son He (ה), Asiya, maddi dünya"
      },
      {
        "label": "Takımın ilkesi",
        "value": "gerçekleştirici ilke, olguyu yaratan terim"
      },
      {
        "label": "Sayı",
        "value": "5 — ikinci serinin He'si"
      },
      {
        "label": "Sayının rolü",
        "value": "gerçekleşene verilen edilgen tepki"
      }
    ]
  },
  "pentacles-6": {
    "upright": "Beşten sonra yeniden kurulan denge; maddi dünyada denge ölçüyle yeniden kurulur: bir elde terazi, öbür elde sikkeler. Papus'un altıncı terimi beşinciyi onarır ve burada dağıtım yoluyla onarır — belirlenmiş bir oranda vermek ve almak. Teraziyi verenin tutması kartın bir parçasıdır. Bu, bir alışveriş olarak cömertliktir; bu bir eleştiri değildir, onu tekrarlanabilir kılan budur.",
    "reversed": "Oran vereni pohpohlayacak biçimde ayarlanmış — gideriyormuş gibi göründüğü farkı özenle koruyan bir dağıtım. Ya da terazi reddedilmiş: yardım önerilmiş ama kabul edilmemiş, çünkü koşullar ortadadır.",
    "inSpread": "Açılımın başında iş, belirlenmiş koşullarla verilen yardımla başlar. Karşıtlık konumunda hediye kılığına girmiş bir yükümlülük vardır. Denge konumunda durum, birinin bilinçli ölçüsüyle dengelenmektedir. Sonuç olarak: imkânlar el değiştirir, oranını başka birinin belirlediği biçimde.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Tılsımlar: son He (ה), gerçekleştirici ilke, olguyu yaratan terim; bu takım Asiya'da, maddi dünyada etki eder; 6 sayısı: ikinci serinin Vav'ı, yeni bir zeminde yeniden kurulan denge. Aşağıdaki anlam bu birleşimin okunuşudur (gerçekleştirici ilke, 6. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Tılsımlar — son He (ה), Asiya, maddi dünya"
      },
      {
        "label": "Takımın ilkesi",
        "value": "gerçekleştirici ilke, olguyu yaratan terim"
      },
      {
        "label": "Sayı",
        "value": "6 — ikinci serinin Vav'ı"
      },
      {
        "label": "Sayının rolü",
        "value": "yeni bir zeminde yeniden kurulan denge"
      }
    ]
  },
  "pentacles-7": {
    "upright": "İkinci mihver: biriken ama henüz alınmamış değerden oluşan bir gerçekleşme. Asma büyümüş, meyve üstünde, işçi aletine yaslanmış sayıyor. Papus'un yedinci terimi gerçekten gerçekleştirir — ürün gerçektir — ama aynı zamanda son serinin kararsız açılışıdır; bu yüzden kart tam da zamanlamaya dair bir kararın verilmesi gereken ve henüz verilmediği anda durur.",
    "reversed": "Ürün çok erken toplanmış ya da çok uzun bırakılmış. Ya da saymanın kendisi iş hâline gelmiş; değerlendirme hasadın yerini almış, çünkü değerlendirme başarısız olamaz.",
    "inSpread": "Açılımın başında iş, çoktan yapılmış ve henüz geri dönmemiş bir yatırımla başlar. Karşıtlık konumunda göründüğünden daha pahalıya patlayan bir gecikme vardır. Denge konumunda şey büyürken durum istikrarlıdır. Sonuç olarak: biriken değer — ve yedinci terim devreder, bu yüzden okuma getiride durmaz.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Tılsımlar: son He (ה), gerçekleştirici ilke, olguyu yaratan terim; bu takım Asiya'da, maddi dünyada etki eder; 7 sayısı: ikinci serinin son He'si ve üçüncü serinin Yod'u, son hareketi kendisi başlatan ikinci bir gerçekleşme. Aşağıdaki anlam bu birleşimin okunuşudur (gerçekleştirici ilke, 7. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Tılsımlar — son He (ה), Asiya, maddi dünya"
      },
      {
        "label": "Takımın ilkesi",
        "value": "gerçekleştirici ilke, olguyu yaratan terim"
      },
      {
        "label": "Sayı",
        "value": "7 — ikinci serinin son He'si ve üçüncü serinin Yod'u"
      },
      {
        "label": "Sayının rolü",
        "value": "son hareketi kendisi başlatan ikinci bir gerçekleşme"
      }
    ]
  },
  "pentacles-8": {
    "upright": "Yedinin ayaktaki ürününe edilgen yanıt: uygulama. Papus'un sekizinci terimi asla başlatmaz — karşılık verir; maddi dünyada biriken değere verilen karşılık, onu koruyan ve geliştiren tekrardır. Birbiri ardına basılan sekiz sikke. Buradaki beceri yetenek değildir; birbirinin aynı günlerin birikimidir ve kart, maddi dünyayı asıl üretenin bu olduğu konusunda hiç romantik değildir.",
    "reversed": "Dikkati kaybolmuş tekrar — sekizinci sikke birincinin aynısı, çünkü arada hiçbir şey öğrenilmemiş. Ya da zanaat, getirisinin kalmadığı noktanın ötesine kadar sürdürülmüş; incelik, teslim etmemenin bir yolu olarak kullanılmış.",
    "inSpread": "Açılımın başında iş istikrarlı bir çalışmayla başlar. Karşıtlık konumunda soruyu soranda eksik olan ve durumun gerektirdiği bir disiplin vardır. Denge konumunda şey, biri onu yapmayı sürdürdüğü için ayakta kalır. Sonuç olarak: olağan bedelle kazanılmış beceri.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Tılsımlar: son He (ה), gerçekleştirici ilke, olguyu yaratan terim; bu takım Asiya'da, maddi dünyada etki eder; 8 sayısı: üçüncü serinin He'si, bu gerçekleşmeye verilen edilgen yanıt. Aşağıdaki anlam bu birleşimin okunuşudur (gerçekleştirici ilke, 8. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Tılsımlar — son He (ה), Asiya, maddi dünya"
      },
      {
        "label": "Takımın ilkesi",
        "value": "gerçekleştirici ilke, olguyu yaratan terim"
      },
      {
        "label": "Sayı",
        "value": "8 — üçüncü serinin He'si"
      },
      {
        "label": "Sayının rolü",
        "value": "bu gerçekleşmeye verilen edilgen yanıt"
      }
    ]
  },
  "pentacles-9": {
    "upright": "Takımın son dengesi: tek başına sürdürülen yeterlilik. Duvarlı bahçe, eğitilmiş kuş, tek bir figür. Papus'un dokuzuncu terimi bir seriyi tamamlanmadan önce istikrara kavuşturur ve Asiya'da bu istikrar maddi bağımsızlıktır — yeterli, düzene konmuş ve kimseye hesap vermeyen. Kart, bahçenin işlenmiş, yalnızlığın seçilmiş olduğu konusunda kesindir; ikisi de okumanın bir rastlantısı değildir.",
    "reversed": "Duvarın bahçeden daha fazla iş görmesi — kapanmaya dönüşecek kadar daralmış güvenlik. Ya da sorgulanmamış bir şeye dayanan bir yeterlilik; böylece bağımsızlık yalnızca adda kalır.",
    "inSpread": "Açılımın başında iş güvenli ve kendi kendine yeten bir konumdan başlar. Karşıtlık konumunda hiçbir teklifin yerinden oynatamayacağı birinin bağımsızlığı vardır. Denge konumunda bu, takımın sahip olduğu en istikrarlı karttır. Sonuç olarak: yeterince, soruyu soranın kendi koşullarıyla elde tutulan.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Tılsımlar: son He (ה), gerçekleştirici ilke, olguyu yaratan terim; bu takım Asiya'da, maddi dünyada etki eder; 9 sayısı: üçüncü serinin Vav'ı, tamamlanmadan önceki son denge. Aşağıdaki anlam bu birleşimin okunuşudur (gerçekleştirici ilke, 9. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Tılsımlar — son He (ה), Asiya, maddi dünya"
      },
      {
        "label": "Takımın ilkesi",
        "value": "gerçekleştirici ilke, olguyu yaratan terim"
      },
      {
        "label": "Sayı",
        "value": "9 — üçüncü serinin Vav'ı"
      },
      {
        "label": "Sayının rolü",
        "value": "tamamlanmadan önceki son denge"
      }
    ]
  },
  "pentacles-10": {
    "upright": "Takım tükenmiştir ve maddi dünyada tamamlanmış bir takımın ürettiği şey bir mülktür: onu yaratan kişiden daha uzun yaşamış ve artık bir aileyi düzenleyen servet. Papus'un onuncu terimi aynı zamanda bir tohum olan bir tamamlanmadır ve miras tam olarak budur — tümüyle gerçekleşmiş ve devredilen madde. Tek bir avluda üç kuşak. Kartta hiçbir şey elde edilmekte değildir; içindeki her şey sürdürülmektedir.",
    "reversed": "Miras tartışmalı ya da düzen, onsuz daha iyi olacak insanları ayakta tutuyor. Ya da tamamlanma reddedilmiş — mülk devredilmemiş, bu yüzden takım kapanamıyor ve sonraki başlayamıyor.",
    "inSpread": "Açılımın başında iş, soruyu soranın kurmadığı yerleşik bir maddi düzenin içinde başlar. Karşıtlık konumunda herhangi bir bireysel plandan ağır basan bir aile ya da kurum düzenlemesi vardır. Denge konumunda her şey yerli yerinde ve kalıcıdır. Sonuç olarak: kalıcılık ve başka birinin serisinin başlangıcı.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Tılsımlar: son He (ה), gerçekleştirici ilke, olguyu yaratan terim; bu takım Asiya'da, maddi dünyada etki eder; 10 sayısı: üçüncü serinin son He'si, tam gerçekleşme — takım tükenmiştir ve ardından gelen takımın tohumudur. Aşağıdaki anlam bu birleşimin okunuşudur (gerçekleştirici ilke, 10. teriminde); Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Tılsımlar — son He (ה), Asiya, maddi dünya"
      },
      {
        "label": "Takımın ilkesi",
        "value": "gerçekleştirici ilke, olguyu yaratan terim"
      },
      {
        "label": "Sayı",
        "value": "10 — üçüncü serinin son He'si"
      },
      {
        "label": "Sayının rolü",
        "value": "tam gerçekleşme — takım tükenmiştir ve ardından gelen takımın tohumudur"
      }
    ]
  },
  "pentacles-page": {
    "upright": "Gerçekleştirici terim bir kişi olarak, gerçekleştirici takımın içinde — Papus'un en harfiyen kartı. Tılsım Prensi bir şeyi fiilî kılar: ilk pratik adım, çıraklık, harcanmak yerine incelenen sikke. İkiye katlanmış son He, onun hiçbir şeyi mecazen yapmadığı anlamına gelir. Yavaş, gösterişsiz ve takımda maddi dünyanın neye mal olduğunu hâlâ öğrenen tek figür.",
    "reversed": "Uygulamasız inceleme — sikke durmadan evirilip çevriliyor ve hiç kullanılmıyor. Ya da pratik adım incelemesiz atılmış; maddi dünya bunun bedelini hemen keser.",
    "inSpread": "Açılımın başında iş küçük, somut bir adımla başlar. Karşıtlık konumunda deneyimsizlik vardır — ki bu, yetersizlikle aynı şey değildir. Denge konumunda durum, biri temel işi yaptığı için ayakta kalır. Sonuç olarak: gerçek bir şey başlar, mütevazı biçimde.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Tılsımlar: son He (ה), gerçekleştirici ilke, olguyu yaratan terim; bu takım Asiya'da, maddi dünyada etki eder; Prens: son He, gerçekleştirici terimin cisimleşmiş hâli — takımın olguya indirilmesi. Aşağıdaki anlam bu birleşimin okunuşudur; Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Tılsımlar — son He (ה), Asiya, maddi dünya"
      },
      {
        "label": "Takımın ilkesi",
        "value": "gerçekleştirici ilke, olguyu yaratan terim"
      },
      {
        "label": "Rütbe",
        "value": "Prens — son He"
      },
      {
        "label": "Rütbenin rolü",
        "value": "gerçekleştirici terimin cisimleşmiş hâli — takımın olguya indirilmesi"
      }
    ]
  },
  "pentacles-knight": {
    "upright": "Dengeleyici terim bir kişi olarak, en yavaş takımı taşıyor — ve bu yüzden destenin en yavaş ve en güvenilir figürü. Atı hareketsizdir. Papus'un Vav'ı aktarır ve bu Şövalye sapmayarak aktarır: görev, bitene dek sabit bir hızla sürdürülür. Bilerek ilginç değildir. Maddi dünyada işe yarayan, ilginç olmayandır.",
    "reversed": "Atalete dönüşmüş süreklilik — görev değiştikten sonra da aynı hız sürdürülüyor. Ya da güvenilirlik, daha hızlı hareket etme yönündeki her isteğe karşı bir gerekçe olarak kullanılıyor; oysa bu isteklerin bazıları makuldür.",
    "inSpread": "Açılımın başında iş, istikrarla yapılan bir şeyle başlar. Karşıtlık konumunda hızlandırılamayan bir tempo vardır. Denge konumunda hiçbir şeyin aksamamasının nedeni odur. Sonuç olarak: iş tamamlanır, geç ve doğru biçimde.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Tılsımlar: son He (ה), gerçekleştirici ilke, olguyu yaratan terim; bu takım Asiya'da, maddi dünyada etki eder; Şövalye: Vav, dengeleyici terimin cisimleşmiş hâli — taşır, aktarır, arada gidip gelir. Aşağıdaki anlam bu birleşimin okunuşudur; Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Tılsımlar — son He (ה), Asiya, maddi dünya"
      },
      {
        "label": "Takımın ilkesi",
        "value": "gerçekleştirici ilke, olguyu yaratan terim"
      },
      {
        "label": "Rütbe",
        "value": "Şövalye — Vav"
      },
      {
        "label": "Rütbenin rolü",
        "value": "dengeleyici terimin cisimleşmiş hâli — taşır, aktarır, arada gidip gelir"
      }
    ]
  },
  "pentacles-queen": {
    "upright": "Maddi dünyanın içindeki alıcı ilke: kâhyalık. Tılsım Kraliçesi kaynakları alır ve onları verimli kılar — ev, toprak, biri her gün ilgilendiği için büyüyen iş. Papus'un He'si başlatmaz ve meselenin özü de budur: burada hiçbir şey icat edilmez, her şey özenle idare edilir. Şeyler ve insanlar üzerinde, ikisi arasında pek ayrım gözetmeden uygulanan pratik özen.",
    "reversed": "Yönetime dönüşmüş özen — her şeye bakılıyor, hiçbir şeyin kendi yönünü bulmasına izin verilmiyor. Ya da başka herkesin varlıklarına kâhyalık edip kendisininkine hiç etmemek; takım er geç bunun da fiyatını koyar.",
    "inSpread": "Açılımın başında iş birinin pratik özeninde başlar. Karşıtlık konumunda soruyu soranın yetkinliğine güvendiği ve hafife aldığı bir kişi vardır. Denge konumunda maddi tarafı işler durumda tutan odur. Sonuç olarak: şey büyütülür, sermayeyle değil dikkatle.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Tılsımlar: son He (ה), gerçekleştirici ilke, olguyu yaratan terim; bu takım Asiya'da, maddi dünyada etki eder; Kraliçe: He, takımın edilgen ilkesinin cisimleşmiş hâli — alır ve yansıtır. Aşağıdaki anlam bu birleşimin okunuşudur; Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Tılsımlar — son He (ה), Asiya, maddi dünya"
      },
      {
        "label": "Takımın ilkesi",
        "value": "gerçekleştirici ilke, olguyu yaratan terim"
      },
      {
        "label": "Rütbe",
        "value": "Kraliçe — He"
      },
      {
        "label": "Rütbenin rolü",
        "value": "takımın edilgen ilkesinin cisimleşmiş hâli — alır ve yansıtır"
      }
    ]
  },
  "pentacles-king": {
    "upright": "Maddi dünyanın içindeki etkin terim: kaynaklara hükmeden kişi. Papus'un Yod'u başlatır ve Asiya'da başlatmak, imkânları harekete geçirmek demektir — kurmak, finanse etmek, neyin inşa edileceğine karar vermek. Tılsım Kralı bir istifçi değildir; istifçilik kartı dörttür. Otoritesi şundadır: bir kaynağa yön verdiğinde o kaynak hareket eder ve maddi dünya kendini o yönün etrafında yeniden düzenler.",
    "reversed": "Birikimin kendisi için kullanılan hükmetme — imkânlar yalnızca başladıkları yerde biten çemberler içinde hareket ettiriliyor. Ya da yaratılmamış, miras alınmış kaynaklar üzerinde otorite; üstelik sonsuzmuş gibi harcanıyorlar.",
    "inSpread": "Açılımın başında iş, imkân sahibi biri öyle olması gerektiğine karar verdiği için başlar. Karşıtlık konumunda soruyu sorandan daha fazla kaynağa sahip bir çıkar vardır. Denge konumunda istikrarı finanse eden odur. Sonuç olarak: iş maddi olarak, imkânları kim denetliyorsa onun eliyle karara bağlanır.",
    "derivation": "Papus bu kart için ayrı bir açıklama vermez. Kart onun sisteminden türetilmiştir: Tılsımlar: son He (ה), gerçekleştirici ilke, olguyu yaratan terim; bu takım Asiya'da, maddi dünyada etki eder; Kral: Yod, takımın etkin ilkesinin cisimleşmiş hâli — başlatır. Aşağıdaki anlam bu birleşimin okunuşudur; Papus'tan bir alıntı değildir.",
    "correspondences": [
      {
        "label": "Takım",
        "value": "Tılsımlar — son He (ה), Asiya, maddi dünya"
      },
      {
        "label": "Takımın ilkesi",
        "value": "gerçekleştirici ilke, olguyu yaratan terim"
      },
      {
        "label": "Rütbe",
        "value": "Kral — Yod"
      },
      {
        "label": "Rütbenin rolü",
        "value": "takımın etkin ilkesinin cisimleşmiş hâli — başlatır"
      }
    ]
  }
};

export default tr;
