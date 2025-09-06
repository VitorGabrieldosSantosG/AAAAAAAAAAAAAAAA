// === CONFIGURAÇÃO INICIAL E VERIFICAÇÃO DE ACESSO ===
const API_BASE = window.API_BASE || 'https://acaocidada.duckdns.org';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Função para obter os headers de autenticação
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});

// Verifica se o usuário é um administrador, senão redireciona
if (!token || user.tipo !== 'admin') {
  alert('Acesso negado.'); // Um alerta aqui é aceitável, pois é uma falha de acesso
  window.location.href = 'index.html';
}

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

async function carregarPendentes(){
  try {
    const r = await fetch(`${API_BASE}/admin/events/pending`, { headers: getAuthHeaders() });
    if (!r.ok) throw new Error('Falha ao carregar eventos pendentes.');
    const evs = await r.json();
    const wrap = document.getElementById('pendentes');
    wrap.innerHTML = evs.length ? '' : '<p class="muted">Nenhum evento pendente.</p>';

    for (const e of evs){
      const div = document.createElement('div');
      div.className='card';
      div.innerHTML = `
        <strong>${e.nome}</strong> — ${e.endereco} — ${e.classificacao}<br>
        <p class="muted">${e.descricao || 'Sem descrição.'}</p>
        <button data-aprovar="${e.id_evento}">Aprovar</button>
        <button data-rejeitar="${e.id_evento}" class="ghost">Rejeitar</button>
      `;
      wrap.appendChild(div);
    }

    document.querySelectorAll('[data-aprovar]').forEach(b => b.onclick = async () => {
      const id = b.getAttribute('data-aprovar');
      await fetch(`${API_BASE}/admin/events/${id}/approve`, {method:'POST', headers: getAuthHeaders()});
      showToast('Evento aprovado!');
      carregarPendentes();
    });

    document.querySelectorAll('[data-rejeitar]').forEach(b => b.onclick = async () => {
      const id = b.getAttribute('data-rejeitar');
      await fetch(`${API_BASE}/admin/events/${id}/reject`, {method:'POST', headers: getAuthHeaders()});
      showToast('Evento rejeitado.');
      carregarPendentes();
    });
  } catch(error) {
    showToast(error.message, 'error');
  }
}

async function carregarUsuarios(){
  try {
    const r = await fetch(`${API_BASE}/admin/users`, { headers: getAuthHeaders() });
    if (!r.ok) throw new Error('Falha ao carregar usuários.');
    const us = await r.json();
    const wrap = document.getElementById('usuarios');
    wrap.innerHTML = us.length ? '' : '<p class="muted">Nenhum usuário encontrado.</p>';

    for (const u of us){
      const div = document.createElement('div');
      div.className='card';
      div.innerHTML = `
        <strong>${u.nome}</strong> <br> 
        <span class="muted">${u.email} — ${u.telefone}</span> <br>
        <button data-remover="${u.id_usuario}" class="ghost">Remover</button>
      `;
      wrap.appendChild(div);
    }

    document.querySelectorAll('[data-remover]').forEach(b => b.onclick = async () => {
      const id = b.getAttribute('data-remover');
      if (confirm('Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.')) {
        await fetch(`${API_BASE}/admin/users/${id}`, {method:'DELETE', headers: getAuthHeaders()});
        showToast('Usuário removido.');
        carregarUsuarios();
      }
    });
  } catch(error) {
    showToast(error.message, 'error');
  }
}

carregarPendentes();
carregarUsuarios();
