import { SparePartProduct, Testimonial, FaqItem } from '../types';

export const COMPANY_INFO = {
  name: 'Soham Enterprises',
  tagline: 'Service • Spare Parts • Your Home, Our Priority',
  phone: '+91 90887 48747',
  emergencyPhone: '+91 90887 48747',
  whatsapp: '+91 90887 48747',
  email: 'support@sohamenterprises.com (CLIENT DATA REQUIRED)',
  address: 'Shop No. 14, Ground Floor, Central Appliance Hub, City Center Road (CLIENT DATA REQUIRED)',
  serviceAreas: 'Serving Greater Metro & Suburbs (CLIENT DATA REQUIRED)',
  workingHours: 'Monday – Sunday: 8:00 AM – 9:00 PM',
  gstin: '19AAACS1234F1Z5 (CLIENT DATA REQUIRED)',
  stats: {
    appliancesRepaired: '15,000+',
    verifiedTechnicians: '45+',
    satisfactionRate: '98.8%',
    genuinePartsStock: '2,500+'
  }
};

export const SPARE_PARTS_LIST: SparePartProduct[] = [
  {
    id: 'part-ro-membrane',
    slug: 'aquaguard-universal-75gpd-ro-membrane',
    sku: 'SE-FLT-0101',
    name: 'Aquaguard Universal 75 GPD High-Rejection RO Membrane',
    category: 'Water Purifier',
    brand: 'Aquaguard / Eureka Forbes',
    price: 1299,
    originalPrice: 1850,
    stockQuantity: 28,
    stockStatus: 'IN_STOCK',
    rating: 4.8,
    reviewCount: 142,
    isOemVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'High-performance thin-film composite (TFC) 75 GPD RO membrane designed for input water TDS up to 2000 ppm. Effectively removes heavy metals, dissolved salts, fluoride, and micro-contaminants.',
    specifications: {
      'Membrane Capacity': '75 Gallons Per Day (~12-15 L/hr)',
      'TDS Tolerance': 'Up to 2,000 PPM',
      'Operating Pressure': '45 - 100 PSI',
      'Material': 'Polyamide Thin-Film Composite',
      'Standard Dimensions': '11.75" x 1.75" (Standard Size 1812)'
    },
    compatibility: [
      'Aquaguard Enhance / Geneus / Magna',
      'Kent Grand / Grand Plus / Prime',
      'Livpure Glo / Touch',
      'AO Smith Z8 / X4',
      'All standard 1812 membrane housings'
    ],
    warrantyMonths: 12
  },
  {
    id: 'part-sediment-carbon',
    slug: 'pre-filter-sediment-and-activated-carbon-kit',
    sku: 'SE-FLT-0102',
    name: 'Multi-Stage 10" Spun Sediment & Activated Carbon Block Kit',
    category: 'Water Purifier',
    brand: 'Generic OEM Certified',
    price: 549,
    originalPrice: 899,
    stockQuantity: 75,
    stockStatus: 'IN_STOCK',
    rating: 4.7,
    reviewCount: 89,
    isOemVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Essential filtration pack containing a 5-micron polypropylene spun pre-filter cartridge and an extruded high-iodine coconut shell activated carbon block filter. Traps dirt, sand, rust, and absorbs chlorine.',
    specifications: {
      'Filter Life': 'Up to 6 Months / 6,000 Litres',
      'Micron Rating': '5 Micron',
      'Carbon Iodine Value': '1100 mg/g Coconut Shell',
      'Inlet/Outlet': '1/4" Push-Fit Fittings Included'
    },
    compatibility: [
      'All Domestic RO / UV Water Purifier Pre-filter Bowls'
    ],
    warrantyMonths: 6
  },
  {
    id: 'part-ac-remote-universal',
    slug: 'universal-lcd-ac-remote-control',
    sku: 'SE-AC-0201',
    name: 'Universal Backlit LCD Air Conditioner Remote Control',
    category: 'Air Conditioner',
    brand: 'Voltas / LG / Daikin / Samsung Compatible',
    price: 499,
    originalPrice: 799,
    stockQuantity: 42,
    stockStatus: 'IN_STOCK',
    rating: 4.6,
    reviewCount: 215,
    isOemVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Pre-programmed universal AC remote with 1000+ brand codes. Supports Turbo Cool, Sleep Mode, Timer, Fan Speed, and Temperature Adjustment with blue glow backlit screen.',
    specifications: {
      'Compatible Brands': '1,000+ Air Conditioners',
      'Transmission Distance': 'Up to 10 Meters',
      'Battery Type': '2x AAA Alkaline (Included)',
      'Display': 'High Contrast Backlit LCD'
    },
    compatibility: [
      'LG, Samsung, Voltas, Daikin, Blue Star, Lloyd, Carrier, Hitachi, Godrej'
    ],
    warrantyMonths: 6
  },
  {
    id: 'part-ac-capacitor',
    slug: 'heavy-duty-dual-run-ac-capacitor-45-5-mfd',
    sku: 'SE-AC-0202',
    name: 'Heavy Duty 45+5 MFD 440V Dual Run AC Capacitor',
    category: 'Air Conditioner',
    brand: 'Havells / Tibcon Compatible',
    price: 380,
    originalPrice: 650,
    stockQuantity: 18,
    stockStatus: 'IN_STOCK',
    rating: 4.9,
    reviewCount: 78,
    isOemVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Aluminum round explosion-proof motor run capacitor engineered for 1.5 Ton and 2.0 Ton split AC outdoor compressor units and condenser fan motors. Rated for 10,000 operating hours.',
    specifications: {
      'Capacitance': '45 uF + 5 uF (+/- 5%)',
      'Voltage Rating': '440 VAC 50/60 Hz',
      'Operating Temp': '-40°C to +85°C',
      'Construction': 'Hermetically Sealed Aluminum Casing'
    },
    compatibility: [
      '1.5 Ton & 2.0 Ton Split / Window ACs (All Major Brands)'
    ],
    warrantyMonths: 12
  },
  {
    id: 'part-fridge-relay',
    slug: 'universal-ptc-starter-relay-and-overload-protector',
    sku: 'SE-REF-0301',
    name: 'Universal 1-Pin PTC Starter Relay & OLP Overload Kit',
    category: 'Refrigerator',
    brand: 'LG / Whirlpool / Samsung',
    price: 299,
    originalPrice: 499,
    stockQuantity: 34,
    stockStatus: 'IN_STOCK',
    rating: 4.7,
    reviewCount: 160,
    isOemVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=600&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Quick plug-and-play compressor starter module. Solves non-cooling clicking issues by restoring proper electrical starting impulse to single-door and double-door refrigerator compressors.',
    specifications: {
      'Resistance': '12 - 22 Ohms PTC Disc',
      'Overload Rating': '1/6 HP to 1/2 HP',
      'Terminal Type': 'Standard spade terminal push pin'
    },
    compatibility: [
      'Direct Cool & Frost-Free Refrigerators (LG, Whirlpool, Godrej, Haier)'
    ],
    warrantyMonths: 6
  },
  {
    id: 'part-wm-drain-pump',
    slug: 'front-load-washing-machine-drain-pump-motor',
    sku: 'SE-WM-0401',
    name: 'High-Torque Front Load Washing Machine Drain Pump Motor',
    category: 'Washing Machine',
    brand: 'IFB / Bosch / LG Compatible',
    price: 799,
    originalPrice: 1250,
    stockQuantity: 12,
    stockStatus: 'LOW_STOCK',
    rating: 4.8,
    reviewCount: 64,
    isOemVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Synchronous magnetic drain discharge pump with thermal overheat cutoff. Clears water drainage errors (OE/5E) and ejects soapy lint water smoothly.',
    specifications: {
      'Power Rating': '30 Watts 220-240V AC',
      'Flow Rate': '20 Liters / Minute',
      'Mounting': '3-Screw Bayonet Standard Fitting'
    },
    compatibility: [
      'IFB Elena, Senator, Elite',
      'LG Front Load Inverter Direct Drive Series',
      'Samsung EcoBubble Front Load Series'
    ],
    warrantyMonths: 12
  },
  {
    id: 'part-wm-inlet-valve',
    slug: 'double-solenoid-water-inlet-valve-washing-machine',
    sku: 'SE-WM-0402',
    name: 'Dual Solenoid Electric Water Inlet Valve 220V',
    category: 'Washing Machine',
    brand: 'Universal Washing Machine',
    price: 450,
    originalPrice: 750,
    stockQuantity: 22,
    stockStatus: 'IN_STOCK',
    rating: 4.5,
    reviewCount: 47,
    isOemVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Precision electromagnetic brass plunger valve that controls cold and hot water intake for top load and front load washers. Stops slow dripping into drum.',
    specifications: {
      'Voltage': 'AC 220V - 240V',
      'Inlet Thread': 'Standard 3/4" BSP Garden Hose Fitting',
      'Operating Pressure': '0.02 - 0.8 MPa'
    },
    compatibility: [
      'Samsung, LG, Whirlpool, Godrej Top Load Automatic Washers'
    ],
    warrantyMonths: 6
  },
  {
    id: 'part-micro-magnetron',
    slug: 'oem-microwave-oven-magnetron-tube-2m214',
    sku: 'SE-MW-0501',
    name: 'OEM Microwave High-Power Magnetron 2M214 900W',
    category: 'Microwave',
    brand: 'LG / Panasonic / IFB',
    price: 1450,
    originalPrice: 2200,
    stockQuantity: 8,
    stockStatus: 'LOW_STOCK',
    rating: 4.9,
    reviewCount: 52,
    isOemVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=600&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Direct factory replacement vacuum tube generating 2.45 GHz microwaves. Solves no-heat issues instantly. Designed with reinforced cooling fins for longer lifespan.',
    specifications: {
      'Output Microwave Power': '900 Watts',
      'Frequency': '2460 MHz',
      'Mounting Holes': 'Standard 6-hole flange'
    },
    compatibility: [
      'LG, Samsung, IFB, Panasonic, Morphy Richards Convection & Grill Ovens'
    ],
    warrantyMonths: 12
  },
  {
    id: 'part-geyser-element',
    slug: 'heavy-copper-geyser-heating-element-2000w',
    sku: 'SE-GYS-0601',
    name: 'Heavy Duty 2000W Pure Copper Geyser Heating Element with Anode',
    category: 'Geyser',
    brand: 'Bajaj / Racold / Crompton / AO Smith',
    price: 680,
    originalPrice: 1100,
    stockQuantity: 25,
    stockStatus: 'IN_STOCK',
    rating: 4.8,
    reviewCount: 114,
    isOemVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'High-density copper tubular heating element coated with anti-scale tinning. Includes built-in thermostat pocket and magnesium sacrificial anode socket for corrosion defense.',
    specifications: {
      'Wattage': '2000 Watts (2.0 kW) 230V',
      'Flange Type': 'Standard 1-1/4" Threaded or Triangle 3-Bolt Flange',
      'Tube Material': 'Electrolytic Pure Copper',
      'Tube Length': '240 mm'
    },
    compatibility: [
      '10L, 15L, and 25L Storage Geysers (Bajaj, Racold, Havells, Venus, Crompton)'
    ],
    warrantyMonths: 12
  },
  {
    id: 'part-geyser-thermostat',
    slug: 'stem-type-geyser-thermostat-with-thermal-cutoff',
    sku: 'SE-GYS-0602',
    name: 'Stem Type Temperature Control Geyser Thermostat 75°C',
    category: 'Geyser',
    brand: 'Universal Water Heater',
    price: 320,
    originalPrice: 550,
    stockQuantity: 30,
    stockStatus: 'IN_STOCK',
    rating: 4.7,
    reviewCount: 68,
    isOemVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Dual safety automatic thermostat. Automatically cuts off power when water reaches the pre-set temperature (30°C to 75°C) to prevent overheating and power wastage.',
    specifications: {
      'Current Rating': '16 Amps 250V AC',
      'Stem Length': '275 mm (11 Inch)',
      'Temperature Range': 'Adjustable 30°C to 75°C'
    },
    compatibility: [
      'All standard vertical and horizontal storage geysers'
    ],
    warrantyMonths: 12
  },
  {
    id: 'part-tv-backlight-32',
    slug: 'universal-32-inch-led-tv-backlight-strip-set',
    sku: 'SE-TV-0701',
    name: '32-Inch LED TV Aluminum Backlight Strips (Set of 3)',
    category: 'TV',
    brand: 'Samsung / LG / Mi / TCL Compatible',
    price: 599,
    originalPrice: 999,
    stockQuantity: 15,
    stockStatus: 'IN_STOCK',
    rating: 4.6,
    reviewCount: 88,
    isOemVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Set of 3 aluminum substrate LED backlight arrays with concave optical lenses for even light diffusion. Restores picture brightness and clears screen dark spots.',
    specifications: {
      'Voltage per LED': '6 Volts (or 3V configured)',
      'LED Count': '6 LEDs per strip (Total 18 LEDs)',
      'Substrate': 'Aluminum heat-conductive PCB with thermal tape'
    },
    compatibility: [
      '32-Inch Smart & Non-Smart LED TVs'
    ],
    warrantyMonths: 6
  },
  {
    id: 'part-chimney-filter',
    slug: 'stainless-steel-baffle-filter-kitchen-chimney',
    sku: 'SE-CHM-0801',
    name: 'Dishwasher-Safe Stainless Steel Kitchen Chimney Baffle Filter',
    category: 'Other Appliances',
    brand: 'Faber / Hindware / Glen / Elica Compatible',
    price: 499,
    originalPrice: 850,
    stockQuantity: 20,
    stockStatus: 'IN_STOCK',
    rating: 4.8,
    reviewCount: 92,
    isOemVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Commercial-grade curved baffle filter engineered to separate oil fumes from kitchen air dynamically. Built from heavy rust-free SS304 stainless steel with easy-lift handle.',
    specifications: {
      'Material': 'SS 304 Grade Stainless Steel',
      'Dimensions': '495 mm x 248 mm (Standard 60cm/90cm chimney size)',
      'Cleaning': 'Dishwasher safe & hot water soak compatible'
    },
    compatibility: [
      'Faber, Elica, Hindware, Glen, Kaff 60cm & 90cm Hood Chimneys'
    ],
    warrantyMonths: 12
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't-1',
    name: 'Rajesh Mukherjee',
    location: 'Salt Lake, Sector 2 (CLIENT DATA REQUIRED)',
    rating: 5,
    date: '2 days ago',
    applianceServiced: 'Aquaguard RO Service',
    reviewText: 'Technician reached within 2 hours of booking. Checked the TDS meter right in front of me, replaced the clogged sediment filter and membrane, and the water tastes fresh and crisp again. Very honest and transparent pricing!',
    verified: true
  },
  {
    id: 't-2',
    name: 'Ananya Sen Sharma',
    location: 'Ballygunge Circular Road (CLIENT DATA REQUIRED)',
    rating: 5,
    date: '1 week ago',
    applianceServiced: 'Split AC Foam Jet Wash',
    reviewText: 'My 1.5-ton split AC was barely cooling during peak afternoon heat. The technician used a dedicated foam pressure wash bag so not a single drop of water spilled on my wall. Chilling cooling restored!',
    verified: true
  },
  {
    id: 't-3',
    name: 'Vikramjit Roy',
    location: 'New Town, Action Area 1 (CLIENT DATA REQUIRED)',
    rating: 5,
    date: '2 weeks ago',
    applianceServiced: 'LG Washing Machine Repair',
    reviewText: 'Our front load washer drum stopped spinning with a loud humming noise. Soham Enterprises sent their technician with the genuine replacement drive belt and starter capacitor. Fixed in under 45 minutes.',
    verified: true
  },
  {
    id: 't-4',
    name: 'Debjani Bhattacharya',
    location: 'Jadavpur (CLIENT DATA REQUIRED)',
    rating: 5,
    date: '2 weeks ago',
    applianceServiced: 'Geyser Heating Element Replacement',
    reviewText: 'The geyser was tripping our main circuit breaker. The technician brought a heavy copper 2000W element, replaced the corroded anode, and descaled the internal tank. Courteous, professional, and on time.',
    verified: true
  }
];

