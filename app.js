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

const tipoCadastro = document.getElementById('r_tipo');
const fieldsUsuario = document.getElementById('fieldsUsuario');
const fieldsAutoridade = document.getElementById('fieldsAutoridade');
const fieldsAdmin = document.getElementById('fieldsAdmin');

if (tipoCadastro) {
  tipoCadastro.onchange = () => {
    fieldsUsuario.style.display = (tipoCadastro.value === 'usuario') ? 'block' : 'none';
    fieldsAutoridade.style.display = (tipoCadastro.value === 'autoridade') ? 'block' : 'none';
    fieldsAdmin.style.display = (tipoCadastro.value === 'admin') ? 'block' : 'none';
  };
}


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
  const tipo = document.getElementById('r_tipo').value;
  let body = {}, endpoint = '';

  if (tipo === 'usuario') {
    const nome = document.getElementById('r_nome').value;
    const telefone = document.getElementById('r_telefone').value;
    const email = document.getElementById('r_email').value;
    const senha = document.getElementById('r_senha').value;

    if (!nome || !telefone || !email || !senha)
      return showToast('Preencha todos os campos.', 'error');

    body = { nome, telefone, email, senha };
    endpoint = '/auth/register';
  }

  if (tipo === 'autoridade') {
    const nome = document.getElementById('ra_nome').value;
    const email = document.getElementById('ra_email').value;
    const telefone = document.getElementById('ra_telefone').value;
    const senha = document.getElementById('ra_senha').value;
    const codigo_acesso = document.getElementById('ra_codigo').value;

    if (!nome || !email || !telefone || !senha || !codigo_acesso)
      return showToast('Preencha todos os campos.', 'error');

    body = { nome, email, telefone, senha, codigo_acesso };
    endpoint = '/auth/register-authority';
  }

  if (tipo === 'admin') {
    const nome = document.getElementById('ad_nome').value;
    const senha = document.getElementById('ad_senha').value;
    const classificacao = document.getElementById('ad_classificacao').value;
    const codigo_acesso = document.getElementById('ad_codigo').value;

    if (!nome || !senha || !classificacao || !codigo_acesso)
      return showToast('Preencha todos os campos.', 'error');

    body = { nome, senha, classificacao, codigo_acesso };
    endpoint = '/auth/register-admin';
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Erro no servidor');

    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));

    showToast('Cadastro realizado com sucesso!', 'success');

    // Redireciona de acordo com o tipo
    switch (result.user.role) {
      case 'admin':
        window.location.href = 'admin.html'; break;
      case 'autoridade':
        window.location.href = 'autoridade.html'; break;
      default:
        window.location.href = 'homeUsuario.html';
    }
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