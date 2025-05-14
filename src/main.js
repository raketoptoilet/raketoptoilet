import { supabase } from './supabase.js';

console.log('main.js loaded');

function showPage(pageId) {
  console.log('Showing page:', pageId);
  document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
  document.getElementById(pageId).classList.remove('hidden');
}

async function register() {
  try {
    console.log('Register button clicked');
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!name || !email || !username || !password) {
      alert('Vul alle velden in!');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, name } },
    });

    if (error) throw new Error('Fout bij registratie: ' + error.message);

    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          username,
          name,
        });

      if (profileError) throw new Error('Fout bij het aanmaken van profiel: ' + profileError.message);

      alert('Registratie succesvol! Controleer je e-mail om je account te bevestigen.');
      console.log('Registered user:', data.user);
    }
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

async function login() {
  try {
    console.log('Login button clicked');
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      alert('Vul alle velden in!');
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error('Fout bij inloggen: ' + error.message);

    if (data.user) {
      alert('Inloggen succesvol! Welkom, ' + (data.user.user_metadata.name || 'gebruiker'));
      updateAuthNav(true);
      showPage('home');
    } else {
      alert('Inloggen mislukt: Geen gebruikersdata ontvangen.');
    }
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

async function logout() {
  try {
    console.log('Logout button clicked');
    const { error } = await supabase.auth.signOut();

    if (error) throw new Error('Fout bij uitloggen: ' + error.message);

    alert('Je bent uitgelogd.');
    updateAuthNav(false);
    showPage('home');
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

function updateAuthNav(isLoggedIn) {
  console.log('Updating auth nav, logged in:', isLoggedIn);
  const authNav = document.getElementById('auth-nav');
  if (isLoggedIn) {
    authNav.innerHTML = `<button id="logout-btn" class="text-lg">Uitloggen</button>`;
    document.getElementById('logout-btn').addEventListener('click', logout);
  } else {
    authNav.innerHTML = `<button id="login-nav-btn" class="text-lg">Inloggen</button>`;
    document.getElementById('login-nav-btn').addEventListener('click', () => showPage('login'));
  }
}

async function checkSession() {
  try {
    console.log('Checking session...');
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('User is logged in:', user);
      updateAuthNav(true);
    } else {
      console.log('No user logged in');
      updateAuthNav(false);
    }
  } catch (error) {
    console.error('Error checking session:', error);
  }
}

// Add event listeners for navigation buttons
document.getElementById('home-btn').addEventListener('click', () => showPage('home'));
document.getElementById('login-nav-btn').addEventListener('click', () => showPage('login'));

// Add event listeners for form buttons
document.getElementById('register-btn').addEventListener('click', register);
document.getElementById('login-btn').addEventListener('click', login);

// Initialize the app
checkSession();
showPage('home');