export const FAQS_LIST: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'general',
    question: 'What is Soham Enterprises and what areas do you serve?',
    answer: 'Soham Enterprises is a professional doorstep home appliance service, maintenance, and genuine spare parts provider. We currently serve urban residential and commercial locations with verified, certified technicians.'
  },
  {
    id: 'faq-2',
    category: 'booking',
    question: 'How quickly can a technician visit after I book?',
    answer: 'We provide same-day doorstep service within 2 to 4 hours of booking, depending on your preferred time slot and technician availability in your pincode.'
  },
  {
    id: 'faq-3',
    category: 'pricing',
    question: 'Are diagnostic fees included in the total repair bill?',
    answer: 'Yes! If you choose to proceed with the repair after the diagnostic inspection, our minimal inspection fee is adjusted directly into the final service invoice.'
  },
  {
    id: 'faq-4',
    category: 'parts',
    question: 'Are the spare parts sold on your website genuine and under warranty?',
    answer: '100% yes. All spare parts supplied by Soham Enterprises are OEM-certified or verified high-grade compatible components with up to 12 months manufacturer warranty.'
  },
  {
    id: 'faq-5',
    category: 'booking',
    question: 'What happens if the appliance problem recurs after service?',
    answer: 'We provide a 30-day post-service warranty on our repairs. If the exact same issue reoccurs within 30 days, our technician will re-inspect and fix it at zero service charge.'
  },
  {
    id: 'faq-6',
    category: 'pricing',
    question: 'What payment methods do you accept?',
    answer: 'We accept Cash on Service/Delivery, UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards, and Net Banking via our secure Razorpay gateway.'
  },
  {
    id: 'faq-7',
    category: 'parts',
    question: 'Can I purchase spare parts without booking a technician?',
    answer: 'Yes! You can browse our Spare Parts store, verify compatibility with your appliance model, and order directly for doorstep parcel delivery.'
  }
];
