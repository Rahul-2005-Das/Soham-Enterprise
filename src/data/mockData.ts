import { ServiceCategory, SparePartProduct, Testimonial, FaqItem } from '../types';

export const COMPANY_INFO = {
  name: 'Sohom Enterprises',
  tagline: 'Service • Spare Parts • Your Home, Our Priority',
  phone: '+91 98765 43210 (CLIENT DATA REQUIRED)',
  emergencyPhone: '+91 98765 43211 (CLIENT DATA REQUIRED)',
  whatsapp: '+91 98765 43210 (CLIENT DATA REQUIRED)',
  email: 'support@sohomenterprises.com (CLIENT DATA REQUIRED)',
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

export const SERVICES_LIST: ServiceCategory[] = [
  {
    id: 'srv-aquaguard',
    slug: 'aquaguard-water-purifier',
    name: 'Aquaguard & Water Purifier Service & Repair',
    shortName: 'Aquaguard / Water Purifier',
    tagline: 'Pristine drinking water with authentic sediment, carbon & RO membrane replacement',
    iconName: 'Droplets',
    imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80',
    startingPrice: 399,
    durationMinutes: 45,
    warrantyDays: 30,
    popular: true,
    commonProblems: [
      'Low water flow / trickling output',
      'Unusual foul taste or odor in water',
      'Water leakage from body or connectors',
      'Auto shut-off switch failure / overflow',
      'Continuous beeping alarm or filter alert',
      'TDS level higher than safe threshold'
    ],
    description: 'Complete inspection and preventative maintenance for all RO, UV, and UF water purifiers. Includes inlet pressure diagnostics, multi-stage filter sediment cleansing, membrane flush, electrical booster pump test, and digital TDS water quality calibration.',
    serviceProcess: [
      { step: 1, title: 'In-Depth Diagnostics', desc: 'Pre-service TDS measurement, water pressure check, and leak inspection.' },
      { step: 2, title: 'Filter Chamber Sanitization', desc: 'Sediment and activated carbon cartridge cleansing or replacement.' },
      { step: 3, title: 'Booster Pump & Valve Testing', desc: 'Solenoid valve and high-pressure cut-off switch performance check.' },
      { step: 4, title: 'Post-Service TDS Certification', desc: 'Final water output test with TDS meter and 30-day service warranty seal.' }
    ],
    benefits: [
      'Genuine certified food-grade filter cartridges',
      'Precise electronic TDS level calibration',
      'Complete leak-proof fitting replacement',
      '30-Day post-service guarantee on workmanship'
    ],
    faqList: [
      { question: 'How frequently should I service my RO water purifier?', answer: 'We recommend routine filter replacement every 6 to 9 months and a full system diagnostic every 12 months depending on your input water TDS.' },
      { question: 'Do you supply genuine filter replacements for Kent, Aquaguard, and AO Smith?', answer: 'Yes, we only use OEM-certified and high-spec compatible cartridges that meet ISI drinking water standards.' }
    ]
  },
  {
    id: 'srv-ac',
    slug: 'ac-service-repair',
    name: 'Air Conditioner (AC) Service, Gas Refill & Repair',
    shortName: 'AC Service & Repair',
    tagline: 'Split & Window AC jet cleaning, gas charging, compressor and PCB diagnostics',
    iconName: 'Wind',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    startingPrice: 499,
    durationMinutes: 60,
    warrantyDays: 30,
    popular: true,
    commonProblems: [
      'AC blowing warm air / Not cooling properly',
      'Water dripping or leaking inside room',
      'Unpleasant moldy or burnt smell',
      'Abnormal compressor vibration or buzzing sound',
      'AC automatically turning off repeatedly',
      'Remote not responding / PCB error code on display'
    ],
    description: 'Keep your indoor climate icy cool with our foam-jet deep pressure cleaning. Our technicians service split, inverter, and window AC units from all major brands, diagnosing refrigerant gas levels, cooling coils, capacitor health, and outdoor fan performance.',
    serviceProcess: [
      { step: 1, title: 'Pre-Check & Airflow Test', desc: 'Checking cooling output temperature, current drawn, and remote responsiveness.' },
      { step: 2, title: 'Foam Jet Pressure Cleaning', desc: 'Indoor coil, blower wheel, drain tray, and outdoor condenser power wash.' },
      { step: 3, title: 'Refrigerant Pressure Verification', desc: 'Gauge manifold pressure test for R32, R410A, or R22 gas levels.' },
      { step: 4, title: 'Cooling Performance Handover', desc: 'Thermometer verification of vent temperature drop and final report.' }
    ],
    benefits: [
      'High-pressure foam-jet washing bag kit',
      'Extends compressor lifespan and cuts power bills up to 25%',
      'Original spare capacitors, fan motors & remotes',
      'Accurate manifold pressure verification'
    ],
    faqList: [
      { question: 'What is included in the basic AC deep cleaning service?', answer: 'It includes complete indoor unit deep foam jet wash, outdoor condenser coil power wash, drain pipe flushing, filter sanitization, and cooling gas pressure inspection.' },
      { question: 'What warranty is provided on AC gas charging?', answer: 'We provide a 60-day warranty against refrigerant leakage following gas top-up or full refill.' }
    ]
  },
  {
    id: 'srv-refrigerator',
    slug: 'refrigerator-service-repair',
    name: 'Refrigerator Service & Compressor Repair',
    shortName: 'Refrigerator',
    tagline: 'Fast cooling restoration for Single Door, Double Door, and Side-by-Side fridges',
    iconName: 'Refrigerator',
    imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80',
    startingPrice: 349,
    durationMinutes: 60,
    warrantyDays: 30,
    popular: true,
    commonProblems: [
      'Freezer working but lower fridge compartment warm',
      'Excessive frost build-up / Defrost cycle failure',
      'Fridge continuously clicking without cooling',
      'Water pooling at bottom or underneath vegetable box',
      'Loud humming noise from rear compressor area',
      'Door gasket loose / Cold air escaping'
    ],
    description: 'Expert doorstep repairs for frost-free and direct-cool refrigerators. We troubleshoot relay switches, overload protectors, inverter motherboards, defrost timers, defrost heaters, thermostat sensors, and cooling coil capillary tubes.',
    serviceProcess: [
      { step: 1, title: 'Thermal & Electrical Scan', desc: 'Measuring compartment temperatures and compressor amp draw.' },
      { step: 2, title: 'Defrost & Evaporator Diagnostic', desc: 'Testing bi-metal thermostat, thermal fuse, and fan motor rotation.' },
      { step: 3, title: 'Relay & Gas Pressure Check', desc: 'Inspecting start relay capacitor and suction pressure.' },
      { step: 4, title: 'Door Seal & Cooling Verification', desc: 'Magnetic gasket inspection and sealing test.' }
    ],
    benefits: [
      'Stock of original PTC relays, thermostats & timers',
      'Environment-friendly hydrocarbon gas refilling (R600a/R134a)',
      'Door seal replacement on request',
      '30-Day service warranty'
    ],
    faqList: [
      { question: 'Why is my fridge making a clicking sound every few minutes?', answer: 'A clicking sound usually indicates a faulty PTC starter relay or failing compressor overload protector. Our technician can replace this on the spot.' }
    ]
  },
  {
    id: 'srv-washing-machine',
    slug: 'washing-machine-service-repair',
    name: 'Washing Machine Repair & Drum Cleaning',
    shortName: 'Washing Machine',
    tagline: 'Front Load, Top Load & Semi-Automatic diagnostic & motor repairs',
    iconName: 'Shirt',
    imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80',
    startingPrice: 349,
    durationMinutes: 60,
    warrantyDays: 30,
    popular: true,
    commonProblems: [
      'Machine not draining water / Error OE or 5E',
      'Violent vibration or loud banging during spin cycle',
      'Drum not spinning / Motor humming',
      'Water overflowing or inlet valve not shutting off',
      'Door lock jammed / Door latch broken',
      'Foul odor and mildew residue in drum'
    ],
    description: 'Comprehensive mechanical and electronic service for automatic washing machines. We fix drive belts, drain pumps, suspension dampers, bearings, inlet solenoid valves, pressure switches, and PCB controllers.',
    serviceProcess: [
      { step: 1, title: 'Error Code Readout', desc: 'Diagnosing system codes, cycle test, and inlet/outlet flow.' },
      { step: 2, title: 'Mechanical Suspension Check', desc: 'Testing shock absorbers, counterweights, and spider arm bearings.' },
      { step: 3, title: 'Drain & Pump Cleaning', desc: 'Debris filter unclogging and impeller motor inspection.' },
      { step: 4, title: 'Spin Cycle Quality Run', desc: 'High-RPM balance test with vibration damping check.' }
    ],
    benefits: [
      'OEM replacement drain pumps and suspension rods',
      'High-grade anti-scale descaling deep cleans available',
      'Door boot gasket and lock switch replacement',
      'Tested across brands: LG, Samsung, IFB, Whirlpool, Bosch'
    ],
    faqList: [
      { question: 'Why is my washing machine shaking violently during spin?', answer: 'This typically stems from worn suspension shock absorbers, unbalanced leveling feet, or broken drum spider bearings.' }
    ]
  },
  {
    id: 'srv-microwave',
    slug: 'microwave-oven-service-repair',
    name: 'Microwave Oven Service & Magnetron Repair',
    shortName: 'Microwave Oven',
    tagline: 'Solo, Grill & Convection heating and high-voltage repairs',
    iconName: 'Flame',
    imageUrl: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80',
    startingPrice: 299,
    durationMinutes: 45,
    warrantyDays: 30,
    popular: false,
    commonProblems: [
      'Microwave runs but does not heat food',
      'Sparks and crackling inside cooking cavity',
      'Turntable glass tray not rotating',
      'Keypad buttons or touch panel unresponsive',
      'Display dead / Blown high-voltage fuse',
      'Door microswitch failure / wont start with door closed'
    ],
    description: 'Safe and certified service for high-voltage microwave circuits. We replace magnetrons, high-voltage diodes, HV capacitors, turntable synchronous motors, mica wave guide sheets, and touch membrane keypads.',
    serviceProcess: [
      { step: 1, title: 'High-Voltage Discharge & Safety', desc: 'Safe grounding and discharge of high-voltage capacitor.' },
      { step: 2, title: 'Component Resistance Testing', desc: 'Checking magnetron filament, HV diode, and door interlock switches.' },
      { step: 3, title: 'Waveguide & Cavity Inspection', desc: 'Replacing burnt mica sheets and inspecting paint integrity.' },
      { step: 4, title: 'Radiation Leakage & Water Heat Test', desc: 'RF radiation monitor check and standard water temperature rise test.' }
    ],
    benefits: [
      '100% genuine magnetrons with warranty',
      'High-voltage safety certified technicians',
      'Mica waveguide sheet replacement on spot',
      'Touch keypad membrane repair'
    ],
    faqList: [
      { question: 'Is it worth repairing a microwave that is not heating?', answer: 'Yes! In 90% of cases, it is simply a blown high-voltage diode, fuse, or faulty magnetron, which can be repaired at a fraction of the cost of a new appliance.' }
    ]
  },
  {
    id: 'srv-tv',
    slug: 'tv-service-repair',
    name: 'LED, OLED & Smart TV Service & Panel Repair',
    shortName: 'TV Service & Repair',
    tagline: 'Backlight replacement, display panel bonding, motherboard & sound repair',
    iconName: 'Tv',
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80',
    startingPrice: 399,
    durationMinutes: 60,
    warrantyDays: 30,
    popular: false,
    commonProblems: [
      'Sound is clear but screen is completely dark',
      'Horizontal or vertical colored lines on display',
      'TV stuck on brand boot logo / continuous restart',
      'HDMI ports not detecting signal / WiFi disconnected',
      'Power indicator blinking with no display',
      'Internal speaker buzzing or no audio output'
    ],
    description: 'Precision television repairs from 24-inch to 75-inch screens. We specialize in LED backlight strip replacements, SMPS power supply boards, T-Con timing controllers, mainboards, and software firmware flashing.',
    serviceProcess: [
      { step: 1, title: 'Display & Backlight Diagnostic', desc: 'Flashlight inspection to determine backlight LED vs. panel failure.' },
      { step: 2, title: 'Power Board Voltage Metering', desc: 'Measuring 12V, 24V, and standby rails on power supply unit.' },
      { step: 3, title: 'Board / Strip Component Replacement', desc: 'Swapping faulty LED arrays with aluminum-backed heat-sink strips.' },
      { step: 4, title: 'Burn-In & Pixel Uniformity Test', desc: '30-minute stress test with color bar calibration.' }
    ],
    benefits: [
      'Premium high-brightness aluminum LED backlight arrays',
      'T-Con and motherboard repairs at chip level',
      'Original remote controls & wall mount brackets',
      'Safe on-site and authorized lab handling'
    ],
    faqList: [
      { question: 'Why does my TV have audio but no picture?', answer: 'This is the classic symptom of failed LED backlights. The display panel is fine, and replacing the backlight strip will restore full picture brightness.' }
    ]
  },
  {
    id: 'srv-geyser',
    slug: 'geyser-water-heater-service-repair',
    name: 'Geyser & Water Heater Service & Heating Element Repair',
    shortName: 'Geyser / Water Heater',
    tagline: 'Instant & Storage water heater descaling, thermostat and element replacement',
    iconName: 'Zap',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    startingPrice: 299,
    durationMinutes: 45,
    warrantyDays: 30,
    popular: true,
    commonProblems: [
      'Geyser not heating water / Tripping MCB switch',
      'Water heating very slowly or lukewarm only',
      'Water leaking from tank or inlet/outlet pipe',
      'Electrical shock or earthing leakage from tap',
      'Rusty, brown, or smelly hot water output',
      'Thermostat indicator lights not turning on'
    ],
    description: 'Safe, certified electric and gas geyser maintenance. Hard water leads to thick calcium buildup on heating elements and inside tanks. Our technicians perform deep tank chemical descaling, anode rod replacement, and thermostat calibration.',
    serviceProcess: [
      { step: 1, title: 'Electrical Safety & Earthing Test', desc: 'Checking voltage, earthing continuity, and MCB cutoff.' },
      { step: 2, title: 'Tank Draining & Sediment Flush', desc: 'Flushing calcium sediment and hard water lime scale.' },
      { step: 3, title: 'Heating Element & Anode Check', desc: 'Inspecting magnesium sacrificial anode and copper heating coil.' },
      { step: 4, title: 'Safety Valve Pressure Test', desc: 'Verifying pressure release valve (PRV) for safety.' }
    ],
    benefits: [
      'ISI marked heavy-duty copper and glass-coated heating elements',
      'Tank descaling boosts heating speed up to 40%',
      'Multi-function safety valve replacements',
      '30-Day post-service safety guarantee'
    ],
    faqList: [
      { question: 'Why is my geyser tripping the home MCB when switched on?', answer: 'This indicates that the heating element casing has cracked or corroded, causing an electrical earth leakage. The element needs immediate replacement.' }
    ]
  },
  {
    id: 'srv-other',
    slug: 'other-home-appliance-services',
    name: 'Other Home Appliances Service & Multi-Brand Diagnostics',
    shortName: 'Other Appliances',
    tagline: 'Kitchen chimneys, induction cooktops, mixer grinders & general home gadgets',
    iconName: 'Wrench',
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    startingPrice: 249,
    durationMinutes: 45,
    warrantyDays: 30,
    popular: false,
    commonProblems: [
      'Kitchen chimney suction weak / Baffle filters choked with grease',
      'Induction cooktop error E0/E1 / No pan detection',
      'Mixer grinder motor burning smell / Coupler broken',
      'Air cooler motor humming / Water pump failure',
      'General electrical diagnostic / Appliance wiring overhaul'
    ],
    description: 'Reliable repair solutions for all ancillary home electrical appliances. Our skilled technicians carry diagnostic tools and universal spare parts to service kitchen chimneys, induction plates, vacuum cleaners, and food processors.',
    serviceProcess: [
      { step: 1, title: 'Inspection & Symptom Analysis', desc: 'Testing power input, internal wiring, and mechanical parts.' },
      { step: 2, title: 'Motor & Circuit Test', desc: 'Thermal overload and winding resistance check.' },
      { step: 3, title: 'Deep Cleaning & Repair', desc: 'Degreasing chimney blowers and replacing damaged parts.' },
      { step: 4, title: 'Operational Safety Verification', desc: 'Load test and safety check.' }
    ],
    benefits: [
      'Skilled multi-craft technicians',
      'Transparent flat diagnostic rates',
      'Genuine replacement motors and switches',
      'Doorstep convenience'
    ],
    faqList: [
      { question: 'Can I book a general inspection if my appliance problem is not listed?', answer: 'Yes! Simply select Other Appliances and describe the symptom. Our technician will visit and provide a diagnostic estimate before starting work.' }
    ]
  }
];

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
    reviewText: 'Our front load washer drum stopped spinning with a loud humming noise. Sohom Enterprises sent their technician with the genuine replacement drive belt and starter capacitor. Fixed in under 45 minutes.',
    verified: true
  },
  {
    id: 't-4',
    name: 'Debjani Bhattacharya',
    location: 'Jadavpur (CLIENT DATA REQUIRED)',
    rating: 5,
    date: '3 weeks ago',
    applianceServiced: 'Geyser Heating Element Replacement',
    reviewText: 'The geyser was tripping our main circuit breaker. The technician brought a heavy copper 2000W element, replaced the corroded anode, and descaled the internal tank. Courteous, professional, and on time.',
    verified: true
  }
];

export const FAQS_LIST: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'general',
    question: 'What is Sohom Enterprises and what areas do you serve?',
    answer: 'Sohom Enterprises is a professional doorstep home appliance service, maintenance, and genuine spare parts provider. We currently serve urban residential and commercial locations with verified, certified technicians.'
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
    answer: '100% yes. All spare parts supplied by Sohom Enterprises are OEM-certified or verified high-grade compatible components with up to 12 months manufacturer warranty.'
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
