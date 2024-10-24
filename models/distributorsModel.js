const mongoose = require("mongoose");
const { customAlphabet } = require('nanoid');
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'; // أرقام وحروف صغيرة
const nanoid = customAlphabet(alphabet, 12); // ID بطول 8 خانات 

const distributorSchema = new mongoose.Schema(
  {
    shortId: {
      type: String,
      unique: true, // إضافة فهرس للتأكد من أن القيم فريدة
      default: () => `d${nanoid()}`,
      immutable: true // اجعل القيمة غير قابلة للتعديل
    },
    full_name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      unique: true,
      required: true
    },
    phone_number: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    userType: {
      type: String,
      default: 'Distributor' // نوع المستخدم
    }
  });

module.exports = mongoose.model('Distributors', distributorSchema);