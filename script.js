var form = document.getElementById('loan-form');
var resultDiv = document.getElementById('result');
form.addEventListener('submit', function (e) {
    e.preventDefault();
    var income = Number(document.getElementById('income').value);
    var score = Number(document.getElementById('score').value);
    var loanType = document.getElementById('loan-type').value;
    var mensagem = verificarEmprestimo(loanType, income, score);
    resultDiv.innerHTML = mensagem;
    resultDiv.classList.remove('hidden');
});
function verificarEmprestimo(tipo, renda, score) {
    var requisitos = {
        duplex: { renda: 6000, score: 700 },
        condominio: { renda: 4500, score: 680 },
        carro: { renda: 3000, score: 650 }
    };
    var req = requisitos[tipo];
    if (!req) {
        return "<span class=\"mensagem-erro\">Tipo de empr\u00E9stimo inv\u00E1lido.</span>";
    }
    if (renda >= req.renda && score >= req.score) {
        return "\n      <span class=\"mensagem-sucesso\">\n        Voc\u00EA se qualifica para um empr\u00E9stimo de <strong>".concat(tipo, "</strong>.\n      </span>\n    ");
    }
    else {
        return "\n      <div class=\"mensagem-erro\">\n        Voc\u00EA n\u00E3o se qualifica para um empr\u00E9stimo de <strong>".concat(tipo, "</strong> com os dados informados.\n        <div class=\"tooltip\">\n          <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" fill=\"#ffffff\" viewBox=\"0 0 24 24\">\n            <path d=\"M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 \n              10-10S17.514 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z\"/>\n          </svg>\n          <span class=\"tooltip-text\">\n            Requisitos para aprova\u00E7\u00E3o:<br>\n            - Renda m\u00EDnima: R$ ").concat(req.renda.toLocaleString('pt-BR'), "<br>\n            - Score m\u00EDnimo: ").concat(req.score, "\n          </span>\n        </div>\n      </div>\n    ");
    }
}
