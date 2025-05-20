const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Order = require('./models/Order');

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Leer archivos JSON
const users = JSON.parse(fs.readFileSync(`${__dirname}/_data/users.json`, 'utf-8'));
const categories = JSON.parse(fs.readFileSync(`${__dirname}/_data/categories.json`, 'utf-8'));
const products = JSON.parse(fs.readFileSync(`${__dirname}/_data/products.json`, 'utf-8'));

// Importar datos
const importData = async () => {
  try {
    await User.create(users);
    await Category.create(categories);
    await Product.create(products);

    console.log('Datos importados correctamente');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Eliminar datos
const deleteData = async () => {
  try {
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();

    console.log('Datos eliminados correctamente');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Verificar argumentos para importar o eliminar
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Por favor especifica: -i (importar) o -d (eliminar)');
  process.exit(1);
}