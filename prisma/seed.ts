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
      brandApplicability: 'All Brands',
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
      brandApplicability: 'All Brands',
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

  // Technician functionality is out of scope. Admins are provisioned separately with npm run admin:bootstrap.
  console.log('ℹ Technician seeding disabled; admins are provisioned with admin:bootstrap.');

  // Customer accounts are intentionally not seeded as demo accounts. Public
  // registration creates live CUSTOMER rows in PostgreSQL and keeps customer
  // data scoped to the authenticated user session.
  console.log('ℹ Customer demo account seeding disabled; new customer registrations are database-backed only.');

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
