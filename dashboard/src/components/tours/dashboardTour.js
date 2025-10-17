

export const dashboardTourSteps = [

  {
    element: "#carbonCard",
    popover: {
      title: "Karbon Azalımı",
      description:
        "Yapay zekâ destekli enerji optimizasyonu sayesinde atmosfere salınmayan karbon miktarını gösterir. " +
        "Ton cinsinden ifade edilir ve yaklaşık olarak kaç ağacın yıllık karbon tutumuna denk geldiği hesaplanır.",
    },
  },


  {
    element: "#energyCard",
    popover: {
      title: "Enerji Tasarrufu",
      description:
        "Bu kart, yapay zekâ modelinin gerçekleştirdiği enerji verimliliği oranını gösterir. " +
        "Yüzde değeri genel tasarruf oranını, alt satır ise toplam tasarruf miktarını (kWh) belirtir.",
    },
  },


  {
    element: "#savingCard",
    popover: {
      title: "Ekonomik Kazanç",
      description:
        "Tasarruf edilen enerji miktarının parasal karşılığıdır. " +
        "Elektrik birim maliyeti (örnek: 5 TL/kWh) baz alınarak yıllık tahmini kazanç ₺ cinsinden hesaplanır. " +
        "Bu alan, enerji verimliliğinin işletme maliyetlerine etkisini gösterir.",
    },
  },


  {
    element: "#energyForecastCard",
    popover: {
      title: "Yıllık Enerji Tahmini",
      description:
        "Yapay zekâ modelinin öngördüğü yıllık toplam enerji tüketimini (kWh) gösterir. " +
        "Bu değer, paneldeki 27 baz istasyonunun toplam yıllık enerji tüketim tahminini temsil eder. " +
        "Gerçek tüketimle kıyaslanarak modelin doğruluğu analiz edilir.",
    },
  },


  {
    element: "#statusGrid",
    popover: {
      title: "Hücre Durumları",
      description:
        "Tüm baz istasyonlarının (cell) anlık çalışma durumlarını listeler. " +
        "Her hücre, Aktif, Uyku veya Uyarı modunda olabilir. " +
        "Bu tablo, sistemin genel enerji yönetimi performansını izlemene yardımcı olur.",
    },
  },


  {
    element: "#alertsPanel",
    popover: {
      title: "Uyarılar Paneli",
      description:
        "Enerji tüketiminde olağan dışı artışlar, düşük sinyal kalitesi veya model tahmin hataları bu bölümde görüntülenir. " +
        "Uyarılar, bakım veya yeniden optimizasyon gerektiren hücreleri hızlıca fark etmene yardımcı olur.",
    },
  },


  {
    element: "#policyTable",
    popover: {
      title: "Politika Tablosu",
      description:
        "Yapay zekâ modelinin uyguladığı enerji politikalarının listesidir. " +
        "Her hücrede hangi stratejinin (Enerji Azalt, Beklet, Artır) devrede olduğunu görebilirsin. " +
        "Bu tablo, modelin aldığı kararların mantığını anlamanı sağlar.",
    },
  },


  {
    element: "#simulationPanel",
    popover: {
      title: "Simülasyon Paneli",
      description:
        "Burada farklı sinyal ve yük senaryoları oluşturularak yapay zekâ modelinin tepkisi test edilir. " +
        "Gerçek sistemde uygulanmadan önce enerji politikalarının etkilerini simüle edebilirsin. " +
        "Bu sayede modelin karar doğruluğunu önceden gözlemlemek mümkün olur.",
    },
  },


  {
    element: "#policyChart",
    popover: {
      title: "Politika Performans Grafiği",
      description:
        "Zaman içinde enerji tüketimi ile uygulanan politikaların etkilerini görselleştirir. " +
        "Grafik, enerji tasarrufu trendlerini ve modelin performansını analiz etmene olanak sağlar.",
    },
  },


  {
    element: "#mapView",
    popover: {
      title: "Harita Görünümü",
      description:
        "Tüm baz istasyonlarının (cell) coğrafi konumlarını gösterir. " +
        "Renk kodları, her istasyonun enerji verimliliği seviyesini temsil eder. " +
        "Bu sayede yüksek enerji tüketen bölgeler kolayca tespit edilebilir.",
    },
  },


  {
    popover: {
      title: "Tebrikler!",
      description:
        "5G Enerji Optimizasyonu Paneli turunu tamamladın. Artık tüm bileşenlerin işlevini biliyorsun! " +
        "İstersen üst menüden 'Paneli Tanıt' butonuna tıklayarak rehberi tekrar başlatabilirsin.",
    },
  },
];
