const { query } = require('../config/db');

// GET /api/categories
exports.getCategories = async (req, res) => {
  try {
    const { type } = req.query;
let sql = `SELECT * FROM categories WHERE user_id = $1`;
    const params = [req.user.id];
    if (type) { sql += ` AND type = $2`; params.push(type); }
    sql += ` ORDER BY is_default DESC, name ASC`;
    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'ক্যাটাগরি লোড করতে সমস্যা হয়েছে।' });
  }
};

// POST /api/categories
exports.createCategory = async (req, res) => {
  try {
    const { name, name_bn, type, icon, color } = req.body;
    const result = await query(
      `INSERT INTO categories (user_id, name, name_bn, type, icon, color) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, name, name_bn, type, icon || 'tag', color || '#6B7280']
    );
    res.status(201).json({ success: true, message: 'ক্যাটাগরি তৈরি হয়েছে।', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'ক্যাটাগরি তৈরি করতে সমস্যা হয়েছে।' });
  }
};

// PUT /api/categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const { name, name_bn, icon, color } = req.body;
    const result = await query(
      `UPDATE categories SET name=COALESCE($1,name), name_bn=COALESCE($2,name_bn), icon=COALESCE($3,icon), color=COALESCE($4,color)
       WHERE id=$5 AND user_id=$6 RETURNING *`,
      [name, name_bn, icon, color, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'ক্যাটাগরি পাওয়া যায়নি।' });
    res.json({ success: true, message: 'ক্যাটাগরি আপডেট হয়েছে।', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'আপডেট করতে সমস্যা হয়েছে।' });
  }
};

// DELETE /api/categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const check = await query('SELECT is_default FROM categories WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'ক্যাটাগরি পাওয়া যায়নি।' });
    if (check.rows[0].is_default) return res.status(400).json({ success: false, message: 'ডিফল্ট ক্যাটাগরি মুছা যাবে না।' });
    await query('DELETE FROM categories WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'ক্যাটাগরি মুছে গেছে।' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'মুছতে সমস্যা হয়েছে।' });
  }
};
