let debts = JSON.parse(localStorage.getItem('quit_debts_v3')) || [];
let history = JSON.parse(localStorage.getItem('quit_history_v3')) || [];
let currentStrategy = 'avalanche';

// Alternar Abas
function switchTab(tab) {
    const isDebts = tab === 'debts';
    document.getElementById('view-debts').classList.toggle('hidden', !isDebts);
    document.getElementById('view-history').classList.toggle('hidden', isDebts);
    
    document.getElementById('tab-debts').className = isDebts 
        ? 'flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all bg-white shadow-sm text-emerald-700'
        : 'flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all text-slate-500';
    
    document.getElementById('tab-history').className = !isDebts 
        ? 'flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all bg-white shadow-sm text-emerald-700'
        : 'flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all text-slate-500';
    
    if(!isDebts) renderHistory();
}

function updateUI() {
    const totalRemaining = debts.reduce((acc, d) => acc + d.balance, 0);
    const totalInitial = debts.reduce((acc, d) => acc + d.totalInitial, 0);
    const totalPaid = totalInitial - totalRemaining;
    const percent = totalInitial > 0 ? (totalPaid / totalInitial) * 100 : 0;

    document.getElementById('total-progress-percent').innerText = `${Math.floor(percent)}%`;
    document.getElementById('progress-bar-main').style.width = `${percent}%`;
    document.getElementById('total-debt-summary').innerText = `Restam ${totalRemaining.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} de ${totalInitial.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}`;

    renderDebts();
    localStorage.setItem('quit_debts_v3', JSON.stringify(debts));
    localStorage.setItem('quit_history_v3', JSON.stringify(history));
}

document.getElementById('debt-form').onsubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(document.getElementById('balance').value);
    debts.push({
        id: Date.now(),
        name: document.getElementById('name').value,
        totalInitial: val,
        balance: val,
        paid: 0,
        rate: parseFloat(document.getElementById('rate').value),
        createdAt: new Date().toISOString()
    });
    closeModal();
    updateUI();
    e.target.reset();
};

function payInstallment(id) {
    const amount = parseFloat(prompt("Valor do pagamento (R$):"));
    if (amount && !isNaN(amount)) {
        const debt = debts.find(d => d.id === id);
        
        // Registrar no Histórico
        history.push({
            date: new Date().toISOString(),
            debtName: debt.name,
            amount: amount
        });

        if (amount >= debt.balance) {
            debt.balance = 0;
            debt.paid = debt.totalInitial;
            alert("Dívida Quitada!");
            debts = debts.filter(d => d.id !== id);
        } else {
            debt.balance -= amount;
            debt.paid += amount;
        }
        updateUI();
    }
}

function renderDebts() {
    const container = document.getElementById('debt-list');
    container.innerHTML = '';
    
    let sorted = [...debts].sort((a,b) => currentStrategy === 'avalanche' ? b.rate - a.rate : a.balance - b.balance);

    sorted.forEach((d, i) => {
        const div = document.createElement('div');
        const prog = (d.paid / d.totalInitial) * 100;
        div.className = `bg-white p-6 rounded-[2rem] border-2 transition-all animate-item ${i === 0 ? 'border-emerald-500 shadow-lg' : 'border-slate-100'}`;
        div.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h4 class="font-black text-slate-800 text-lg">${d.name}</h4>
                    <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Criada em: ${dayjs(d.createdAt).format('DD/MM/YY')}</p>
                </div>
                <button onclick="payInstallment(${d.id})" class="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Pagar</button>
            </div>
            <div class="w-full bg-slate-100 h-1.5 rounded-full mb-3 overflow-hidden">
                <div class="bg-emerald-400 h-full" style="width: ${prog}%"></div>
            </div>
            <div class="flex justify-between items-end">
                <p class="text-xl font-black leading-none">R$ ${d.balance.toLocaleString('pt-BR')}</p>
                <span class="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">${d.rate}% juros</span>
            </div>
        `;
        container.appendChild(div);
    });
    lucide.createIcons();
}

function renderHistory() {
    const container = document.getElementById('history-list');
    container.innerHTML = history.length ? '' : '<p class="text-center text-slate-300 py-10 text-xs font-bold uppercase">Sem pagamentos registrados</p>';
    
    [...history].reverse().forEach(h => {
        const div = document.createElement('div');
        div.className = 'bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-slate-100 animate-item';
        div.innerHTML = `
            <div>
                <p class="font-black text-slate-800 text-sm">${h.debtName}</p>
                <p class="text-[10px] text-slate-400 font-bold uppercase">${dayjs(h.date).format('DD/MM/YYYY HH:mm')}</p>
            </div>
            <p class="font-black text-emerald-600">+ R$ ${h.amount.toLocaleString('pt-BR')}</p>
        `;
        container.appendChild(div);
    });
}

async function exportFullReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const totalInitial = debts.reduce((acc, d) => acc + d.totalInitial, 0);
    const totalRemaining = debts.reduce((acc, d) => acc + d.balance, 0);
    const totalPaid = history.reduce((acc, h) => acc + h.amount, 0);

    doc.setFontSize(22); doc.setTextColor(5, 150, 105);
    doc.text("RELATÓRIO DE QUITAÇÃO QUIT", 14, 20);
    
    doc.setFontSize(12); doc.setTextColor(100);
    doc.text(`Dívida Total Inicial: R$ ${totalInitial.toFixed(2)}`, 14, 35);
    doc.text(`Total já Pago: R$ ${totalPaid.toFixed(2)}`, 14, 42);
    doc.text(`Saldo Devedor Atual: R$ ${totalRemaining.toFixed(2)}`, 14, 49);

    // Tabela de Dívidas Atuais
    doc.autoTable({
        startY: 60,
        head: [['Dívida', 'Juros', 'Total Inicial', 'Saldo Restante']],
        body: debts.map(d => [d.name, d.rate + '%', d.totalInitial, d.balance]),
        headStyles: { fillColor: [5, 150, 105] }
    });

    // Tabela de Extrato
    doc.text("EXTRATO DE PAGAMENTOS", 14, doc.lastAutoTable.finalY + 15);
    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Data', 'Dívida Amortizada', 'Valor Pago']],
        body: history.map(h => [dayjs(h.date).format('DD/MM/YY HH:mm'), h.debtName, 'R$ ' + h.amount]),
        headStyles: { fillColor: [30, 41, 59] }
    });

    doc.save("Relatorio_Quit_Completo.pdf");
}

function openModal() { document.getElementById('modal').classList.replace('hidden', 'flex'); }
function closeModal() { document.getElementById('modal').classList.replace('flex', 'hidden'); }

updateUI();