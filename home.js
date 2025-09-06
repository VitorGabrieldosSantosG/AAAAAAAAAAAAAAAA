// === CONFIGURAÇÃO INICIAL E VERIFICAÇÃO DE ACESSO ===
const API_BASE = window.API_BASE || 'https://acaocidada.duckdns.org:3000';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Função para obter os headers de autenticação
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});

// Verifica se o usuário está logado, senão redireciona para o login
if (!token || !user.id_usuario) {
  window.location.href = 'index.html';
}

// === FUNÇÃO DE NOTIFICAÇÃO (Toast) ===
function showToast(message, type = 'success') {
  // (Esta função pode ser movida para um arquivo .js global no futuro)
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}

// === CONTROLE DE VISIBILIDADE DOS BOTÕES ===
const btnAdmin = document.getElementById('btnAdmin');
const btnAuthority = document.getElementById('btnAuthority');
if (user.tipo !== 'admin') btnAdmin.style.display = 'none';
if (user.tipo !== 'autoridade') btnAuthority.style.display = 'none';

// === EVENT LISTENERS DA NAVEGAÇÃO ===
document.getElementById('btnLogout').onclick = () => { localStorage.clear(); window.location.href = 'index.html'; };
btnAdmin.onclick = () => { window.location.href='admin.html'; };
btnAuthority.onclick = () => { window.location.href='autoridade.html'; };

// === LÓGICA DO FEED ===
const feed = document.getElementById('feed');

async function carregarFeed(){
  try {
    const r = await fetch(`${API_BASE}/events`, { headers: getAuthHeaders() });
    if (!r.ok) throw new Error('Falha ao carregar eventos.');
    const eventos = await r.json();
    feed.innerHTML = eventos.length ? '' : '<p class="muted" style="text-align:center;">Nenhum evento para exibir.</p>';

    for (const ev of eventos){
      const card = document.createElement('div');
      card.className = 'event';
      card.innerHTML = `
        <div class="event-header">
          <strong>${ev.nome}</strong>
          <span class="tag">${ev.classificacao}</span>
        </div>
        <div class="event-meta">
          <div>Por: <strong>${ev.nome_usuario || 'Anônimo'}</strong></div>
          <div>Endereço: ${ev.endereco}</div>
          <div>Risco: ${ev.nivel_risco} · Reclamações: <span data-qtd="${ev.id_evento}">${ev.quantidade_reclamacoes}</span></div>
        </div>
        ${(ev.fotos && ev.fotos.length) ? `<div class="event-imgs">${ev.fotos.map(u => `<img src="${API_BASE}${u}" alt="foto do evento">`).join('')}</div>` : ''}
        <div class="event-actions">
          <button data-like="${ev.id_evento}">Reclamar</button>
          <button data-report="${ev.id_evento}" class="ghost">Denunciar</button>
        </div>
      `;
      feed.appendChild(card);
    }
    addEventListenersAcoes();
  } catch(error) {
    showToast(error.message, 'error');
  }
}

function addEventListenersAcoes() {
  document.querySelectorAll('[data-like]').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-like');
      const r = await fetch(`${API_BASE}/events/${id}/reclamar`, {method:'POST', headers: getAuthHeaders()});
      if (r.ok) {
        const j = await r.json();
        document.querySelector(`[data-qtd="${id}"]`).textContent = j.quantidade_reclamacoes;
        showToast('Reclamação registrada!');
      } else {
        showToast('Você já reclamou sobre este evento.', 'error');
      }
    };
  });

  document.querySelectorAll('[data-report]').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-report');
      await fetch(`${API_BASE}/events/${id}/denunciar`, {method:'POST', headers: getAuthHeaders()});
      showToast('Denúncia enviada. Obrigado!');
    };
  });
}

// === LÓGICA DO MODAL DE CRIAÇÃO ===
const modal = document.getElementById('modalNovo');
const btnNovo = document.getElementById('btnNovo');
const closeModal = document.getElementById('closeModal');
const criarEventoBtn = document.getElementById('criarEvento');
const formFields = {
    nome: document.getElementById('ev_nome'),
    endereco: document.getElementById('ev_endereco'),
    risco: document.getElementById('ev_risco'),
    classificacao: document.getElementById('ev_classificacao'),
    descricao: document.getElementById('ev_descricao'),
    fotos: document.getElementById('ev_fotos'),
};

btnNovo.onclick = () => { modal.style.display = 'flex'; };
closeModal.onclick = () => { modal.style.display = 'none'; };
window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; };

// Navegação do modal
const step1 = document.getElementById('step1'), step2 = document.getElementById('step2'), step3 = document.getElementById('step3');
const progressBar = document.getElementById('progressBar');
document.getElementById('toStep2').onclick = () => { step1.style.display='none'; step2.style.display='block'; progressBar.style.width='66%'; };
document.getElementById('back1').onclick = () => { step2.style.display='none'; step1.style.display='block'; progressBar.style.width='33%'; };
document.getElementById('toStep3').onclick = () => { step2.style.display='none'; step3.style.display='block'; progressBar.style.width='100%'; };
document.getElementById('back2').onclick = () => { step3.style.display='none'; step2.style.display='block'; progressBar.style.width='66%'; };

function resetarModal() {
    Object.values(formFields).forEach(field => field.value = ''); // Limpa os campos
    step3.style.display = 'none';
    step2.style.display = 'none';
    step1.style.display = 'block';
    progressBar.style.width = '33%';
    modal.style.display = 'none';
}

criarEventoBtn.onclick = async () => {
  const body = {
    nome: formFields.nome.value,
    endereco: formFields.endereco.value,
    nivel_risco: formFields.risco.value,
    classificacao: formFields.classificacao.value,
    descricao: formFields.descricao.value,
    id_usuario: user.id_usuario
  };

  if (!body.nome || !body.endereco || !body.classificacao) {
      return showToast('Preencha os campos obrigatórios.', 'error');
  }

  try {
    const r = await fetch(`${API_BASE}/events`, { method:'POST', headers: getAuthHeaders(), body: JSON.stringify(body)});
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Erro ao criar evento');
    
    const idEvento = j.id_evento;
    const files = formFields.fotos.files;
    if (files.length > 0) {
      const form = new FormData();
      for (const f of files) form.append('fotos', f);
      // O header 'Content-Type' não é definido para FormData, o browser faz isso.
      await fetch(`${API_BASE}/events/${idEvento}/fotos`, { 
        method:'POST', 
        headers: { 'Authorization': `Bearer ${token}` },
        body: form 
      });
    }

    showToast('Evento criado! Aguarde aprovação.');
    resetarModal();
    carregarFeed();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

// Carrega o feed inicial
carregarFeed();