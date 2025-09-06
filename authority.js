// === CONFIGURAÇÃO INICIAL E VERIFICAÇÃO DE ACESSO ===
const API_BASE = window.API_BASE || 'https://acaocidada.duckdns.org:3000';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Função para obter os headers de autenticação
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});

// Verifica se o usuário é uma autoridade, senão redireciona
if (!token || user.tipo !== 'autoridade') {
  alert('Acesso negado.');
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

async function carregarEventos(){
  try {
    const r = await fetch(`${API_BASE}/authority/events`, { headers: getAuthHeaders() });
    if (!r.ok) throw new Error('Falha ao carregar eventos.');
    const evs = await r.json();
    const wrap = document.getElementById('evs');
    wrap.innerHTML = evs.length ? '' : '<p class="muted">Nenhum evento aprovado no momento.</p>';

    for (const e of evs){
      const div = document.createElement('div');
      div.className='card';
      div.innerHTML = `
        <strong>${e.nome}</strong> — ${e.endereco}<br>
        Situação: <strong>${e.situacao}</strong><br>
        <p class="muted">${e.descricao}</p>
        ${e.situacao === 'aprovado' ? `<button data-resolve="${e.id_evento}">Marcar como resolvido</button>` : ''}
      `;
      wrap.appendChild(div);
    }
    
    document.querySelectorAll('[data-resolve]').forEach(b => b.onclick = async () => {
      const id = b.getAttribute('data-resolve');
      await fetch(`${API_BASE}/authority/events/${id}/resolve`, {method:'POST', headers: getAuthHeaders()});
      showToast('Evento marcado como resolvido!');
      carregarEventos();
    });
  } catch(error) {
    showToast(error.message, 'error');
  }
}

carregarEventos();