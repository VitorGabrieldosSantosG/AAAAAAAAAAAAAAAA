// === CONFIGURAÇÃO INICIAL E VERIFICAÇÃO DE ACESSO ===
const API_BASE = window.API_BASE || 'https://acaocidada.duckdns.org';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

const getAuthHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` });

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
      toast.classList.add('hide');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// === LÓGICA DA PÁGINA ===
async function carregarEventos() {
  const wrap = document.getElementById('evs');
  try {
    const r = await fetch(`${API_BASE}/authority/events`, { headers: getAuthHeaders() });
    if (!r.ok) throw new Error('Falha ao carregar eventos.');
    const evs = await r.json();
    
    if (!evs.length) {
        wrap.innerHTML = '<div class="empty-state"><p>Nenhum evento aprovado no momento.</p></div>';
        return;
    }

    wrap.innerHTML = '';
    for (const e of evs) {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <strong>${e.nome}</strong>
        <p class="muted">${e.endereco}</p>
        <p>Situação: <strong>${e.situacao}</strong></p>
        <p>${e.descricao}</p>
        ${e.situacao === 'aprovado' ? `
        <div class="card-actions">
          <button data-resolve="${e.id_evento}">Marcar como resolvido</button>
        </div>` : ''}
      `;
      wrap.appendChild(div);
    }
    
    document.querySelectorAll('[data-resolve]').forEach(b => b.onclick = async (e) => {
      const id = b.getAttribute('data-resolve');
      const btn = e.target;
      btn.disabled = true;
      btn.textContent = 'Resolvendo...';
      
      try {
        await fetch(`${API_BASE}/authority/events/${id}/resolve`, {method:'POST', headers: getAuthHeaders()});
        showToast('Evento marcado como resolvido!');
        // Atualiza a UI de forma otimista
        btn.closest('.card').querySelector('p:nth-of-type(2) > strong').textContent = 'resolvido';
        btn.remove();
      } catch (err) {
        showToast('Erro ao marcar como resolvido.', 'error');
        btn.disabled = false;
        btn.textContent = 'Marcar como resolvido';
      }
    });
  } catch(error) {
    showToast(error.message, 'error');
  }
}

carregarEventos();