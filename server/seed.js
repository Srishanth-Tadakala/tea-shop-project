import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Admin, TeaItem, ShopStatus, ItemLibrary } from './src/models/index.js';

dotenv.config();

/**
 * Database Seed Script
 * Seeds the database with initial admin user, shop status, and sample tea items
 * Run with: node seed.js
 */

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Admin.deleteMany({});
    await TeaItem.deleteMany({});
    await ShopStatus.deleteMany({});
    await ItemLibrary.deleteMany({});

    // 1. Create Admin User
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await Admin.create({
      email: 'admin@teashop.com',
      password: adminPassword,
      role: 'superadmin',
      isActive: true
    });
    console.log('✅ Admin created: admin@teashop.com / admin123');

    // 2. Create Shop Status
    console.log('🏪 Creating shop status...');
    const shopStatus = await ShopStatus.create({
      isOpen: true,
      message: 'Welcome! We are open for business.',
      openingTime: '9:00 AM',
      closingTime: '6:00 PM',
      daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      updatedBy: admin._id
    });
    console.log('✅ Shop status created');

    // 3. Create Sample Tea Items
    console.log('🍵 Creating sample tea items...');
    const teaItems = [
      {
        name: 'Green Dragon',
        description: 'Premium Chinese green tea with a smooth, refreshing taste',
        price: 4.99,
        category: 'green',
        ingredients: ['Green tea leaves', 'Natural flavoring'],
        isAvailable: true,
        stock: 50,
        rating: 4.8
      },
      {
        name: 'Earl Grey Classic',
        description: 'Traditional black tea infused with bergamot oil',
        price: 3.99,
        category: 'black',
        ingredients: ['Black tea', 'Bergamot oil'],
        isAvailable: true,
        stock: 75,
        rating: 4.7
      },
      {
        name: 'Jasmine Pearl',
        description: 'Hand-rolled green tea pearls with jasmine flowers',
        price: 5.99,
        category: 'green',
        ingredients: ['Green tea', 'Jasmine flowers'],
        isAvailable: true,
        stock: 30,
        rating: 4.9
      },
      {
        name: 'Chamomile Dream',
        description: 'Caffeine-free herbal blend for relaxation',
        price: 3.49,
        category: 'herbal',
        ingredients: ['Chamomile flowers', 'Lavender', 'Lemon balm'],
        isAvailable: true,
        stock: 60,
        rating: 4.6
      },
      {
        name: 'Oolong Breeze',
        description: 'Semi-oxidized tea with a complex flavor profile',
        price: 5.49,
        category: 'oolong',
        ingredients: ['Oolong tea leaves'],
        isAvailable: true,
        stock: 40,
        rating: 4.8
      },
      {
        name: 'Peppermint Fresh',
        description: 'Pure peppermint leaves for a refreshing experience',
        price: 2.99,
        category: 'herbal',
        ingredients: ['Peppermint leaves'],
        isAvailable: true,
        stock: 80,
        rating: 4.5
      },
      {
        name: 'White Peony',
        description: 'Delicate white tea with subtle sweet notes',
        price: 6.99,
        category: 'white',
        ingredients: ['White tea buds', 'Silver needle'],
        isAvailable: true,
        stock: 25,
        rating: 4.9
      },
      {
        name: 'Masala Chai',
        description: 'Spiced black tea blend with authentic Indian spices',
        price: 4.49,
        category: 'blend',
        ingredients: ['Black tea', 'Cinnamon', 'Cardamom', 'Ginger', 'Cloves'],
        isAvailable: true,
        stock: 55,
        rating: 4.7
      },
      {
        name: 'Rooibos Sunset',
        description: 'Caffeine-free South African red tea',
        price: 3.99,
        category: 'herbal',
        ingredients: ['Rooibos', 'Vanilla', 'Orange peel'],
        isAvailable: false,
        stock: 0,
        rating: 4.4
      },
      {
        name: 'Matcha Supreme',
        description: 'Premium ceremonial grade matcha powder',
        price: 8.99,
        category: 'green',
        ingredients: ['Stone-ground matcha leaves'],
        isAvailable: true,
        stock: 20,
        rating: 5.0
      }
    ];

    const createdItems = await TeaItem.insertMany(teaItems);
    console.log(`✅ Created ${createdItems.length} tea items`);

    // 4. Create Item Library Templates
    console.log('📚 Creating item library templates...');
    const libraryTemplates = [
      {
        name: 'Green Tea Base',
        description: 'Standard green tea template',
        price: 3.99,
        category: 'green',
        ingredients: ['Green tea leaves'],
        usageCount: 0
      },
      {
        name: 'Black Tea Base',
        description: 'Standard black tea template',
        price: 3.49,
        category: 'black',
        ingredients: ['Black tea leaves'],
        usageCount: 0
      },
      {
        name: 'Herbal Blend Base',
        description: 'Standard herbal blend template',
        price: 2.99,
        category: 'herbal',
        ingredients: ['Herbal mix'],
        usageCount: 0
      }
    ];

    const createdTemplates = await ItemLibrary.insertMany(libraryTemplates);
    console.log(`✅ Created ${createdTemplates.length} library templates`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   👤 Admin: admin@teashop.com / admin123`);
    console.log(`   🍵 Tea Items: ${createdItems.length}`);
    console.log(`   🏪 Shop Status: ${shopStatus.isOpen ? 'OPEN' : 'CLOSED'}`);
    console.log(`   📚 Library Templates: ${createdTemplates.length}`);
    console.log('\n💡 You can now:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Login at: http://localhost:3000/admin/login');
    console.log('   3. View menu at: http://localhost:3000/menu');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed function
seedDatabase();
