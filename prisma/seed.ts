import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db.ts';

async function main() {
  console.log('--- Starting Sohom Enterprises Prisma Database Seed ---');

  // 1. Service Categories
  const serviceCategories = [
    {
      id: 'cat-water-purifier',
      name: 'Water Purifier & RO Systems',
      slug: 'water-purifier',
      description: 'Filtration, RO membrane, booster pump, and multi-stage purification service.',
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80',
      sortOrder: 1,
      active: true,
    },
    {
      id: 'cat-ac',
      name: 'Air Conditioner (AC)',
      slug: 'air-conditioner',
      description: 'Split & window AC power jet cleaning, gas charging, compressor repair.',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
      sortOrder: 2,
      active: true,
    },
    {
      id: 'cat-refrigerator',
      name: 'Refrigerator & Freezers',
      slug: 'refrigerator',
      description: 'Single, double-door & side-by-side fridge cooling, compressor & defrost repairs.',
      image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
      sortOrder: 3,
      active: true,
    },
    {
      id: 'cat-washing-machine',
      name: 'Washing Machines',
      slug: 'washing-machine',
      description: 'Front load, top load & semi-automatic spin, drain, motor & PCB repair.',
      image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=800&q=80',
      sortOrder: 4,
      active: true,
    },
    {
      id: 'cat-microwave',
      name: 'Microwave Ovens',
      slug: 'microwave-oven',
      description: 'Solo, grill & convection microwave heating, magnetron and touch panel repairs.',
      image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80',
      sortOrder: 5,
      active: true,
    },
    {
      id: 'cat-tv',
      name: 'Television (TV)',
      slug: 'television',
      description: 'LED, OLED & Smart TV backlight, display panel, power supply & motherboard repairs.',
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80',
      sortOrder: 6,
      active: true,
    },
    {
      id: 'cat-geyser',
      name: 'Geyser & Water Heaters',
      slug: 'geyser-water-heater',
      description: 'Instant & storage geyser heating element, thermostat, tank descaling & valve repairs.',
      image: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80',
      sortOrder: 7,
      active: true,
    },
    {
      id: 'cat-other',
      name: 'Other Small Appliances',
      slug: 'other-appliances',
      description: 'Induction cooktop, mixer grinder, chimney, iron & vacuum cleaner repairs.',
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
      sortOrder: 8,
      active: true,
    },
  ];

  for (const cat of serviceCategories) {
    await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }
  console.log(`✓ Seeded ${serviceCategories.length} Service Categories`);

  // 2. Services
  const services = [
    {
      id: 'srv-aquaguard',
      categoryId: 'cat-water-purifier',
      name: 'Aquaguard & Water Purifier Service & Repair',
      slug: 'aquaguard-water-purifier',
      description: 'Complete inspection and preventative maintenance for all RO, UV, and UF water purifiers. Includes inlet pressure diagnostics, multi-stage filter sediment cleansing, membrane flush, electrical booster pump test, and digital TDS water quality calibration.',
      shortDescription: 'RO, UV & UF purifier filter maintenance, booster pump & TDS calibration',
      inspectionFee: new Prisma.Decimal(399.00),
      estimatedDuration: '45 mins',
      warrantyDays: 30,
      active: true,
    },
    {
      id: 'srv-ac',
      categoryId: 'cat-ac',
      name: 'Air Conditioner (AC) Service, Gas Refill & Repair',
      slug: 'ac-service-repair',
      description: 'Keep your indoor climate icy cool with our foam-jet deep pressure cleaning. Our technicians service split, inverter, and window AC units from all major brands, diagnosing refrigerant gas levels, cooling coils, capacitor health, and outdoor fan performance.',
      shortDescription: 'High-pressure foam jet wash, gas leak detection, capacitor & PCB repair',
      inspectionFee: new Prisma.Decimal(499.00),
      estimatedDuration: '60 mins',
      warrantyDays: 30,
      active: true,
    },
    {
      id: 'srv-refrigerator',
      categoryId: 'cat-refrigerator',
      name: 'Refrigerator Service, Gas Charging & Compressor Repair',
      slug: 'refrigerator-service-repair',
      description: 'Expert diagnostics for cooling failures, freezer frost buildup, thermostat irregularities, and relay faults for single door, double door, and inverter frost-free refrigerators.',
      shortDescription: 'Compressor diagnostics, cooling coil repair, thermostat & gas refill',
      inspectionFee: new Prisma.Decimal(399.00),
      estimatedDuration: '50 mins',
      warrantyDays: 30,
      active: true,
    },
    {
      id: 'srv-washing-machine',
      categoryId: 'cat-washing-machine',
      name: 'Washing Machine Repair & Drum Cleaning Service',
      slug: 'washing-machine-service-repair',
      description: 'Comprehensive mechanical and electronic repairs for top load, front load, and semi-automatic washers. We repair inlet valves, drain pumps, drive belts, suspension shocks, and inverter drive boards.',
      shortDescription: 'Drum descaling, drain pump unclogging, motor belt & PCB repair',
      inspectionFee: new Prisma.Decimal(399.00),
      estimatedDuration: '60 mins',
      warrantyDays: 30,
      active: true,
    },
    {
      id: 'srv-microwave',
      categoryId: 'cat-microwave',
      name: 'Microwave Oven Heating & Electrical Repair',
      slug: 'microwave-oven-repair',
      description: 'Certified component repairs for solo, grill, and convection microwave ovens. Addressing non-heating magnetrons, sparking waveguide covers, faulty high-voltage capacitors, and unresponsive keypad panels.',
      shortDescription: 'Magnetron replacement, high voltage diode repair, turntable motor & switch',
      inspectionFee: new Prisma.Decimal(349.00),
      estimatedDuration: '40 mins',
      warrantyDays: 30,
      active: true,
    },
    {
      id: 'srv-tv',
      categoryId: 'cat-tv',
      name: 'LED / Smart TV Screen, Backlight & Motherboard Repair',
      slug: 'tv-service-repair',
      description: 'Precision repairs for LED, QLED, and Smart 4K TVs. Our repair center diagnoses backlight strip failure (sound ok, dark screen), SMPS power supply board faults, and T-Con panel ribbon issues.',
      shortDescription: 'Backlight LED strip replacement, mother board IC soldering & power supply repair',
      inspectionFee: new Prisma.Decimal(499.00),
      estimatedDuration: '60 mins',
      warrantyDays: 30,
      active: true,
    },
    {
      id: 'srv-geyser',
      categoryId: 'cat-geyser',
      name: 'Geyser & Water Heater Heating Element & Thermostat Repair',
      slug: 'geyser-water-heater-repair',
      description: 'Doorstep repair for instant and storage water heaters. We replace burnt copper heating coils, faulty dual thermostats, pressure relief valves, and conduct deep tank scale removal.',
      shortDescription: 'Heating element replacement, thermostat calibration, tank descaling & valve fixing',
      inspectionFee: new Prisma.Decimal(349.00),
      estimatedDuration: '45 mins',
      warrantyDays: 30,
      active: true,
    },
    {
      id: 'srv-other',
      categoryId: 'cat-other',
      name: 'Small Appliances & Kitchen Gadget Diagnostics',
      slug: 'small-home-appliances-repair',
      description: 'Skilled electrical troubleshooting for induction cooktops, mixer grinders, kitchen chimneys, steam irons, and vacuum cleaners with safety-certified components.',
      shortDescription: 'Induction cooktop coil, mixer coupler & motor rewinding, kitchen chimney wash',
      inspectionFee: new Prisma.Decimal(299.00),
      estimatedDuration: '40 mins',
      warrantyDays: 30,
      active: true,
    },
  ];

  for (const srv of services) {
    await prisma.service.upsert({
      where: { slug: srv.slug },
      update: srv,
      create: srv,
    });
  }
  console.log(`✓ Seeded ${services.length} Services`);

  // 3. Product Categories
  const productCategories = [
    {
      id: 'pcat-water-purifier',
      name: 'RO & Water Purifier Parts',
      slug: 'water-purifier-parts',
      description: 'Original RO membranes, sediment/carbon pre-filters, booster pumps, SMPS adapters and UV lamps.',
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=400&q=80',
      active: true,
    },
    {
      id: 'pcat-ac',
      name: 'AC Spare Parts',
      slug: 'ac-spare-parts',
      description: 'Run capacitors, fan motors, universal remotes, copper pipe insulations and flare nuts.',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
      active: true,
    },
    {
      id: 'pcat-refrigerator',
      name: 'Refrigerator Parts',
      slug: 'refrigerator-parts',
      description: 'PTC start relays, overload protectors, door gaskets, defrost timers and bimetal thermostats.',
      image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=400&q=80',
      active: true,
    },
    {
      id: 'pcat-washing-machine',
      name: 'Washing Machine Spares',
      slug: 'washing-machine-spares',
      description: 'Drain valves, inlet water solenoids, pulsator rollers, motor drive belts and lint filters.',
      image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=400&q=80',
      active: true,
    },
    {
      id: 'pcat-microwave',
      name: 'Microwave Components',
      slug: 'microwave-components',
      description: 'Waveguide sheets, high-voltage diodes, turntable couplers, glass plates and microswitches.',
      image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=400&q=80',
      active: true,
    },
    {
      id: 'pcat-geyser',
      name: 'Geyser & Water Heater Parts',
      slug: 'geyser-parts',
      description: 'Heavy copper heating coils, stem thermostats, thermal cut-outs and non-return safety valves.',
      image: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=400&q=80',
      active: true,
    },
  ];

  for (const pcat of productCategories) {
    await prisma.productCategory.upsert({
      where: { slug: pcat.slug },
      update: pcat,
      create: pcat,
    });
  }
  console.log(`✓ Seeded ${productCategories.length} Product Categories`);

  // 4. Products & Product Images
  const products = [
    {
      id: 'prod-ro-membrane-80gpd',
      categoryId: 'pcat-water-purifier',
      name: '75/80 GPD High-Rejection RO Membrane',
      slug: '75-80-gpd-high-rejection-ro-membrane',
      sku: 'RO-MEM-001',
      brand: 'AquaShield',
      description: 'Thin-film composite (TFC) reverse osmosis membrane designed to remove up to 97% of total dissolved solids (TDS), fluoride, lead, and microscopic bacteria.',
      specifications: {
        capacity: '75 to 80 Gallons Per Day (GPD)',
        maxTds: '2000 ppm input water',
        saltRejection: '96% - 98%',
        operatingPressure: '60 - 100 PSI',
      },
      compatibility: ['Kent Grand/Prime', 'Aquaguard Geneus', 'Livpure', 'Pureit Classic', 'Universal RO'],
      price: new Prisma.Decimal(1499.00),
      salePrice: new Prisma.Decimal(999.00),
      stockQuantity: 42,
      lowStockThreshold: 10,
      active: true,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80',
          altText: 'AquaShield 80 GPD RO Membrane',
          sortOrder: 0,
        },
      ],
    },
    {
      id: 'prod-ro-booster-pump-100gpd',
      categoryId: 'pcat-water-purifier',
      name: '100 GPD Copper-Wound RO Booster Pump (24V DC)',
      slug: '100-gpd-copper-wound-ro-booster-pump-24v',
      sku: 'RO-PUMP-002',
      brand: 'HydroForce Pro',
      description: 'Heavy-duty 24V DC diaphragm pump engineered with pure electrolytic copper winding for quiet, leak-free pressure boost.',
      specifications: {
        voltage: '24V DC, 1.2 Amp',
        suctionFlow: '1.8 Liters/minute open flow',
        workingPressure: '125 PSI max output',
        connectorType: '3/8" Push-Fit Thread',
      },
      compatibility: ['Universal 10L - 15L domestic RO purifiers'],
      price: new Prisma.Decimal(1899.00),
      salePrice: new Prisma.Decimal(1349.00),
      stockQuantity: 28,
      lowStockThreshold: 5,
      active: true,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
          altText: 'HydroForce 100 GPD Booster Pump',
          sortOrder: 0,
        },
      ],
    },
    {
      id: 'prod-ac-capacitor-45mfd',
      categoryId: 'pcat-ac',
      name: 'Dual Run AC Compressor Capacitor 45+5 µF (450V)',
      slug: 'dual-run-ac-compressor-capacitor-45-5-mfd',
      sku: 'AC-CAP-045',
      brand: 'VoltaGuard',
      description: 'Explosion-proof aluminum cylindrical capacitor with metalized polypropylene dielectric film. Designed to withstand summer peak temperatures.',
      specifications: {
        capacitance: '45 µF (Compressor) + 5 µF (Fan Motor)',
        voltageRating: '450V AC, 50/60 Hz',
        tolerance: '±5%',
        operatingTemp: '-40°C to +85°C',
      },
      compatibility: ['1.5 Ton Split ACs', 'Voltas', 'LG', 'Daikin', 'Samsung', 'Blue Star', 'Carrier'],
      price: new Prisma.Decimal(649.00),
      salePrice: new Prisma.Decimal(399.00),
      stockQuantity: 75,
      lowStockThreshold: 15,
      active: true,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
          altText: 'VoltaGuard Dual Run Capacitor',
          sortOrder: 0,
        },
      ],
    },
    {
      id: 'prod-fridge-ptc-relay',
      categoryId: 'pcat-refrigerator',
      name: 'Universal 1-Pin PTC Compressor Starter Relay + OLP Set',
      slug: 'universal-ptc-compressor-starter-relay-olp',
      sku: 'REF-RELAY-001',
      brand: 'FrostCore',
      description: 'Solid-state ceramic PTC resistor starter and bi-metallic overload protector (OLP) to safeguard hermetic refrigerator compressors.',
      specifications: {
        resistance: '15 to 22 Ohm at 25°C',
        powerRating: '1/6 HP to 1/3 HP',
        pins: '1-Pin Terminal Connection',
      },
      compatibility: ['Whirlpool', 'Godrej', 'Haier', 'Kelvinator', 'Samsung single & double door refrigerators'],
      price: new Prisma.Decimal(399.00),
      salePrice: new Prisma.Decimal(249.00),
      stockQuantity: 60,
      lowStockThreshold: 12,
      active: true,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
          altText: 'FrostCore PTC Starter Relay',
          sortOrder: 0,
        },
      ],
    },
    {
      id: 'prod-washing-inlet-valve',
      categoryId: 'pcat-washing-machine',
      name: 'Automatic Washing Machine Water Inlet Solenoid Valve (Dual Way)',
      slug: 'washing-machine-water-inlet-solenoid-valve-dual',
      sku: 'WM-VALVE-002',
      brand: 'WashPro',
      description: 'Dual-coil 220V electromagnetic water flow regulator with built-in stainless steel mesh filter.',
      specifications: {
        voltage: 'AC 220-240V 50Hz',
        waterPressure: '0.02 - 0.8 MPa',
        nozzles: 'Dual Outlets (Wash & Rinse)',
      },
      compatibility: ['IFB', 'LG Top & Front Load', 'Samsung Fully Automatic', 'Bosch Serie 4/6'],
      price: new Prisma.Decimal(699.00),
      salePrice: new Prisma.Decimal(499.00),
      stockQuantity: 34,
      lowStockThreshold: 8,
      active: true,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=800&q=80',
          altText: 'WashPro Water Inlet Valve',
          sortOrder: 0,
        },
      ],
    },
    {
      id: 'prod-geyser-heating-coil',
      categoryId: 'pcat-geyser',
      name: '2000W Heavy-Duty Pure Copper Water Heater Coil with Thermostat Pocket',
      slug: '2000w-heavy-duty-copper-geyser-heating-coil',
      sku: 'GEY-COIL-2000',
      brand: 'ThermoMaster',
      description: 'High thermal conductivity triangular-flange copper immersion heating element with magnesium anode pocket for anti-scale protection.',
      specifications: {
        wattage: '2000 Watts (2 kW)',
        voltage: '230V AC Single Phase',
        flangeType: 'Standard 1.25" / Triangular 3-Bolt Mounting',
        material: 'Grade-A Nickel-Plated Copper Tubing',
      },
      compatibility: ['Bajaj', 'Racold', 'Venus', 'AO Smith', 'Crompton storage water heaters (10L - 25L)'],
      price: new Prisma.Decimal(999.00),
      salePrice: new Prisma.Decimal(699.00),
      stockQuantity: 40,
      lowStockThreshold: 10,
      active: true,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80',
          altText: 'ThermoMaster 2000W Heating Coil',
          sortOrder: 0,
        },
      ],
    },
  ];

  for (const prod of products) {
    const { images, ...prodData } = prod;
    await prisma.product.upsert({
      where: { slug: prodData.slug },
      update: prodData,
      create: prodData,
    });

    // Seed primary product image
    if (images && images.length > 0) {
      await prisma.productImage.deleteMany({
        where: { productId: prod.id },
      });
      for (const img of images) {
        await prisma.productImage.create({
          data: {
            productId: prod.id,
            url: img.url,
            altText: img.altText,
            sortOrder: img.sortOrder,
          },
        });
      }
    }
  }
  console.log(`✓ Seeded ${products.length} Products with images`);

  // 5. Seed Default Admin & Technician Staff Users (Idempotent)
  // NOTE: these are real bcrypt hashes (10 salt rounds, verified against the
  // documented plaintext passwords below) for LOCAL/DEMO seeding only.
  // Change these passwords immediately after first login in any real deployment.
  const adminPasswordHash = '$2b$10$DRlWBJFjwxaW21MEyW2R9u2lZsAoiiA45d8b./2ZUqzSfNY8uaDr.'; // bcrypt for 'Admin@2026Sohom'
  const techPasswordHash = '$2b$10$aHwEeifv1ztrQSQOpXdyhuDq.FyVkXACPKLAF4J5O6Auw/gvUGwcG'; // bcrypt for 'Tech@2026Sohom'

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sohomenterprises.com' },
    update: { role: 'ADMIN' },
    create: {
      name: 'Sohom Admin',
      email: 'admin@sohomenterprises.com',
      phone: '9830000001',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  const techUser = await prisma.user.upsert({
    where: { email: 'technician@sohomenterprises.com' },
    update: { role: 'TECHNICIAN' },
    create: {
      name: 'Rajesh Mukherjee',
      email: 'technician@sohomenterprises.com',
      phone: '9830000002',
      passwordHash: techPasswordHash,
      role: 'TECHNICIAN',
      emailVerified: true,
    },
  });

  await prisma.technician.upsert({
    where: { userId: techUser.id },
    update: {},
    create: {
      userId: techUser.id,
      employeeCode: 'SE-TECH-001',
      skills: ['Water Purifiers', 'Air Conditioners', 'Refrigerators'],
      serviceAreas: ['Kolkata', 'Salt Lake', 'Howrah'],
      active: true,
    },
  });
  console.log('✓ Seeded Staff Users (Admin & Technician)');

  // 6. Seed Sample Realistic Bookings for Testing Admin & Technician Dashboards
  const sampleCustomer = await prisma.user.upsert({
    where: { email: 'customer.demo@sohomenterprises.com' },
    update: {},
    create: {
      name: 'Anita Roy',
      email: 'customer.demo@sohomenterprises.com',
      phone: '9830099881',
      role: 'CUSTOMER',
      emailVerified: true,
    },
  });

  const sampleAddress = await prisma.address.create({
    data: {
      userId: sampleCustomer.id,
      fullName: 'Anita Roy',
      phone: '9830099881',
      addressLine1: 'Flat 4B, Silver Oak Residency, Sector V',
      city: 'Salt Lake',
      state: 'West Bengal',
      pincode: '700091',
      landmark: 'Near Wipro Circle',
      isDefault: true,
    },
  }).catch(() => null) || await prisma.address.findFirst({ where: { userId: sampleCustomer.id } });

  const techProfile = await prisma.technician.findUnique({ where: { userId: techUser.id } });

  if (sampleAddress && techProfile) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 2);

    const sampleBookings = [
      {
        bookingNumber: 'SE-BK-2026-001',
        userId: sampleCustomer.id,
        serviceId: 'srv-ac',
        technicianId: techProfile.id,
        addressId: sampleAddress.id,
        appliance: 'Voltas 1.5 Ton Split AC',
        problemDescription: 'Unit turns on but cooling is weak. Filter clean but indoor coil seems choked with dust.',
        preferredDate: today,
        preferredTimeSlot: '10:00 AM - 01:00 PM',
        status: 'TECHNICIAN_ASSIGNED' as const,
        estimatedAmount: new Prisma.Decimal(499.00),
        customerNotes: 'Please ring bell twice, 4th floor.',
      },
      {
        bookingNumber: 'SE-BK-2026-002',
        userId: sampleCustomer.id,
        serviceId: 'srv-refrigerator',
        technicianId: techProfile.id,
        addressId: sampleAddress.id,
        appliance: 'Samsung Frost Free Refrigerator',
        problemDescription: 'Freezer is working fine but refrigerator compartment below is completely warm.',
        preferredDate: today,
        preferredTimeSlot: '02:00 PM - 05:00 PM',
        status: 'IN_PROGRESS' as const,
        estimatedAmount: new Prisma.Decimal(399.00),
        technicianNotes: 'Inspected evaporator fan motor. Replacing defrost timer and fan relay.',
      },
      {
        bookingNumber: 'SE-BK-2026-003',
        userId: sampleCustomer.id,
        serviceId: 'srv-washing-machine',
        technicianId: techProfile.id,
        addressId: sampleAddress.id,
        appliance: 'LG 7.0 Kg Front Load Washer',
        problemDescription: 'Severe vibration and loud thumping noise during final 1200 RPM spin cycle.',
        preferredDate: yesterday,
        preferredTimeSlot: '11:00 AM - 02:00 PM',
        status: 'COMPLETED' as const,
        estimatedAmount: new Prisma.Decimal(399.00),
        finalAmount: new Prisma.Decimal(749.00),
        technicianNotes: 'Replaced worn-out suspension dampers and recalibrated machine leveling feet. Tested under load.',
        completedAt: yesterday,
      },
      {
        bookingNumber: 'SE-BK-2026-004',
        userId: sampleCustomer.id,
        serviceId: 'srv-aquaguard',
        technicianId: null,
        addressId: sampleAddress.id,
        appliance: 'Kent Grand Plus RO',
        problemDescription: 'Water dispensing speed is extremely slow and purring noise heard from booster pump.',
        preferredDate: tomorrow,
        preferredTimeSlot: '09:00 AM - 12:00 PM',
        status: 'CONFIRMED' as const,
        estimatedAmount: new Prisma.Decimal(399.00),
      },
      {
        bookingNumber: 'SE-BK-2026-005',
        userId: sampleCustomer.id,
        serviceId: 'srv-microwave',
        technicianId: null,
        addressId: sampleAddress.id,
        appliance: 'IFB 30L Convection Microwave',
        problemDescription: 'Sparking noticed inside cavity when microwave heat mode is activated.',
        preferredDate: tomorrow,
        preferredTimeSlot: '03:00 PM - 06:00 PM',
        status: 'PENDING' as const,
        estimatedAmount: new Prisma.Decimal(349.00),
      },
    ];

    for (const bk of sampleBookings) {
      await prisma.serviceBooking.upsert({
        where: { bookingNumber: bk.bookingNumber },
        update: {
          status: bk.status,
          technicianId: bk.technicianId,
          technicianNotes: bk.technicianNotes,
          finalAmount: bk.finalAmount,
        },
        create: bk,
      });
    }
    console.log(`✓ Seeded ${sampleBookings.length} Realistic Sample Service Bookings`);
  }


  console.log('--- Database Seeding Complete ---');

}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
