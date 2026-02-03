# 后端 API 测试说明

## 已完成接口列表

### 1. 用户个人资料修改
**接口**: `PUT /api/auth/profile`  
**Headers**: `Authorization: Bearer <token>`  
**Body**:
```json
{
  "name": "新昵称",
  "password": "新密码（可选）"
}
```

### 2. 下载批量导入模板
**接口**: `GET /api/members/template/download`  
**Headers**: `Authorization: Bearer <token>`  
**说明**: 自动下载 Excel 模板文件

### 3. 批量导入成员
**接口**: `POST /api/members/import`  
**Headers**: `Authorization: Bearer <token>`  
**Content-Type**: `multipart/form-data`  
**Body**: 
- file: Excel/CSV 文件

### 4. 成员文件上传
**接口**: `POST /api/members/:memberId/upload`  
**Headers**: `Authorization: Bearer <token>`  
**Content-Type**: `multipart/form-data`  
**支持的字段名**:
- id_front (ID正面)
- id_back (ID背面)
- cert1 (证件1)
- cert1_1 (证件1-1)
- cert1_3 (证件1-3)
- cert2 (证件2)
- cert2_1 (证件2-1)
- cert3 (证件3)
- cert3_1 (证件3-1)
- video1 (视频1)
- video2 (视频2)

### 5. 打包下载成员资料
**接口**: `GET /api/members/:memberId/download`  
**Headers**: `Authorization: Bearer <token>`  
**说明**: 返回 ZIP 压缩包

### 6. 批量设置金额
**接口**: `POST /api/members/bulk/amount`  
**Headers**: `Authorization: Bearer <token>`  
**Body**:
```json
{
  "memberIds": [1, 2, 3],
  "monthlyAmount": 5000
}
```

### 7. 批量设置合同
**接口**: `POST /api/members/bulk/contract`  
**Headers**: `Authorization: Bearer <token>`  
**Body**:
```json
{
  "memberIds": [1, 2, 3],
  "signDate": "2026-02-01",
  "years": 2
}
```

## 测试步骤

1. 先登录获取 token
2. 测试下载模板
3. 上传导入文件
4. 为成员上传资料
5. 测试批量操作

## 注意事项

- 所有接口需要认证
- 文件大小限制默认 10MB
- 支持的文件格式: png, jpg, jpeg, pdf, xlsx, csv
- 成员资料按成员ID独立存储在文件夹中
