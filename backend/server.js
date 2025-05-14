const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const basicAuth = require('express-basic-auth');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

// Initialize Supabase client with service role key (bypasses RLS for admin operations)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files (like admin.html)
app.use(express.static(path.join(__dirname)));

// Basic authentication for the admin portal
app.use('/admin', basicAuth({
  users: { [process.env.ADMIN_USERNAME]: process.env.ADMIN_PASSWORD },
  challenge: true,
  unauthorizedResponse: 'Unauthorized: Please provide admin credentials.',
}));

// Serve the admin portal HTML
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// API to fetch all users
app.get('/admin/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, username, name, created_at')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    res.json(data);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users: ' + error.message });
  }
});

// API to delete a user by ID
app.delete('/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete the user from the users table (this will cascade to auth.users due to ON DELETE CASCADE)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user: ' + error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Admin server running on port ${port}`);
});
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('ADMIN_USERNAME:', process.env.ADMIN_USERNAME);
console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD);