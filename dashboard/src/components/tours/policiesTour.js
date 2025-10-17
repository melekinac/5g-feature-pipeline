export const policiesTourSteps = [
  {
    element: "#latestPolicyPanel",
    popover: {
      title: "Politika Aksiyon Paneli",
      description:
        "Bu panel, sistemin son enerji politikası kararlarını listeler. " +
        "Her karar bir hücrede yapılan değişikliği temsil eder.",
    },
  },
  {
    element: "#latestPolicyTitle",
    popover: {
      title: "Panel Başlığı",
      description:
        "Başlık, bu panelin yapay zekâ tarafından verilen aksiyonları gösterdiğini belirtir.",
    },
  },
  {
    element: "#latestPolicyList",
    popover: {
      title: "Aksiyon Listesi",
      description:
        "Her satırda hücre numarası, karar zamanı, uygulanan aksiyon ve performans etiketi bulunur.",
    },
  },
  {
    element: "#policyAction-0",
    popover: {
      title: "Uygulanan Aksiyon",
      description:
        "Bu örnekte sistem 'Artır', 'Azalt' veya 'Bekle' kararı almıştır. " +
        "Karar, hücrenin enerji tüketim trendine göre verilir.",
    },
  },
  {
    element: "#policyLabel-0",
    popover: {
      title: "Performans Etiketi",
      description:
        "Her hücre bir performans etiketiyle değerlendirilir. " +
        "Renkler seviyeyi gösterir: Yeşil = Mükemmel, Kırmızı = Çok Zayıf.",
    },
  },
  {
    element: "#policyModal",
    popover: {
      title: "Detay Görünümü",
      description:
        "Bir satıra tıkladığında açılan bu pencerede kararın nedeni ve ek veriler görüntülenir.",
    },
  },
];
