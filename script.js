"use strict";
const loanConfigs = {
    pessoal: {
        name: "Empréstimo pessoal",
        amountLabel: "Valor desejado",
        amountDescription: "Valor entre R$ 1.000 e R$ 80.000.",
        minimumAmount: 1000,
        maximumAmount: 80000,
        minimumTerm: 6,
        maximumTerm: 60,
        defaultTerm: 24,
        termStep: 6,
        baseMonthlyRate: 2.39,
        referenceScore: 501,
        minimumDownPayment: 0,
        rateAdjustments: {
            baixo: 1,
            regular: 0.6,
            bom: 0.25,
            excelente: 0
        }
    },
    veiculo: {
        name: "Financiamento de veículo",
        amountLabel: "Valor do veículo",
        amountDescription: "Valor entre R$ 20.000 e R$ 300.000.",
        minimumAmount: 20000,
        maximumAmount: 300000,
        minimumTerm: 12,
        maximumTerm: 60,
        defaultTerm: 48,
        termStep: 6,
        baseMonthlyRate: 1.59,
        referenceScore: 551,
        minimumDownPayment: 10,
        rateAdjustments: {
            baixo: 0.65,
            regular: 0.35,
            bom: 0.15,
            excelente: 0
        }
    },
    imovel: {
        name: "Financiamento imobiliário",
        amountLabel: "Valor do imóvel",
        amountDescription: "Valor entre R$ 100.000 e R$ 2.250.000.",
        minimumAmount: 100000,
        maximumAmount: 2250000,
        minimumTerm: 60,
        maximumTerm: 420,
        defaultTerm: 360,
        termStep: 12,
        baseMonthlyRate: 0.91,
        referenceScore: 601,
        minimumDownPayment: 30,
        rateAdjustments: {
            baixo: 0.25,
            regular: 0.15,
            bom: 0.05,
            excelente: 0
        }
    }
};
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Elemento não encontrado: ${id}`);
    }
    return element;
}
const form = getElement("loan-form");
const resultPanel = getElement("result");
const loanTypeInput = getElement("loan-type");
const incomeInput = getElement("income");
const commitmentsInput = getElement("commitments");
const amountInput = getElement("amount");
const downPaymentInput = getElement("downPayment");
const downPaymentGroup = getElement("downPaymentGroup");
const downPaymentHelper = getElement("downPaymentHelper");
const amountLabel = getElement("amountLabel");
const amountHelper = getElement("amountHelper");
const scoreInput = getElement("score");
const scoreValue = getElement("scoreValue");
const scoreClassification = getElement("scoreClassification");
const termInput = getElement("term");
const termValue = getElement("termValue");
const termHelper = getElement("termHelper");
const termMinimum = getElement("termMinimum");
const termMaximum = getElement("termMaximum");
const ratePreview = getElement("ratePreview");
const formError = getElement("formError");
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});
const decimalFormatter = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});
let selectedLoanType = "pessoal";
function getScoreProfile(score) {
    if (score <= 300) {
        return { level: "baixo", label: "Baixo" };
    }
    if (score <= 500) {
        return { level: "regular", label: "Regular" };
    }
    if (score <= 700) {
        return { level: "bom", label: "Bom" };
    }
    return { level: "excelente", label: "Excelente" };
}
function formatCurrency(value) {
    return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}
function setCurrencyInput(input, value) {
    input.dataset.value = String(value);
    input.value = value > 0 ? decimalFormatter.format(value) : "";
}
function readCurrencyInput(input) {
    return Number(input.dataset.value || 0);
}
function handleCurrencyInput(event) {
    const input = event.target;
    const digits = input.value.replace(/\D/g, "");
    if (!digits) {
        input.value = "";
        input.dataset.value = "0";
        return;
    }
    const value = Number(digits) / 100;
    input.dataset.value = String(value);
    input.value = decimalFormatter.format(value);
}
function updateScoreDisplay() {
    const score = Number(scoreInput.value);
    const profile = getScoreProfile(score);
    scoreValue.textContent = String(score);
    scoreClassification.textContent = profile.label;
}
function updateTermDisplay() {
    termValue.textContent = termInput.value;
}
function updateLoanType(type) {
    selectedLoanType = type;
    loanTypeInput.value = type;
    const config = loanConfigs[type];
    document.querySelectorAll(".product-card").forEach(card => {
        const isActive = card.dataset.loanType === type;
        card.classList.toggle("active", isActive);
        card.setAttribute("aria-pressed", String(isActive));
    });
    amountLabel.innerHTML = `${config.amountLabel} <span>*</span>`;
    amountHelper.textContent = config.amountDescription;
    termInput.min = String(config.minimumTerm);
    termInput.max = String(config.maximumTerm);
    termInput.step = String(config.termStep);
    termInput.value = String(config.defaultTerm);
    termMinimum.textContent = `${config.minimumTerm} meses`;
    termMaximum.textContent = `${config.maximumTerm} meses`;
    termHelper.textContent = `De ${config.minimumTerm} a ${config.maximumTerm} meses`;
    ratePreview.textContent = `${decimalFormatter.format(config.baseMonthlyRate)}% ao mês`;
    const hasDownPayment = type !== "pessoal";
    downPaymentGroup.hidden = !hasDownPayment;
    if (hasDownPayment) {
        downPaymentHelper.textContent = `Referência ilustrativa mínima: ${config.minimumDownPayment}% do valor.`;
    }
    else {
        setCurrencyInput(downPaymentInput, 0);
    }
    updateTermDisplay();
    renderPlaceholder();
}
function getAdjustedRate(config, scoreProfile) {
    return config.baseMonthlyRate + config.rateAdjustments[scoreProfile.level];
}
function calculatePriceInstallment(principal, monthlyRatePercentage, term) {
    const rate = monthlyRatePercentage / 100;
    if (rate === 0)
        return principal / term;
    const factor = Math.pow(1 + rate, term);
    return principal * ((rate * factor) / (factor - 1));
}
function calculatePresentValue(installment, monthlyRatePercentage, term) {
    const rate = monthlyRatePercentage / 100;
    if (installment <= 0)
        return 0;
    if (rate === 0)
        return installment * term;
    return installment * ((1 - Math.pow(1 + rate, -term)) / rate);
}
function validateInput(input) {
    const config = loanConfigs[input.type];
    if (input.income <= 0) {
        return "Informe uma renda familiar mensal válida.";
    }
    if (input.commitments < 0) {
        return "O valor dos compromissos financeiros não pode ser negativo.";
    }
    if (input.amount < config.minimumAmount || input.amount > config.maximumAmount) {
        return `Para esta demonstração, informe um valor entre ${formatCurrency(config.minimumAmount)} e ${formatCurrency(config.maximumAmount)}.`;
    }
    if (input.type !== "pessoal" && input.downPayment >= input.amount) {
        return "A entrada deve ser menor que o valor total do bem.";
    }
    if (input.type !== "pessoal" && input.downPayment < 0) {
        return "Informe um valor de entrada válido.";
    }
    return null;
}
function runSimulation(input) {
    const config = loanConfigs[input.type];
    const scoreProfile = getScoreProfile(input.score);
    const financedAmount = input.type === "pessoal" ? input.amount : input.amount - input.downPayment;
    const entryPercentage = input.type === "pessoal" ? 0 : (input.downPayment / input.amount) * 100;
    const monthlyRate = getAdjustedRate(config, scoreProfile);
    const installment = calculatePriceInstallment(financedAmount, monthlyRate, input.term);
    const totalPaid = installment * input.term;
    const totalInterest = totalPaid - financedAmount;
    const installmentPercentage = (installment / input.income) * 100;
    const commitmentPercentage = ((installment + input.commitments) / input.income) * 100;
    const maximumAffordablePayment = Math.max(input.income * 0.3 - input.commitments, 0);
    const estimatedCapacity = calculatePresentValue(maximumAffordablePayment, monthlyRate, input.term);
    const scorePassed = input.score >= config.referenceScore;
    const incomePassed = commitmentPercentage <= 30;
    const entryPassed = input.type === "pessoal" || entryPercentage >= config.minimumDownPayment;
    let status;
    if (scorePassed && incomePassed && entryPassed) {
        status = "compatible";
    }
    else if (input.score >= 301 && commitmentPercentage <= 40) {
        status = "review";
    }
    else {
        status = "unfavorable";
    }
    return {
        config,
        financedAmount,
        installment,
        totalPaid,
        totalInterest,
        monthlyRate,
        commitmentPercentage,
        installmentPercentage,
        entryPercentage,
        maximumAffordablePayment,
        estimatedCapacity,
        scoreProfile,
        scorePassed,
        incomePassed,
        entryPassed,
        status
    };
}
function getStatusContent(status) {
    if (status === "compatible") {
        return {
            label: "Resultado indicativo",
            title: "Perfil potencialmente compatível",
            description: "Os valores informados ficaram dentro dos parâmetros demonstrativos desta simulação."
        };
    }
    if (status === "review") {
        return {
            label: "Resultado indicativo",
            title: "Perfil sujeito a uma análise mais detalhada",
            description: "Parte dos parâmetros ficou fora das referências utilizadas pelo simulador."
        };
    }
    return {
        label: "Resultado indicativo",
        title: "Proposta pouco compatível neste cenário",
        description: "A parcela, o score ou a entrada ficaram distantes dos parâmetros demonstrativos."
    };
}
function getCommitmentClass(percentage) {
    if (percentage <= 30)
        return "good";
    if (percentage <= 40)
        return "warning";
    return "danger";
}
function renderCriteria(passed, title, description) {
    return `
    <div class="criteria-item ${passed ? "pass" : "fail"}">
      <span class="criteria-icon">
        ${passed ? "✓" : "!"}
      </span>
      <div>
        <strong>${title}</strong>
        <span>${description}</span>
      </div>
    </div>
  `;
}
function renderResult(simulation, input) {
    const statusContent = getStatusContent(simulation.status);
    const commitmentWidth = Math.min(simulation.commitmentPercentage, 100);
    const scoreWidth = Math.min((input.score / 1000) * 100, 100);
    const entryDescription = input.type === "pessoal"
        ? "Esta modalidade não utiliza entrada."
        : `${decimalFormatter.format(simulation.entryPercentage)}% informado; referência de ${simulation.config.minimumDownPayment}%.`;
    resultPanel.innerHTML = `
    <div class="result-content">
      <div class="result-status ${simulation.status}">
        <span class="result-status-label">
          ${statusContent.label}
        </span>
        <h2>${statusContent.title}</h2>
        <p>${statusContent.description}</p>
      </div>

      <div class="main-result">
        <span>Parcela mensal estimada</span>
        <strong>
          ${formatCurrency(simulation.installment)}
        </strong>
        <small>
          ${input.term} parcelas pelo sistema Price simplificado
        </small>
      </div>

      <div class="result-metrics">
        <div class="result-metric">
          <span>Valor financiado</span>
          <strong>${formatCurrency(simulation.financedAmount)}</strong>
        </div>
        <div class="result-metric">
          <span>Taxa utilizada</span>
          <strong>${decimalFormatter.format(simulation.monthlyRate)}% a.m.</strong>
        </div>
        <div class="result-metric">
          <span>Total das parcelas</span>
          <strong>${formatCurrency(simulation.totalPaid)}</strong>
        </div>
        <div class="result-metric">
          <span>Juros estimados</span>
          <strong>${formatCurrency(simulation.totalInterest)}</strong>
        </div>
      </div>

      <div class="analysis-block">
        <div class="analysis-heading">
          <span>Comprometimento total da renda</span>
          <strong>${decimalFormatter.format(simulation.commitmentPercentage)}%</strong>
        </div>
        <div class="analysis-track">
          <div class="analysis-value ${getCommitmentClass(simulation.commitmentPercentage)}" style="width: ${commitmentWidth}%"></div>
        </div>
      </div>

      <div class="analysis-block">
        <div class="analysis-heading">
          <span>Score informado · ${simulation.scoreProfile.label}</span>
          <strong>${input.score}/1.000</strong>
        </div>
        <div class="analysis-track">
          <div class="analysis-value ${simulation.scorePassed ? "good" : "warning"}" style="width: ${scoreWidth}%"></div>
        </div>
      </div>

      <div class="criteria-list">
        ${renderCriteria(simulation.scorePassed, "Score de referência", `Score informado: ${input.score}. Referência interna demonstrativa: ${simulation.config.referenceScore}.`)}
        ${renderCriteria(simulation.incomePassed, "Capacidade de pagamento", `Parcela e compromissos consomem ${decimalFormatter.format(simulation.commitmentPercentage)}% da renda. Referência utilizada: até 30%.`)}
        ${renderCriteria(simulation.entryPassed, "Valor de entrada", entryDescription)}
      </div>

      <div class="cet-warning">
        <strong>CET não calculado.</strong>
        A estimativa não inclui seguros, tarifas, tributos,
        atualização monetária ou outros encargos que compõem
        o Custo Efetivo Total.
      </div>

      <button id="resetSimulation" class="reset-button" type="button">
        Fazer nova simulação
      </button>
    </div>
  `;
    getElement("resetSimulation").addEventListener("click", resetSimulation);
    resultPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}
function renderPlaceholder() {
    resultPanel.innerHTML = `
    <div class="result-placeholder">
      <div class="placeholder-icon">%</div>
      <h2>Seu resultado aparecerá aqui</h2>
      <p>
        Preencha os dados da proposta para visualizar parcela,
        comprometimento de renda e perfil indicativo.
      </p>
      <div class="placeholder-lines">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
}
function resetSimulation() {
    form.reset();
    setCurrencyInput(incomeInput, 0);
    setCurrencyInput(commitmentsInput, 0);
    setCurrencyInput(amountInput, 0);
    setCurrencyInput(downPaymentInput, 0);
    scoreInput.value = "550";
    formError.hidden = true;
    formError.textContent = "";
    updateScoreDisplay();
    updateLoanType("pessoal");
    window.scrollTo({
        top: form.offsetTop - 90,
        behavior: "smooth"
    });
}
document.querySelectorAll(".product-card").forEach(card => {
    card.addEventListener("click", () => {
        const type = card.dataset.loanType;
        updateLoanType(type);
    });
});
[incomeInput, commitmentsInput, amountInput, downPaymentInput].forEach(input => {
    input.addEventListener("input", handleCurrencyInput);
    input.addEventListener("focus", () => {
        input.select();
    });
});
scoreInput.addEventListener("input", updateScoreDisplay);
termInput.addEventListener("input", updateTermDisplay);
form.addEventListener("submit", event => {
    event.preventDefault();
    const input = {
        type: selectedLoanType,
        income: readCurrencyInput(incomeInput),
        commitments: readCurrencyInput(commitmentsInput),
        amount: readCurrencyInput(amountInput),
        downPayment: readCurrencyInput(downPaymentInput),
        score: Number(scoreInput.value),
        term: Number(termInput.value)
    };
    const validationError = validateInput(input);
    if (validationError) {
        formError.textContent = validationError;
        formError.hidden = false;
        formError.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
        return;
    }
    formError.hidden = true;
    formError.textContent = "";
    const simulation = runSimulation(input);
    renderResult(simulation, input);
});
getElement("currentYear").textContent = String(new Date().getFullYear());
setCurrencyInput(commitmentsInput, 0);
setCurrencyInput(downPaymentInput, 0);
updateScoreDisplay();
updateLoanType("pessoal");
if (typeof lucide !== 'undefined')
    lucide.createIcons();
