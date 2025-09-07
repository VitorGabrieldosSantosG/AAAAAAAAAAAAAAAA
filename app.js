// Defina o endereço da sua API. Para desenvolvimento local, pode ser 'http://localhost:3000'.
const API_BASE = "https://acaocidada.duckdns.org";

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

// === ATUALIZAR PLACEHOLDER DO CAMPO EMAIL BASEADO NO TIPO ===
const emailField = document.getElementById('email');
const tipoField = document.getElementById('tipo');

if (tipoField && emailField) {
  tipoField.onchange = () => {
    const tipo = tipoField.value;
    if (tipo === 'admin') {
      emailField.placeholder = 'Digite seu nome de usuário';
      emailField.previousElementSibling.textContent = 'Nome de usuário'; // Atualiza o label se existir
    } else {
      emailField.placeholder = 'Digite seu email';
      emailField.previousElementSibling.textContent = 'Email'; // Restaura o label
    }
  };
}

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
    const fieldLabel = tipo === 'admin' ? 'Nome de usuário' : 'Email';
    return showToast(`${fieldLabel} e senha são obrigatórios.`, 'error');
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

    // Redireciona com base no ROLE do usuário (corrigido)
    switch (result.user.role) {
      case 'admin':
        window.location.href = 'admin.html';
        break;
      case 'autoridade':
        window.location.href = 'autoridade.html';
        break;
      case 'usuario':
      default:
        window.location.href = 'homeUsuario.html';
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
};