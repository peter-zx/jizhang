const XLSX = require('xlsx');
const path = require('path');

// 生成 Excel 模板
function generateMemberTemplate() {
  const template = [
    {
      '姓名': '张三',
      '电话': '13800138000',
      '城市': '北京',
      '年龄': 25,
      '性别': '男',
      '地址': '北京市朝阳区'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '成员信息');
  
  return wb;
}

// 下载模板接口
const downloadTemplate = (req, res) => {
  try {
    const wb = generateMemberTemplate();
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=member_template.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('生成模板错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

module.exports = {
  downloadTemplate
};
