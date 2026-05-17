// puzzles.js — Catálogo de imágenes de puzzles
// Usamos imágenes de Unsplash (libres de derechos) con IDs fijos para estabilidad

const PUZZLE_CATALOG = [
  {
    id: 1,
    name: "Bosque Encantado",
    category: "nature",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=70",
    badge: "Popular"
  },
  {
    id: 2,
    name: "Montañas Nevadas",
    category: "nature",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=70",
    badge: null
  },
  {
    id: 3,
    name: "Cascada Tropical",
    category: "nature",
    url: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&q=70",
    badge: "Nuevo"
  },
  {
    id: 4,
    name: "Atardecer en el Mar",
    category: "nature",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=70",
    badge: null
  },
  {
    id: 5,
    name: "Tulipanes de Holanda",
    category: "nature",
    url: "https://images.unsplash.com/photo-1490750967868-88df5691cc9f?w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1490750967868-88df5691cc9f?w=400&q=70",
    badge: null
  },
  {
    id: 6,
    name: "Tokio de Noche",
    category: "city",
    url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=70",
    badge: "Popular"
  },
  {
    id: 7,
    name: "París, La Ciudad Luz",
    category: "city",
    url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=70",
    badge: null
  },
  {
    id: 8,
    name: "Nueva York",
    category: "city",
    url: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=70",
    badge: null
  },
  {
    id: 9,
    name: "Santorini al Atardecer",
    category: "city",
    url: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=400&q=70",
    badge: "Nuevo"
  },
  {
    id: 10,
    name: "Abstracto Colorido",
    category: "art",
    url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&q=70",
    badge: null
  },
  {
    id: 11,
    name: "Geometría Azul",
    category: "art",
    url: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&q=70",
    badge: null
  },
  {
    id: 12,
    name: "Explosión de Color",
    category: "art",
    url: "https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=400&q=70",
    badge: "Popular"
  },
  {
    id: 13,
    name: "León Majestuoso",
    category: "animals",
    url: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&q=70",
    badge: null
  },
  {
    id: 14,
    name: "Zorro en la Nieve",
    category: "animals",
    url: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=400&q=70",
    badge: null
  },
  {
    id: 15,
    name: "Ballena Azul",
    category: "animals",
    url: "https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=400&q=70",
    badge: "Nuevo"
  },
  {
    id: 16,
    name: "Mariposa Monarca",
    category: "animals",
    url: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?w=400&q=70",
    badge: null
  },
  {
    id: 17,
    name: "Bambi en el Bosque",
    category: "animals",
    url: "https://images.unsplash.com/photo-1484406566174-9da000fda645?w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1484406566174-9da000fda645?w=400&q=70",
    badge: null
  },
  {
    id: 18,
    name: "Desierto al Amanecer",
    category: "nature",
    url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
    thumb: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&q=70",
    badge: null
  }
];
