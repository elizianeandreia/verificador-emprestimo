const form = document.getElementById('loan-form') as HTMLFormElement;
const resultDiv = document.getElementById('result') as HTMLDivElement;

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const income = Number((document.getElementById('income') as HTMLInputElement).value);
  const score = Number((document.getElementById('score') as HTMLInputElement).value);
  const loanType = (document.getElementById('loan-type') as HTMLSelectElement).value;

  const mensagem = verificarEmprestimo(loanType, income, score);
  resultDiv.innerHTML = mensagem;
  resultDiv.classList.remove('hidden');
});

function verificarEmprestimo(tipo: string, renda: number, score: number): string {
  const requisitos = {
    duplex: { renda: 60000, score: 700 },
    condominio: { renda: 4500, score: 680 },
    carro: { renda: 3000, score: 650 }
  };

  const req = requisitos[tipo as keyof typeof requisitos];

  if (!req) {
    return `<span class="mensagem-erro">Tipo de empréstimo inválido.</span>`;
  }

  if (renda >= req.renda && score >= req.score) {
    return `
      <span class="mensagem-sucesso">
        Você se qualifica para um empréstimo de <strong>${tipo}</strong>.
      </span>
    `;
  } else {
    return `
      <div class="mensagem-erro">
        Você não se qualifica para um empréstimo de <strong>${tipo}</strong> com os dados informados.
        <div class="tooltip">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#ffffff" viewBox="0 0 24 24">
            <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 
              10-10S17.514 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          <span class="tooltip-text">
            Requisitos para aprovação:<br>
            - Renda mínima: R$ ${req.renda.toLocaleString('pt-BR')}<br>
            - Score mínimo: ${req.score}
          </span>
        </div>
      </div>
    `;
  }
}
