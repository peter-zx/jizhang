const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const templateController = require('../controllers/templateController');
const { authMiddleware, distributorOrAdmin } = require('../middleware/auth');
const { memberUpload, tempUpload } = require('../utils/upload');

router.use(authMiddleware);
router.use(distributorOrAdmin);

// 下载导入模板
router.get('/template/download', templateController.downloadTemplate);

router.get('/', memberController.getMembers);
router.get('/expiring', memberController.getExpiringDocuments);
router.get('/:id', memberController.getMemberById);
router.post('/', memberController.createMember);
router.put('/:id', memberController.updateMember);
router.delete('/:id', memberController.deleteMember);

// 文件上传相关
router.post('/:id/upload', memberUpload.fields([
  { name: 'id_front', maxCount: 1 },
  { name: 'id_back', maxCount: 1 },
  { name: 'cert1', maxCount: 1 },
  { name: 'cert1_1', maxCount: 1 },
  { name: 'cert1_3', maxCount: 1 },
  { name: 'cert2', maxCount: 1 },
  { name: 'cert2_1', maxCount: 1 },
  { name: 'cert3', maxCount: 1 },
  { name: 'cert3_1', maxCount: 1 },
  { name: 'video1', maxCount: 1 },
  { name: 'video2', maxCount: 1 }
]), memberController.uploadMemberFiles);

router.get('/:id/download', memberController.downloadMemberFiles);

// 批量操作
router.post('/import', tempUpload.single('file'), memberController.importMembers);
router.post('/bulk/amount', memberController.bulkSetAmount);
router.post('/bulk/contract', memberController.bulkSetContract);

module.exports = router;
