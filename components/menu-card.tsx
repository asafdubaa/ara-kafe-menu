"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronUp, X, MapPin, Instagram, Globe, Phone } from "lucide-react"
import { cn } from "@/lib/utils"
import styles from "./menu-card.module.css"

// Categories and titles are now dynamic

export function MenuCard() {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  const [activeLanguage, setActiveLanguage] = useState<"en" | "tr">("tr")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showStory, setShowStory] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [menuData, setMenuData] = useState<Record<string, MenuItem[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  interface MenuItem {
    name_en: string
    name_tr: string
    description_en: string
    description_tr: string
    ingredients_en?: string
    ingredients_tr?: string
    price: string
  }

  // Dynamic refs map for categories
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [categoryTitles, setCategoryTitles] = useState<Record<string, { en: string; tr: string }>>({})

  useEffect(() => {
    const fetchMenuData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const [menuRes, titlesRes] = await Promise.all([
          fetch('/api/menu'),
          fetch('/api/menu/titles')
        ])
        if (!menuRes.ok) {
          throw new Error(`HTTP error! status: ${menuRes.status}`)
        }
        const data = await menuRes.json()
        setMenuData(data)
        // Initialize expansion map for dynamic categories
        const initExpanded: Record<string, boolean> = {}
        Object.keys(data || {}).forEach((k) => { initExpanded[k] = false })
        setExpandedCategories(initExpanded)
        if (titlesRes.ok) {
          const titles = await titlesRes.json()
          setCategoryTitles(titles || {})
        }
        
        // Also save to localStorage as fallback
        try {
          localStorage.setItem("araKafeMenuData", JSON.stringify(data))
        } catch (e) {
          console.warn("Failed to save menu data to localStorage:", e)
        }
      } catch (err) {
        console.error("Error fetching menu data:", err)
        setError("Failed to load menu. Trying fallback...")
        
        // Try to load from localStorage as fallback
        try {
          const savedData = localStorage.getItem("araKafeMenuData")
          if (savedData) {
            setMenuData(JSON.parse(savedData))
            setError(null)
          } else {
            // Final fallback to default data
            const defaultData = await import("@/data/menu-data.json")
            setMenuData(defaultData.default)
          }
        } catch (fallbackError) {
          console.error("Fallback data loading failed:", fallbackError)
          setError("Failed to load menu. Please refresh the page or try again later.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenuData()
  }, [])

  if (isLoading || Object.keys(menuData).length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-amber-50 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-900 mx-auto mb-4"></div>
          <p className="text-amber-900">Loading menu...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-amber-50 p-4">
        <div className="text-center max-w-md">
          <div className="text-amber-700 bg-amber-100 p-4 rounded-lg mb-4">
            <p className="font-medium">⚠️ {error}</p>
            {error.includes("trying fallback") && (
              <p className="text-sm mt-2">Showing last saved version of the menu.</p>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-amber-800 text-white rounded-md hover:bg-amber-900 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  const scrollToCategory = (category: string) => {
    // Set the active category
    setActiveCategory(category)

    // Expand the category if it's not already expanded
    if (!expandedCategories[category]) {
      setExpandedCategories((prev) => ({
        ...prev,
        [category]: true,
      }))
    }

    // Scroll to the category with a small delay to allow expansion
    setTimeout(() => {
      const target = categoryRefs.current[category]
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    }, 100)
  }

  return (
    <div className="max-w-3xl w-full mx-auto">
      <div className="relative border-4 border-double border-amber-950/40 rounded-lg p-8 bg-[#f5e8c9] shadow-lg">
        {/* Texture overlay for old paper effect */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Header */}
        <div className="text-center mb-8 relative">
          <h1 className="text-5xl font-serif text-amber-950 mb-2">Ara Kafe</h1>
          <h2 className="text-2xl font-serif text-amber-950 mb-4">Taksim</h2>

          {/* Lines and dot */}
          <div className="relative flex justify-center items-center mb-10 mt-2">
            <div className="h-px bg-amber-950/60 w-full"></div>
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
              <span className="w-4 h-4 rounded-full border border-amber-950/60 bg-[#f5e8c9] block"></span>
            </div>
            {/* Overlayed buttons */}
            <div className="absolute inset-0 flex justify-between items-center pointer-events-none">
              <div className="flex-1 flex justify-end">
                <button
                  onClick={() => setShowStory(true)}
                  className="pointer-events-auto relative z-10 px-4 py-2 border border-amber-950 text-amber-950 rounded-md font-serif text-sm hover:bg-amber-950/10 transition-colors bg-[#f5e8c9] shadow"
                  style={{ marginRight: "1.5rem" }}
                >
                  {activeLanguage === "en" ? "Our Story" : "Hikayemiz"}
                </button>
              </div>
              <div className="flex-1 flex justify-start">
                <button
                  onClick={() => setShowContact(true)}
                  className="pointer-events-auto relative z-10 px-4 py-2 border border-amber-950 text-amber-950 rounded-md font-serif text-sm hover:bg-amber-950/10 transition-colors bg-[#f5e8c9] shadow"
                  style={{ marginLeft: "1.5rem" }}
                >
                  {activeLanguage === "en" ? "Contact" : "İletişim"}
                </button>
              </div>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="mt-4 inline-flex rounded-md overflow-hidden border border-amber-950/40">
            <button
              onClick={() => setActiveLanguage("en")}
              className={`px-4 py-1 ${activeLanguage === "en" ? "bg-amber-950 text-[#f5e8c9]" : "bg-[#f5e8c9] text-amber-950 hover:bg-amber-100"}`}
            >
              English
            </button>
            <button
              onClick={() => setActiveLanguage("tr")}
              className={`px-4 py-1 ${activeLanguage === "tr" ? "bg-amber-950 text-[#f5e8c9]" : "bg-[#f5e8c9] text-amber-950 hover:bg-amber-100"}`}
            >
              Türkçe
            </button>
          </div>

          {/* Navigation Bar */}
          <div className="mt-6 border-t border-b border-amber-950/30 py-3">
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-amber-950/80">
              {Object.keys(menuData).map((key) => (
                <button key={key} onClick={() => scrollToCategory(key)}>
                  {getCategoryNavLabel(key, activeLanguage, categoryTitles)}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Menu Categories */}
        <div className="space-y-6">
          {Object.entries(menuData).map(([categoryKey, items]) => (
            <div key={categoryKey} ref={(el) => { categoryRefs.current[categoryKey] = el }}>
              <CategorySection
                title={getCategoryTitle(categoryKey, activeLanguage, categoryTitles)}
                items={items}
                isExpanded={Boolean(expandedCategories[categoryKey])}
                onToggle={() => toggleCategory(categoryKey)}
                activeLanguage={activeLanguage}
              />
            </div>
          ))}
        </div>

        {/* Contact Bar */}
        <div className="mt-10 pt-6 border-t border-amber-950/30">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-950" />
              <span className="text-sm text-amber-950">Tomtom, Ara Güler Sokağı No:2, 34433 Beyoğlu/İstanbul</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com/arakafe"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-amber-950 hover:text-amber-800"
              >
                <Instagram className="h-4 w-4" />
                <span className="text-sm">@arakafe</span>
              </a>
              <a
                href="https://arakafe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-amber-950 hover:text-amber-800"
              >
                <Globe className="h-4 w-4" />
                <span className="text-sm">arakafe.com</span>
              </a>
              <a href="tel:+902122456565" className="flex items-center gap-1 text-amber-950 hover:text-amber-800">
                <Phone className="h-4 w-4" />
                <span className="text-sm">+90 212 245 41 05</span>
              </a>
            </div>
          </div>
        </div>

        {/* Our Story Modal */}
        {showStory && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-[#f5e8c9] border-4 border-double border-amber-950/40 rounded-lg p-8 shadow-xl">
              {/* Texture overlay for old paper effect */}
              <div
                className="absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
              />

              <button
                onClick={() => setShowStory(false)}
                className="absolute top-4 right-4 text-amber-950 hover:text-amber-800"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Ara Güler Photo */}
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-amber-950/40">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ara-Gu%CC%88ler.jpg-OyUFvZdR8mCyqHkRntlmYwreyvsrpY.jpeg"
                    alt="Ara Güler"
                    className="w-full h-full object-cover grayscale"
                  />
                </div>
              </div>

              <h2 className="text-3xl font-serif text-amber-950 text-center mb-4">
                {activeLanguage === 'en' ? 'Ara Güler – The Eye of Istanbul' : 'Ara Güler – İstanbul\'un Gözü'}
              </h2>

              <p className="text-xl italic text-amber-950 text-center mb-6">
                {activeLanguage === 'en' 
                  ? '"Istanbul\'s soul is in its stories, and every story begins at a table."'
                  : '"İstanbul\'un ruhu hikayelerindedir ve her hikaye bir masada başlar."'}
              </p>

              <p className="text-lg text-amber-950 text-center mb-8">
                {activeLanguage === 'en'
                  ? 'Ara Kafe is inspired by the legendary photographer Ara Güler, whose lens captured the heart of Istanbul. Our cafe is a tribute to his vision, artistry, and love for the city\'s vibrant life.'
                  : 'Ara Kafe, objektifiyle İstanbul\'un kalbini yakalayan efsanevi fotoğrafçı Ara Güler\'den ilham alıyor. Kafemiz, onun vizyonuna, sanatına ve şehrin canlı yaşamına olan sevgisine bir saygı duruşudur.'}
              </p>

              <div className="mb-8">
                <h3 className="text-xl font-serif text-amber-950 mb-3">Ara Kafe</h3>
                <div className="w-full h-64 bg-amber-100/50 rounded overflow-hidden">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/kafeara.jpg-8O4FVt69CCO3fVH8umg9vGBRCC0l2U.jpeg"
                    alt={activeLanguage === 'en' ? 'Ara Kafe Interior' : 'Ara Kafe İç Mekanı'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-amber-950/70 mt-2 italic text-center">
                  {activeLanguage === 'en'
                    ? 'The interior of Ara Kafe, featuring Ara Güler\'s iconic photographs of Istanbul'
                    : 'Ara Kafe\'nin iç mekanı, Ara Güler\'in İstanbul\'un ikonik fotoğraflarıyla süslenmiş'}
                </p>
              </div>

              <p className="text-lg text-amber-950 text-center">
                {activeLanguage === 'en'
                  ? 'Step inside Ara Kafe, where the spirit of Istanbul and the legacy of Ara Güler come alive in every detail – from the carefully curated photographs on our walls to the authentic flavors of our menu.'
                  : 'Ara Kafe\'ye adım atın, İstanbul\'un ruhu ve Ara Güler\'in mirası, duvarlarımızdaki özenle seçilmiş fotoğraflardan menümüzün otantik lezzetlerine kadar her detayda hayat buluyor.'}
              </p>

              <div className="mt-8 pt-6 border-t border-amber-950/30">
                <h3 className="text-xl font-serif text-amber-950 mb-4 text-center">
                  {activeLanguage === 'en' ? 'About Ara Güler' : 'Ara Güler Hakkında'}
                </h3>
                <p className="text-base text-amber-950 mb-4">
                  {activeLanguage === 'en'
                    ? 'Ara Güler (1928-2018) was Turkey\'s most renowned photographer, nicknamed "The Eye of Istanbul" for his poignant black and white images that captured the city\'s soul. His work chronicled the daily life, cultural landscape, and architectural heritage of Istanbul from the 1950s onwards.'
                    : 'Ara Güler (1928-2018), şehrin ruhunu yakalayan dokunaklı siyah beyaz fotoğrafları nedeniyle "İstanbul\'un Gözü" lakabıyla anılan, Türkiye\'nin en ünlü fotoğrafçısıydı. Çalışmaları, 1950\'lerden itibaren İstanbul\'un günlük yaşamını, kültürel manzarasını ve mimari mirasını belgeledi.'}
                </p>
                <p className="text-base text-amber-950">
                  {activeLanguage === 'en'
                    ? 'As a photojournalist for Magnum Photos, Güler photographed many notable figures including Salvador Dalí, Pablo Picasso, and Alfred Hitchcock. His photographs remain an invaluable record of mid-20th century Istanbul, preserving moments and places that have since been transformed by modernization.'
                    : 'Magnum Photos için foto muhabirliği yapan Güler, Salvador Dalí, Pablo Picasso ve Alfred Hitchcock gibi birçok önemli ismi fotoğrafladı. Fotoğrafları, 20. yüzyıl ortası İstanbul\'unun modernleşmeyle değişen anlarını ve mekanlarını koruyan paha biçilmez bir belge niteliğindedir.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contact Modal */}
        {showContact && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-md w-full bg-[#f5e8c9] border-4 border-double border-amber-950/40 rounded-lg p-8 shadow-xl">
              {/* Texture overlay for old paper effect */}
              <div
                className="absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
              />

              <button
                onClick={() => setShowContact(false)}
                className="absolute top-4 right-4 text-amber-950 hover:text-amber-800"
              >
                <X className="h-6 w-6" />
              </button>

              <h2 className="text-3xl font-serif text-amber-950 text-center mb-6">Contact Us</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-amber-950 mt-1" />
                  <div>
                    <h3 className="font-medium text-amber-950">Address</h3>
                    <p className="text-amber-950">Tomtom, Ara Güler Sokağı No:2, 34433 Beyoğlu/İstanbul</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-amber-950 mt-1" />
                  <div>
                    <h3 className="font-medium text-amber-950">Phone</h3>
                    <p className="text-amber-950">+90 212 245 41 05</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Instagram className="h-5 w-5 text-amber-950 mt-1" />
                  <div>
                    <h3 className="font-medium text-amber-950">Instagram</h3>
                    <a
                      href="https://instagram.com/arakafe"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-950 underline"
                    >
                      @arakafe
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-amber-950 mt-1" />
                  <div>
                    <h3 className="font-medium text-amber-950">Website</h3>
                    <a
                      href="https://arakafe.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-950 underline"
                    >
                      arakafe.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-amber-950/30">
                <h3 className="font-medium text-amber-950 mb-2">Opening Hours</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-amber-950">Monday - Sunday</p>
                  </div>
                  <div>
                    <p className="text-amber-950">09:00 - 23:30</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface CategorySectionProps {
  title: string
  items: {
    name_en: string
    name_tr: string
    description_en: string
    description_tr: string
    ingredients_en?: string
    ingredients_tr?: string
    price: string
  }[]
  isExpanded: boolean
  onToggle: () => void
  activeLanguage: "en" | "tr"
}

function CategorySection({ title, items, isExpanded, onToggle, activeLanguage }: CategorySectionProps) {
  // Function to clean HTML tags from text
  const cleanHtml = (text: string) => {
    if (!text) return '';
    return text.replace(/<[^>]*>?/gm, '').trim();
  };

  // Function to extract and format dietary indicators
  const getFormattedName = (name: string, ingredients?: string) => {
    // Clean the name of any HTML tags
    const cleanName = cleanHtml(name);
    
    if (!ingredients) return cleanName;
    
    // Clean the ingredients and look for dietary indicators
    const cleanIngredients = cleanHtml(ingredients);
    const match = cleanIngredients.match(/\((V[gt]\/?V?[gt]?)\)/i);
    if (!match) return cleanName;
    
    const indicator = match[1].toUpperCase();
    return (
      <div className="inline-flex items-center">
        <span>{cleanName}</span>
        <span className="ml-2 text-xs font-normal bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
          {indicator}
        </span>
      </div>
    );
  };

  return (
    <div className="relative">
      <button 
        onClick={onToggle} 
        className="w-full flex justify-between items-center border-b border-amber-950/30 pb-2 hover:bg-amber-50/50 px-2 -mx-2 rounded"
      >
        <h2 className="text-2xl font-serif text-amber-950">{title}</h2>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-amber-950" />
        ) : (
          <ChevronDown className="h-5 w-5 text-amber-950" />
        )}
      </button>

      <div
        className={cn(
          "grid gap-4 transition-all duration-300 ease-in-out overflow-hidden",
          isExpanded ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0">
          {items.map((item, index) => {
            const name = activeLanguage === "en" ? item.name_en : item.name_tr;
            const ingredients = activeLanguage === "en" ? item.ingredients_en : item.ingredients_tr;
            const description = activeLanguage === "en" ? item.description_en : item.description_tr;
            
            return (
              <div key={index} className="mb-6 last:mb-0 group">
                <div className="flex justify-between items-baseline">
                  <div className="flex items-baseline">
                    <h3 className="text-xl font-medium text-amber-950">
                      {getFormattedName(name, ingredients)}
                    </h3>
                  </div>
                  <div className="border-b border-dotted border-amber-950/40 flex-grow mx-2 group-hover:border-amber-950/60 transition-colors"></div>
                  <span className="text-xl font-medium text-amber-950 whitespace-nowrap">
                    {item.price.replace(/\s*TL\s*$/i, "")} TL
                  </span>
                </div>
                {description && (
                  <p className="text-amber-950/80 italic mt-1">
                    {description}
                  </p>
                )}
                {ingredients && (
                  <p className="text-amber-950/70 text-sm mt-1">
                    {cleanHtml(ingredients).replace(/\(.*?\)/g, '').trim()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}

const getCategoryTitle = (
  categoryKey: string,
  language: "en" | "tr",
  titles: Record<string, { en: string; tr: string }>
) => {
  const t = titles[categoryKey]
  if (t) return (t[language] || t.en || categoryKey).toUpperCase()
  // Fallback to default known titles for sections
  const defaults: Record<string, { en: string; tr: string }> = {
    breakfast: { en: "BREAKFAST", tr: "KAHVALTI" },
    salads: { en: "SALADS", tr: "SALATALAR" },
    snacks: { en: "SNACKS", tr: "ATIŞTIRMALIKLAR" },
    pastas: { en: "PASTAS", tr: "MAKARNALAR" },
    mainDishes: { en: "MAIN DISHES", tr: "ANA YEMEKLER" },
    desserts: { en: "DESSERTS", tr: "TATLILAR" },
    coldBeverages: { en: "COLD BEVERAGES", tr: "SOĞUK İÇECEKLER" },
    coffee: { en: "COFFEE", tr: "KAHVE" },
    tea: { en: "TEA", tr: "ÇAY" },
  }
  const d = defaults[categoryKey]
  if (d) return (d[language] || d.en).toUpperCase()
  return categoryKey.toUpperCase()
}

const getCategoryNavLabel = (
  categoryKey: string,
  language: "en" | "tr",
  titles: Record<string, { en: string; tr: string }>
) => {
  // Prefer custom titles without forced uppercase for nav
  const t = titles[categoryKey]
  if (t) return t[language] || t.en || categoryKey
  // Fallback defaults (human-readable for nav)
  const defaults: Record<string, { en: string; tr: string }> = {
    breakfast: { en: "Breakfast", tr: "Kahvaltı" },
    salads: { en: "Salads", tr: "Salatalar" },
    snacks: { en: "Snacks", tr: "Atıştırmalıklar" },
    pastas: { en: "Pastas", tr: "Makarnalar" },
    mainDishes: { en: "Main Dishes", tr: "Ana Yemekler" },
    desserts: { en: "Desserts", tr: "Tatlılar" },
    coldBeverages: { en: "Cold Beverages", tr: "Soğuk İçecekler" },
    coffee: { en: "Coffee", tr: "Kahve" },
    tea: { en: "Tea", tr: "Çay" },
  }
  const d = defaults[categoryKey]
  return d ? (d[language] || d.en) : categoryKey
}
