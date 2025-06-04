"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, Plus, EyeOff, Trash2, Edit, LogOut } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import menuDataJson from "@/data/menu-data.json"

const categoryTitles: Record<string, string> = {
  breakfast: "Breakfast",
  main_courses: "Main Courses",
  appetizers: "Appetizers",
  desserts: "Desserts",
  drinks: "Drinks",
  // Add more categories as needed
}

type MenuItem = {
  name_en: string
  description_en: string
  ingredients_en?: string
  name_tr: string
  description_tr: string
  ingredients_tr?: string
  price: string
}

type MenuData = {
  [key: string]: MenuItem[]
}

type EditingItem = {
  category: string
  index: number
  item: MenuItem
}

// Utility functions
const cleanNameForDisplay = (name: string): string => {
  if (!name) return '';
  return name.replace(/<[^>]*>?/gm, '').trim();
};

const cleanText = (text: string): string => {
  if (!text) return '';
  return text.replace(/<[^>]*>?/gm, '').trim();
};

const formatName = (name: string): string => {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const cleanPrice = (price: string): string => {
  if (!price) return '0';
  // Remove any non-numeric characters except decimal point
  const numericValue = price.replace(/[^0-9.]/g, '');
  // Ensure there's at most one decimal point
  const parts = numericValue.split('.');
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join('')}`;
  }
  return numericValue || '0';
};

const formatPrice = (price: string): string => {
  const cleaned = cleanPrice(price);
  return cleaned ? `${cleaned} TL` : '0 TL';
};

export default function AdminPage() {
  const router = useRouter()
  const [menuData, setMenuData] = useState<MenuData>(() => {
    // Initialize with empty data structure to prevent undefined errors
    const initialData: MenuData = {}
    Object.keys(menuDataJson).forEach(category => {
      initialData[category] = []
    })
    return initialData
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null)
  const [newItem, setNewItem] = useState<MenuItem>({
    name_en: "",
    description_en: "",
    ingredients_en: "",
    name_tr: "",
    description_tr: "",
    ingredients_tr: "",
    price: ""
  })

  // Get admin password from environment variables
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || ''
  
  if (!adminPassword) {
    console.error('NEXT_PUBLIC_ADMIN_PASSWORD is not set in environment variables')
    setError('Server configuration error. Please contact support.')
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      if (response.ok) {
        setIsAuthenticated(false)
        router.push('/admin/login')
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleLogin = async (e: React.FormEvent, password: string) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setIsAuthenticated(true)
        router.push('/admin')
      } else {
        setError(data.message || 'Authentication failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An error occurred during login. Please try again.')
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check auth status from the server
        const response = await fetch('/api/auth/check')
        const { isAuthenticated } = await response.json()
        
        if (!isAuthenticated) {
          router.push('/admin/login')
          return
        }
        
        setIsAuthenticated(true)
        
        // Load menu data after successful auth
        const savedMenuData = localStorage.getItem("araKafeMenuData")
        if (savedMenuData) {
          try {
            const parsedData = JSON.parse(savedMenuData)
            setMenuData(parsedData)
          } catch (error) {
            console.error("Error loading saved menu data:", error)
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/admin/login')
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const categoryTitles = {
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

  const handleAddItem = () => {
    if (!selectedCategory) return;
    
    // Clean the fields
    const itemToAdd: MenuItem = {
      name_en: cleanNameForDisplay(newItem.name_en),
      description_en: cleanText(newItem.description_en),
      ingredients_en: newItem.ingredients_en || undefined,
      name_tr: cleanNameForDisplay(newItem.name_tr),
      description_tr: cleanText(newItem.description_tr),
      ingredients_tr: newItem.ingredients_tr || undefined,
      price: cleanPrice(newItem.price) || '0',
    };

    const categoryItems = [...(menuData[selectedCategory] || []), itemToAdd]
    setMenuData({
      ...menuData,
      [selectedCategory]: categoryItems,
    })

    resetForm()
    setShowAddDialog(false)
    setSelectedCategory("")
  }

  const cleanPrice = (price: string): string => {
    // Remove any existing 'TL' and trim whitespace
    return price.toString().replace(/\s*TL\s*$/i, '').trim();
  };

  const formatPrice = (price: string): string => {
    const cleaned = cleanPrice(price);
    return cleaned ? `${cleaned} TL` : '0 TL';
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;

    const updatedMenuData = { ...menuData };
    // Ensure we have a valid category and index
    if (updatedMenuData[editingItem.category] && 
        editingItem.index >= 0 && 
        editingItem.index < updatedMenuData[editingItem.category].length) {
      
      // Clean the item data
      const cleanItem = {
        ...editingItem.item,
        name_en: cleanNameForDisplay(editingItem.item.name_en),
        description_en: cleanText(editingItem.item.description_en),
        name_tr: cleanNameForDisplay(editingItem.item.name_tr),
        description_tr: cleanText(editingItem.item.description_tr),
        price: cleanPrice(editingItem.item.price) || '0',
      };
      
      // Create the final item to save
      const updatedItem: MenuItem = cleanItem;
      
      updatedMenuData[editingItem.category][editingItem.index] = updatedItem;
      setMenuData(updatedMenuData);
      setShowEditDialog(false);
    } else {
      setError('Invalid item or category for update');
    }
  }

  const handleEdit = (category: string, index: number) => {
    const item = menuData[category][index];
    setEditingItem({ 
      category, 
      index, 
      item: { 
        ...item,
        price: cleanPrice(item.price)
      } 
    });
    setShowEditDialog(true);
  }

  const handleDeleteItem = (category: string, index: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      const updatedMenuData = { ...menuData }
      updatedMenuData[category].splice(index, 1)
      setMenuData(updatedMenuData)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewItem((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingItem) return;

    setEditingItem({
      ...editingItem,
      item: {
        ...editingItem.item,
        [e.target.name]: e.target.value,
      },
    });
  };

  const resetForm = () => {
    setNewItem({
      name_en: "",
      description_en: "",
      ingredients_en: "",
      name_tr: "",
      description_tr: "",
      ingredients_tr: "",
      price: ""
    });
  };

  // Function to clean menu item data
  const cleanMenuItem = (item: MenuItem): MenuItem => {
    return {
      name_en: cleanNameForDisplay(item.name_en),
      name_tr: cleanNameForDisplay(item.name_tr),
      description_en: cleanText(item.description_en || ''),
      description_tr: cleanText(item.description_tr || ''),
      ingredients_en: item.ingredients_en || '',
      ingredients_tr: item.ingredients_tr || '',
      price: cleanPrice(item.price) || '0'
    };
  };

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      
      const cleanMenuData: MenuData = {};
      Object.keys(menuData).forEach(category => {
        cleanMenuData[category] = menuData[category].map(item => ({
          name_en: cleanNameForDisplay(item.name_en),
          name_tr: cleanNameForDisplay(item.name_tr),
          description_en: cleanText(item.description_en),
          description_tr: cleanText(item.description_tr),
          ingredients_en: item.ingredients_en || undefined,
          ingredients_tr: item.ingredients_tr || undefined,
          price: item.price,
        }));
      });
      
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanMenuData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save menu data')
      }
      
      const result = await response.json()
      
      if (result.success) {
        // Show success message
        setSaveStatus({ 
          type: 'success', 
          message: result.message || `✅ Menu data saved to ${result.storageLocation || 'storage'} successfully!`
        });
        
        // Update local state with cleaned data
        setMenuData(cleanMenuData);
      } else {
        setSaveStatus({ 
          type: 'error', 
          message: result.message || 'Failed to save menu data' 
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setSaveStatus({ type: 'error', message: errorMessage })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5e8c9] p-4">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-950 mb-4"></div>
          <div className="text-2xl font-serif text-amber-950">Loading...</div>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return null // Will be redirected by the effect
  }

  return (
    <div className="min-h-screen bg-[#f5e8c9] p-4">
      {/* Texture overlay for old paper effect */}
      <div
        className="fixed inset-0 opacity-10 pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 p-6 border-4 border-double border-amber-950/40 rounded-lg bg-[#f5e8c9] shadow-lg">
          <div>
            <h1 className="text-4xl font-serif text-amber-950">Ara Kafe Admin</h1>
            <p className="text-amber-950/70">Menu Management System</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="bg-green-700 text-white hover:bg-green-800 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
              {saveStatus.type && (
                <div className={`text-sm ${saveStatus.type === 'success' ? 'text-green-600' : 'text-red-600'} ml-2`}>
                  {saveStatus.message}
                </div>
              )}
            </div>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="border-amber-950 text-amber-950 flex items-center gap-2"
            >
              <EyeOff className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="border-4 border-double border-amber-950/40 rounded-lg p-6 bg-[#f5e8c9] shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif text-amber-950">Menu Categories</h2>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-amber-950 text-[#f5e8c9] hover:bg-amber-900">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-[#f5e8c9] border-4 border-double border-amber-950/40">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-serif text-amber-950">Add New Menu Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="border-amber-950/40">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(categoryTitles).map((category) => (
                        <SelectItem key={category} value={category}>
                          {categoryTitles[category as keyof typeof categoryTitles].en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-amber-950">Name (English)</label>
                      <Input
                        value={newItem.name_en}
                        onChange={handleInputChange}
                        name="name_en"
                        className="border-amber-950/40"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-amber-950">Name (Turkish)</label>
                      <Input
                        value={newItem.name_tr}
                        onChange={handleInputChange}
                        name="name_tr"
                        className="border-amber-950/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-amber-950">Description (English)</label>
                      <Textarea
                        value={newItem.description_en}
                        onChange={handleInputChange}
                        name="description_en"
                        className="border-amber-950/40"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-amber-950">Description (Turkish)</label>
                      <Textarea
                        value={newItem.description_tr}
                        onChange={handleInputChange}
                        name="description_tr"
                        className="border-amber-950/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-amber-950">Ingredients (English)</label>
                      <Input
                        value={newItem.ingredients_en}
                        onChange={handleInputChange}
                        name="ingredients_en"
                        className="border-amber-950/40"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-amber-950">Ingredients (Turkish)</label>
                      <Input
                        value={newItem.ingredients_tr}
                        onChange={handleInputChange}
                        name="ingredients_tr"
                        className="border-amber-950/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-amber-950">Price</label>
                    <div className="relative">
                      <Input
                        value={cleanPrice(newItem.price)}
                        onChange={handleInputChange}
                        name="price"
                        placeholder="e.g., 250"
                        className="border-amber-950/40 pl-3 pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-amber-950/60">
                        TL
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddItem} className="bg-amber-950 text-[#f5e8c9]">
                      Add Item
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue={Object.keys(menuData)[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 bg-amber-950/10">
              {Object.keys(menuData).map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="text-xs data-[state=active]:bg-amber-950 data-[state=active]:text-[#f5e8c9]"
                >
                  {categoryTitles[category as keyof typeof categoryTitles]?.en || category}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(menuData).map(([category, items]) => (
              <TabsContent key={category} value={category} className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-serif text-amber-950 border-b border-amber-950/30 pb-2">
                    {categoryTitles[category as keyof typeof categoryTitles]?.en || category} ({items.length} items)
                  </h3>

                  {items.map((item, index) => (
                    <Card key={index} className="border-amber-950/40 bg-[#f5e8c9]/50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex justify-between items-baseline mb-2">
                              <h4 className="text-lg font-medium text-amber-950">
                                {formatName(item.name_en)}
                              </h4>
                              <span className="text-lg font-medium text-amber-950">{item.price}</span>
                            </div>
                            <p className="text-amber-950/80 text-sm mb-1">
                              {item.description_en.replace(/<[^>]*>?/gm, '').trim()}
                            </p>
                            {item.ingredients_en && (
                              <p className="text-amber-950/60 text-xs">
                                {item.ingredients_en.replace(/\([^)]*\)/g, '').trim()}
                              </p>
                            )}
                            <div className="mt-2 pt-2 border-t border-amber-950/20">
                              <h5 className="text-sm font-medium text-amber-950">
                                {formatName(item.name_tr)}
                              </h5>
                              <p className="text-amber-950/80 text-xs">
                                {item.description_tr.replace(/<[^>]*>?/gm, '').trim()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(category, index)}
                              className="border-amber-950/40 text-amber-950"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteItem(category, index)}
                              className="border-red-400 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl bg-[#f5e8c9] border-4 border-double border-amber-950/40">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif text-amber-950">Edit Menu Item</DialogTitle>
            </DialogHeader>
            {editingItem && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-amber-950">Name (English)</label>
                    <Input
                      value={editingItem.item.name_en}
                      onChange={handleEditInputChange}
                      name="name_en"
                      className="border-amber-950/40"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-amber-950">Name (Turkish)</label>
                    <Input
                      value={editingItem.item.name_tr}
                      onChange={handleEditInputChange}
                      name="name_tr"
                      className="border-amber-950/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-amber-950">Description (English)</label>
                    <Textarea
                      value={editingItem.item.description_en}
                      onChange={handleEditInputChange}
                      name="description_en"
                      className="border-amber-950/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-amber-950">Description (Turkish)</label>
                    <Textarea
                      value={editingItem.item.description_tr}
                      onChange={handleEditInputChange}
                      name="description_tr"
                      className="border-amber-950/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-amber-950">Ingredients (English)</label>
                    <Input
                      value={editingItem.item.ingredients_en}
                      onChange={handleEditInputChange}
                      name="ingredients_en"
                      className="border-amber-950/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-amber-950">Ingredients (Turkish)</label>
                    <Input
                      value={editingItem.item.ingredients_tr}
                      onChange={handleEditInputChange}
                      name="ingredients_tr"
                      className="border-amber-950/40"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-amber-950">Price</label>
                  <div className="relative">
                    <Input
                      value={cleanPrice(editingItem.item.price)}
                      onChange={handleEditInputChange}
                      name="price"
                      placeholder="e.g., 250"
                      className="border-amber-950/40 pl-3 pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-amber-950/60">
                      TL
                    </span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleUpdateItem}>
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
