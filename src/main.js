import { supabase } from './supabase.js';

console.log('main.js loaded');

function showPage(pageId) {
  console.log('Showing page:', pageId);
  document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
  document.getElementById(pageId).classList.remove('hidden');

  if (pageId === 'profile') {
    loadProfile();
  }
}

function showLoading(elementId, show) {
  const loadingElement = document.getElementById(elementId);
  if (show) {
    loadingElement.classList.remove('hidden');
  } else {
    loadingElement.classList.add('hidden');
  }
}

async function register() {
  try {
    showLoading('register-loading', true);
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
      alert('Registratie succesvol! Controleer je e-mail om je account te bevestigen.');
      console.log('Registered user:', data.user);
    }
  } catch (error) {
    console.error(error);
    alert(error.message);
  } finally {
    showLoading('register-loading', false);
  }
}

async function login() {
  try {
    showLoading('login-loading', true);
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
      showPage('profile');
    } else {
      alert('Inloggen mislukt: Geen gebruikersdata ontvangen.');
    }
  } catch (error) {
    console.error(error);
    alert(error.message);
  } finally {
    showLoading('login-loading', false);
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

async function loadProfile() {
  try {
    showLoading('profile-loading', true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Je bent niet ingelogd.');
      showPage('login');
      return;
    }

    let { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      if (error.message.includes('JSON object requested, multiple (or no) rows returned')) {
        // No profile exists, create one
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            username: user.user_metadata.username || split_part(user.email, '@', 1),
            name: user.user_metadata.name || 'Gebruiker',
          });

        if (insertError) throw new Error('Fout bij het aanmaken van profiel: ' + insertError.message);

        // Fetch the profile again after creating it
        const { data: newProfile, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (fetchError) throw new Error('Fout bij het laden van profiel: ' + fetchError.message);

        profile = newProfile;
      } else {
        throw new Error('Fout bij het laden van profiel: ' + error.message);
      }
    }

    document.getElementById('profile-name').textContent = profile.name;
    document.getElementById('profile-email').textContent = profile.email;
    document.getElementById('profile-username').textContent = profile.username;

    document.getElementById('edit-name').value = profile.name;
    document.getElementById('edit-username').value = profile.username;
  } catch (error) {
    console.error(error);
    alert(error.message);
  } finally {
    showLoading('profile-loading', false);
  }
}

async function saveProfile() {
  try {
    showLoading('edit-profile-loading', true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Je bent niet ingelogd.');
      showPage('login');
      return;
    }

    const newName = document.getElementById('edit-name').value;
    const newUsername = document.getElementById('edit-username').value;

    if (!newName || !newUsername) {
      alert('Vul alle velden in!');
      return;
    }

    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('username')
      .eq('username', newUsername)
      .neq('id', user.id)
      .single();

    if (existingUser) {
      throw new Error('Gebruikersnaam is al in gebruik.');
    }
    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error('Fout bij het controleren van gebruikersnaam: ' + checkError.message);
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        name: newName,
        username: newUsername,
      })
      .eq('id', user.id);

    if (updateError) throw new Error('Fout bij het bijwerken van profiel: ' + updateError.message);

    const { error: authError } = await supabase.auth.updateUser({
      data: { name: newName, username: newUsername },
    });

    if (authError) throw new Error('Fout bij het bijwerken van gebruikersgegevens: ' + authError.message);

    alert('Profiel bijgewerkt!');
    document.getElementById('edit-profile-form').classList.add('hidden');
    document.getElementById('profile-details').classList.remove('hidden');
    loadProfile();
  } catch (error) {
    console.error(error);
    alert(error.message);
  } finally {
    showLoading('edit-profile-loading', false);
  }
}

function updateAuthNav(isLoggedIn) {
  console.log('Updating auth nav, logged in:', isLoggedIn);
  const authNav = document.getElementById('auth-nav');
  const profileNav = document.getElementById('profile-nav');
  if (isLoggedIn) {
    authNav.innerHTML = `<button id="logout-btn" class="text-lg">Uitloggen</button>`;
    profileNav.classList.remove('hidden');
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('profile-btn').addEventListener('click', () => showPage('profile'));
  } else {
    authNav.innerHTML = `<button id="login-nav-btn" class="text-lg">Inloggen</button>`;
    profileNav.classList.add('hidden');
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

document.getElementById('home-btn').addEventListener('click', () => showPage('home'));
document.getElementById('login-nav-btn').addEventListener('click', () => showPage('login'));
document.getElementById('register-btn').addEventListener('click', register);
document.getElementById('login-btn').addEventListener('click', login);
document.getElementById('edit-profile-btn').addEventListener('click', () => {
  document.getElementById('profile-details').classList.add('hidden');
  document.getElementById('edit-profile-form').classList.remove('hidden');
});
document.getElementById('save-profile-btn').addEventListener('click', saveProfile);

checkSession();
showPage('home');