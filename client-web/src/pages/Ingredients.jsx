import { motion } from 'framer-motion';

const Ingredients = () => {
  const ingredientCategories = [
    {
      name: 'Tea Leaves',
      items: [
        { name: 'Green Tea', origin: 'China', description: 'Unoxidized leaves with fresh, grassy flavor' },
        { name: 'Black Tea', origin: 'India', description: 'Fully oxidized leaves with robust flavor' },
        { name: 'Oolong Tea', origin: 'Taiwan', description: 'Partially oxidized, complex flavor profile' },
        { name: 'White Tea', origin: 'Fujian, China', description: 'Minimal processing, delicate taste' }
      ]
    },
    {
      name: 'Herbs & Flowers',
      items: [
        { name: 'Chamomile', origin: 'Egypt', description: 'Calming floral notes' },
        { name: 'Lavender', origin: 'France', description: 'Aromatic and soothing' },
        { name: 'Peppermint', origin: 'USA', description: 'Refreshing and cooling' },
        { name: 'Hibiscus', origin: 'Africa', description: 'Tart and vibrant' }
      ]
    },
    {
      name: 'Spices',
      items: [
        { name: 'Cinnamon', origin: 'Sri Lanka', description: 'Sweet and warming' },
        { name: 'Ginger', origin: 'India', description: 'Spicy and invigorating' },
        { name: 'Cardamom', origin: 'Guatemala', description: 'Sweet and aromatic' },
        { name: 'Clove', origin: 'Indonesia', description: 'Rich and intense' }
      ]
    },
    {
      name: 'Natural Additives',
      items: [
        { name: 'Honey', origin: 'Local', description: 'Natural sweetener' },
        { name: 'Lemon', origin: 'Mediterranean', description: 'Citrus brightness' },
        { name: 'Vanilla', origin: 'Madagascar', description: 'Smooth and creamy' },
        { name: 'Rose Petals', origin: 'Bulgaria', description: 'Floral elegance' }
      ]
    }
  ];

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-b from-white to-primary-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold mb-4 text-gray-900">Our Ingredients</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We source only the finest ingredients from around the world to ensure 
            the highest quality and authentic flavors in every cup
          </p>
        </motion.div>

        {/* Quality Promise */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">🌿</div>
              <h3 className="text-xl font-bold mb-2">100% Organic</h3>
              <p className="text-gray-600">Certified organic ingredients</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🌍</div>
              <h3 className="text-xl font-bold mb-2">Ethically Sourced</h3>
              <p className="text-gray-600">Fair trade partnerships</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">✨</div>
              <h3 className="text-xl font-bold mb-2">Premium Quality</h3>
              <p className="text-gray-600">Hand-selected excellence</p>
            </div>
          </div>
        </motion.div>

        {/* Ingredient Categories */}
        {ingredientCategories.map((category, categoryIndex) => (
          <motion.div
            key={category.name}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + categoryIndex * 0.1 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold mb-6 text-gray-900">{category.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {category.items.map((item, itemIndex) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + categoryIndex * 0.1 + itemIndex * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-primary-500"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                  <p className="text-sm text-primary-600 mb-3">📍 Origin: {item.origin}</p>
                  <p className="text-gray-600">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Sourcing Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-primary-600 text-white rounded-2xl shadow-xl p-8 mt-12"
        >
          <h2 className="text-3xl font-bold mb-4">Our Sourcing Commitment</h2>
          <p className="text-lg mb-4">
            Every ingredient we use is carefully selected from trusted suppliers who share 
            our commitment to quality, sustainability, and ethical practices.
          </p>
          <p className="text-lg">
            We regularly visit our suppliers to ensure the highest standards are maintained 
            from farm to cup.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Ingredients;
