const express = require('express');
const router = Router = express.Router();
const bankController = require('../controllers/bankController');
const { protect } = require('../middleware/auth');

router.get('/', bankController.getBanks);
router.post('/register', protect, bankController.registerBank);
router.get('/nearby', bankController.getNearbyBanks);
router.get('/profile', protect, bankController.getBankProfile);
router.put('/inventory', protect, bankController.updateInventorySelf);
router.get('/:id', bankController.getBankById);
router.put('/:id', protect, bankController.updateBank);
router.patch('/:id/inventory', protect, bankController.updateInventory);

module.exports = router;
