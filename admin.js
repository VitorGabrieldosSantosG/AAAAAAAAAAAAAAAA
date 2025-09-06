// === CONFIGURAÇÃO INICIAL E VERIFICAÇÃO DE ACESSO ===
const API_BASE = window.API_BASE || 'https://acaocidada.duckdns.org';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

const getAuthHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` });

if (!token || user.tipo !== 'admin') {
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

// === LÓGICA DO MODAL DE CONFIRMAÇÃO (UX Melhorado) ===
const confirmationModal = document.getElementById('confirmationModal');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');
let onConfirmCallback = null;

function showConfirmationModal(title, message, callback) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMessage').textContent = message;
  onConfirmCallback = callback;
  confirmationModal.style.display = 'flex';
}

confirmBtn.onclick = () => {
  if (onConfirmCallback) onConfirmCallback();
  confirmationModal.style.display = 'none';
};
cancelBtn.onclick = () => { confirmationModal.style.display = 'none'; };

// === LÓGICA DA PÁGINA ===
async function handleEventAction(button, url, successMessage) {
    button.disabled = true;
    const card = button.closest('.card');
    try {
        const response = await fetch(url, { method: 'POST', headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Falha na operação.');
        showToast(successMessage);
        // **MELHORIA UX**: Remove o card da tela sem recarregar tudo
        card.style.opacity = '0';
        setTimeout(() => card.remove(), 300);
    } catch (error) {
        showToast(error.message, 'error');
        button.disabled = false;
    }
}

async function carregarPendentes() {
  const wrap = document.getElementById('pendentes');
  try {
    const r = await fetch(`${API_BASE}/admin/events/pending`, { headers: getAuthHeaders() });
    if (!r.ok) throw new Error('Falha ao carregar eventos pendentes.');
    const evs = await r.json();
    
    if (!evs.length) {
        wrap.innerHTML = '<div class="empty-state"><p>Nenhum evento pendente de aprovação.</p></div>';
        return;
    }
    
    wrap.innerHTML = ''; // Limpa antes de popular
    for (const e of evs) {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <strong>${e.nome}</strong>
        <p class="muted">${e.endereco} — ${e.classificacao}</p>
        <p>${e.descricao || 'Sem descrição.'}</p>
        <div class="card-actions">
          <button data-aprovar="${e.id_evento}">Aprovar</button>
          <button data-rejeitar="${e.id_evento}" class="ghost danger">Rejeitar</button>
        </div>
      `;
      wrap.appendChild(div);
    }

    document.querySelectorAll('[data-aprovar]').forEach(b => b.onclick = (e) => {
      handleEventAction(e.target, `${API_BASE}/admin/events/${b.dataset.aprovar}/approve`, 'Evento aprovado!');
    });
    document.querySelectorAll('[data-rejeitar]').forEach(b => b.onclick = (e) => {
      handleEventAction(e.target, `${API_BASE}/admin/events/${b.dataset.rejeitar}/reject`, 'Evento rejeitado.');
    });
  } catch (error) {
    wrap.innerHTML = `<p class="muted error">${error.message}</p>`;
    showToast(error.message, 'error');
  }
}

async function carregarUsuarios() {
  const wrap = document.getElementById('usuarios');
  try {
    const r = await fetch(`${API_BASE}/admin/users`, { headers: getAuthHeaders() });
    if (!r.ok) throw new Error('Falha ao carregar usuários.');
    const us = await r.json();

    if (!us.length) {
        wrap.innerHTML = '<div class="empty-state"><p>Nenhum usuário cadastrado.</p></div>';
        return;
    }

    wrap.innerHTML = '';
    for (const u of us) {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <strong>${u.nome}</strong>
        <p class="muted">${u.email} — ${u.telefone}</p>
        <div class="card-actions">
          <button data-remover="${u.id_usuario}" class="ghost danger">Remover</button>
        </div>
      `;
      wrap.appendChild(div);
    }

    document.querySelectorAll('[data-remover]').forEach(b => b.onclick = () => {
        const id = b.dataset.remover;
        showConfirmationModal('Remover Usuário', 'Tem certeza? Esta ação não pode ser desfeita.', async () => {
            const card = b.closest('.card');
            try {
                await fetch(`${API_BASE}/admin/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
                showToast('Usuário removido.');
                card.style.opacity = '0';
                setTimeout(() => card.remove(), 300);
            } catch (err) {
                showToast('Erro ao remover usuário.', 'error');
            }
        });
    });
  } catch (error) {
    wrap.innerHTML = `<p class="muted error">${error.message}</p>`;
    showToast(error.message, 'error');
  }
}

carregarPendentes();
carregarUsuarios();