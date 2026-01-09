let debts = JSON.parse(localStorage.getItem('quit_debts_v2')) || [];
let currentStrategy = 'avalanche';

// Alternar entre Estratégias
function setStrategy(strategy) {
    currentStrategy = strategy;
    document.getElementById('btn-avalanche').classList.toggle('strategy-active', strategy === 'avalanche');
    document.getElementById('btn-snowball').classList.toggle('strategy-active', strategy === 'snowball');
    updateUI();
}

// Atualização da Interface e Cálculos de Progresso
function updateUI() {
    const totalRemaining = debts.reduce((acc, d) => acc + d.balance, 0);
    const totalInitial = debts.reduce((acc, d) => acc + d.totalInitial, 0);
    const totalPaid = totalInitial - totalRemaining;
    
    // Porcentagem Total de Quitação
    const percent = totalInitial > 0 ? (totalPaid / totalInitial) * 100 : 0;
    
    document.getElementById('total-progress-percent').innerText = `${Math.floor(percent)}%`;
    document.getElementById('progress-bar-main').style.width = `${percent}%`;
    document.getElementById('total-debt-summary').innerText = `Restam ${totalRemaining.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} de um total de ${totalInitial.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}`;
    
    // Calculadora de Custo de Juros Mensal
    const impactCard = document.getElementById('impact-card');
    if (debts.length > 0) {
        impactCard.classList.remove('hidden');
        const monthlyInterest = debts.reduce((acc, d) => acc + (d.balance * (d.rate / 100)), 0);
        document.getElementById('monthly-interest-cost').innerText = monthlyInterest.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
    } else {
        impactCard.classList.add('hidden');
    }

    renderDebts();
    localStorage.setItem('quit_debts_v2', JSON.stringify(debts));
}

// Registro de Nova Dívida
document.getElementById('debt-form').onsubmit = (e) => {
    e.preventDefault();
    const balanceTotal = parseFloat(document.getElementById('balance').value);
    const alreadyPaid = parseFloat(document.getElementById('paid').value) || 0;

    const newDebt = {
        id: Date.now(),
        name: document.getElementById('name').value,
        totalInitial: balanceTotal, 
        balance: balanceTotal - alreadyPaid, // O que resta pagar agora
        paid: alreadyPaid,
        rate: parseFloat(document.getElementById('rate').value)
    };

    debts.push(newDebt);
    closeModal();
    updateUI();
    e.target.reset();
};

// Amortizar (Pagar Parcela)
function payInstallment(id) {
    const amountStr = prompt("Valor pago desta vez (R$):");
    const amount = parseFloat(amountStr);
    
    if (amount && !isNaN(amount)) {
        const debt = debts.find(d => d.id === id);
        
        if (amount >= debt.balance) {
            if(confirm("Dívida quitada! Deseja remover da lista?")) {
                debts = debts.filter(d => d.id !== id);
            }
        } else {
            debt.balance -= amount;
            debt.paid += amount;
        }
        updateUI();
    }
}

// Renderizar Lista de Dívidas Ordenada
function renderDebts() {
    const container = document.getElementById('debt-list');
    container.innerHTML = debts.length ? '' : `
        <div class="text-center py-10 opacity-40">
            <i data-lucide="party-popper" class="w-10 h-10 mx-auto mb-2 text-emerald-600"></i>
            <p class="text-[10px] font-bold uppercase tracking-widest">Tudo Pago!</p>
        </div>`;

    // Ordenação Estratégica
    let sorted = [...debts];
    if (currentStrategy === 'avalanche') {
        sorted.sort((a, b) => b.rate - a.rate); // Maiores juros
    } else {
        sorted.sort((a, b) => a.balance - b.balance); // Menor saldo
    }

    sorted.forEach((d, index) => {
        const isPriority = index === 0;
        const progressPercent = (d.paid / d.totalInitial) * 100;
        
        const item = document.createElement('div');
        item.className = `bg-white p-6 rounded-[2.5rem] border-2 transition-all animate-item ${isPriority ? 'border-emerald-500 shadow-xl scale-[1.02]' : 'border-slate-100 opacity-80'}`;
        
        item.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div>
                    ${isPriority ? '<span class="text-[8px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black uppercase mb-1.5 inline-block">Prioridade Máxima</span>' : ''}
                    <h4 class="font-black text-slate-800 text-lg leading-tight">${d.name}</h4>
                    <p class="text-[9px] font-bold text-amber-600 uppercase tracking-tighter">${d.rate}% juros ao mês</p>
                </div>
                <button onclick="payInstallment(${d.id})" class="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wide hover:bg-emerald-100 transition-colors">
                    Amortizar
                </button>
            </div>
            
            <div class="w-full bg-slate-50 h-2 rounded-full mb-4 overflow-hidden border border-slate-100">
                <div class="bg-emerald-400 h-full transition-all duration-700 shadow-[0_0_8px_rgba(52,211,153,0.3)]" style="width: ${progressPercent}%"></div>
            </div>

            <div class="flex justify-between items-end">
                <div>
                    <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Saldo Devedor</p>
                    <p class="text-2xl font-black text-slate-900 leading-none tracking-tight">R$ ${d.balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                </div>
                <div class="text-right">
                    <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Concluído</p>
                    <p class="text-sm font-black text-emerald-600">${Math.floor(progressPercent)}%</p>
                </div>
            </div>
        `;
        container.appendChild(item);
    });
    lucide.createIcons();
}

// Controle do Modal
function openModal() { document.getElementById('modal').classList.replace('hidden', 'flex'); }
function closeModal() { document.getElementById('modal').classList.replace('flex', 'hidden'); }

// Inicialização
setStrategy('avalanche');
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');