// Defina o endereço da sua API. Para desenvolvimento local, pode ser 'http://localhost:3000'.
const API_BASE = 'https://acaocidada.duckdns.org/'; 

// === FUNÇÃO DE NOTIFICAÇÃO (Toast) ===
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}

// === LÓGICA DA PÁGINA ===
const btnLogin = document.getElementById('btnLogin');
const btnRegister = document.getElementById('btnRegister');
const goRegister = document.getElementById('goRegister');
const goLogin = document.getElementById('goLogin');

const loginCard = document.getElementById('loginCard');
const registerCard = document.getElementById('registerCard');

if (goRegister) goRegister.onclick = (e) => { e.preventDefault(); loginCard.style.display = 'none'; registerCard.style.display = 'block'; };
if (goLogin) goLogin.onclick = (e) => { e.preventDefault(); registerCard.style.display = 'none'; loginCard.style.display = 'block'; };

if (btnRegister) btnRegister.onclick = async () => {
  const nome = document.getElementById('r_nome').value;
  const telefone = document.getElementById('r_telefone').value;
  const email = document.getElementById('r_email').value;
  const senha = document.getElementById('r_senha').value;

  if (!nome || !email || !senha || !telefone) {
    return showToast('Por favor, preencha todos os campos.', 'error');
  }

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ nome, telefone, email, senha }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Erro no servidor');
    
    // Loga automaticamente após o cadastro
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    showToast('Cadastro realizado com sucesso!', 'success');
    window.location.href = 'homeUsuario.html';
  } catch (error) {
    showToast(error.message, 'error');
  }
};

if (btnLogin) btnLogin.onclick = async () => {
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const tipo = document.getElementById('tipo').value;

  if (!email || !senha) {
    return showToast('Email e senha são obrigatórios.', 'error');
  }
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email, senha, tipo }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Login inválido');
    
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));

    // Redireciona com base no tipo de usuário
    switch (result.user.tipo) {
      case 'admin':
        window.location.href = 'admin.html';
        break;
      case 'autoridade':
        window.location.href = 'autoridade.html';
        break;
      default:
        window.location.href = 'homeUsuario.html';
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
};