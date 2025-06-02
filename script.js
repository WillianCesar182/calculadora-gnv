const urlBase = "https://parallelum.com.br/fipe/api/v1";

const dadosVeiculo = {
  tipo: null,
  marca: null,
  modelo: null,
  anoModelo: null,
  valorFipe: null,
  ipvaNormal: null,
  ipvaComGNV: null,
  ipvaIsento: false,
};

document.getElementById("tipo").addEventListener("change", carregarMarcas);
document.getElementById("marca").addEventListener("change", carregarModelos);
document.getElementById("modelo").addEventListener("change", carregarAnos);
window.addEventListener("load", carregarMarcas);

async function carregarMarcas() {
  const tipo = document.getElementById("tipo").value;
  const res = await fetch(`${urlBase}/${tipo}/marcas`);
  const marcas = await res.json();
  const select = document.getElementById("marca");
  select.innerHTML = "";
  marcas.forEach((marca) => {
    const opt = document.createElement("option");
    opt.value = marca.codigo;
    opt.innerText = marca.nome;
    select.appendChild(opt);
  });
  carregarModelos();
}

async function carregarModelos() {
  const tipo = document.getElementById("tipo").value;
  const marca = document.getElementById("marca").value;
  const res = await fetch(`${urlBase}/${tipo}/marcas/${marca}/modelos`);
  const modelos = (await res.json()).modelos;
  const select = document.getElementById("modelo");
  select.innerHTML = "";
  modelos.forEach((modelo) => {
    const opt = document.createElement("option");
    opt.value = modelo.codigo;
    opt.innerText = modelo.nome;
    select.appendChild(opt);
  });
  carregarAnos();
}

async function carregarAnos() {
  const tipo = document.getElementById("tipo").value;
  const marca = document.getElementById("marca").value;
  const modelo = document.getElementById("modelo").value;
  const res = await fetch(`${urlBase}/${tipo}/marcas/${marca}/modelos/${modelo}/anos`);
  const anos = await res.json();
  const select = document.getElementById("ano");
  select.innerHTML = "";
  anos.forEach((ano) => {
    const opt = document.createElement("option");
    opt.value = ano.codigo;
    opt.innerText = ano.nome;
    select.appendChild(opt);
  });
}

async function consultarValor() {
  const tipo = document.getElementById("tipo").value;
  const marca = document.getElementById("marca").value;
  const modelo = document.getElementById("modelo").value;
  const ano = document.getElementById("ano").value;
  const cenario = document.getElementById("cenario").value;

  const res = await fetch(`${urlBase}/${tipo}/marcas/${marca}/modelos/${modelo}/anos/${ano}`);
  const dados = await res.json();

  const valor = parseFloat(dados.Valor.replace("R$ ", "").replace(".", "").replace(",", "."));
  const anoModelo = parseInt(dados.AnoModelo);
  const anoAtual = new Date().getFullYear();

  dadosVeiculo.tipo = tipo;
  dadosVeiculo.marca = marca;
  dadosVeiculo.modelo = dados.Modelo;
  dadosVeiculo.anoModelo = anoModelo;
  dadosVeiculo.valorFipe = valor;

  if (anoAtual - anoModelo > 15) {
    dadosVeiculo.ipvaIsento = true;
    dadosVeiculo.ipvaNormal = 0;
    dadosVeiculo.ipvaComGNV = 0;
  } else {
    dadosVeiculo.ipvaIsento = false;
    dadosVeiculo.ipvaNormal = valor * 0.04;
    dadosVeiculo.ipvaComGNV = valor * 0.015;
  }

  document.getElementById("resultado").innerHTML = `
    <p><strong>Veículo:</strong> ${dados.Modelo} (${dados.AnoModelo})</p>
    <p><strong>Valor de mercado (FIPE):</strong> ${dados.Valor}</p>
    <p><strong>IPVA:</strong><br>
      ${
        dadosVeiculo.ipvaIsento
          ? "Isento (mais de 15 anos)"
          : `Sem GNV: R$ ${dadosVeiculo.ipvaNormal.toFixed(2)}<br>Com GNV: R$ ${dadosVeiculo.ipvaComGNV.toFixed(2)}`
      }
    </p>
    <p><strong>Cenário selecionado:</strong> ${document.querySelector("#cenario option:checked").text}</p>
  `;

  document.getElementById("form-cenario1").style.display = cenario === "instalar" ? "block" : "none";
  document.getElementById("form-cenario2").style.display = cenario === "ja-tem" ? "block" : "none";
}

// CENÁRIO 2 – Já tenho GNV
function calcularEconomiaGNVAtual() {
  const kmMes = parseFloat(document.getElementById("km_mes2").value);
  const consumoGNV = parseFloat(document.getElementById("consumo_gnv2").value);
  const precoGNV = parseFloat(document.getElementById("preco_gnv2").value);
  const precoGasolina = parseFloat(document.getElementById("preco_gasolina2").value);
  const consumoGasolina = parseFloat(document.getElementById("consumo_gasolina2").value);
  const precoEtanol = parseFloat(document.getElementById("preco_etanol2").value);
  const consumoEtanol = parseFloat(document.getElementById("consumo_etanol2").value);

  if (isNaN(kmMes) || kmMes <= 0) {
    alert("Informe a quilometragem mensal corretamente.");
    return;
  }

  const gastoGNV = (kmMes / consumoGNV) * precoGNV;
  const gastoGasolina = (kmMes / consumoGasolina) * precoGasolina;
  const gastoEtanol = (kmMes / consumoEtanol) * precoEtanol;
  const economiaGasolina = gastoGasolina - gastoGNV;
  const economiaEtanol = gastoEtanol - gastoGNV;
  const economiaIPVA = dadosVeiculo.ipvaIsento ? 0 : dadosVeiculo.ipvaNormal - dadosVeiculo.ipvaComGNV;

  const resultado = `
    <h4>Resultado</h4>
    <p><strong>Gasto mensal com GNV:</strong> R$ ${gastoGNV.toFixed(2)}</p>
    <p><strong>Se você estivesse usando gasolina:</strong> R$ ${gastoGasolina.toFixed(2)}<br>
    ➤ Economia mensal: <strong>R$ ${economiaGasolina.toFixed(2)}</strong></p>
    <p><strong>Se você estivesse usando etanol:</strong> R$ ${gastoEtanol.toFixed(2)}<br>
    ➤ Economia mensal: <strong>R$ ${economiaEtanol.toFixed(2)}</strong></p>
    <p><strong>Economia anual no IPVA:</strong> R$ ${economiaIPVA.toFixed(2)}</p>
    ${
      economiaIPVA > 0
        ? `<p style="color: green;"><strong>💡 Dica:</strong> Você já economiza R$ ${economiaIPVA.toFixed(2)} por ano só com o desconto no IPVA.</p>`
        : `<p style="color: gray;">IPVA já é isento para este veículo.</p>`
    }
  `;

  document.getElementById("resultadoCenario2").innerHTML = resultado;

  // GRÁFICO CENÁRIO 2
  if (window.graficoEconomia2 && typeof window.graficoEconomia2.destroy === "function") {
    window.graficoEconomia2.destroy();
  }

  const ctx = document.getElementById("graficoEconomia2").getContext("2d");
  window.graficoEconomia2 = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["GNV", "Gasolina", "Etanol"],
      datasets: [
        {
          label: "Gasto mensal estimado (R$)",
          data: [gastoGNV, gastoGasolina, gastoEtanol],
          backgroundColor: ["#27ae60", "#c0392b", "#f39c12"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Comparativo de gasto mensal",
        },
        legend: { display: false },
        datalabels: {
          color: "#000",
          anchor: "end",
          align: "top",
          formatter: (value) => `R$ ${value.toFixed(2)}`,
        },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
    plugins: [ChartDataLabels],
  });
}
function calcularEconomia() {
  const kmMes = parseFloat(document.getElementById("km_mes").value);
  const consumoGasolina = parseFloat(document.getElementById("consumo_gasolina").value);
  const consumoEtanol = parseFloat(document.getElementById("consumo_etanol").value);
  const consumoGNV = parseFloat(document.getElementById("consumo_gnv").value);
  const precoGasolina = parseFloat(document.getElementById("preco_gasolina").value);
  const precoEtanol = parseFloat(document.getElementById("preco_etanol").value);
  const precoGNV = parseFloat(document.getElementById("preco_gnv").value);
  const custoInstalacao = parseFloat(document.getElementById("custo_instalacao").value);

  if (isNaN(kmMes) || kmMes <= 0) {
    alert("Informe a quilometragem mensal corretamente.");
    return;
  }

  const gastoGasolina = (kmMes / consumoGasolina) * precoGasolina;
  const gastoEtanol = (kmMes / consumoEtanol) * precoEtanol;
  const gastoGNV = (kmMes / consumoGNV) * precoGNV;

  const menorGasto = Math.min(gastoGasolina, gastoEtanol, gastoGNV);
  const maisEconomico = menorGasto === gastoGNV ? "GNV" : menorGasto === gastoGasolina ? "Gasolina" : "Etanol";

  const economiaMensal = gastoGasolina - gastoGNV;
  const economiaIPVA = dadosVeiculo.ipvaIsento ? 0 : dadosVeiculo.ipvaNormal - dadosVeiculo.ipvaComGNV;
  const retornoSemIPVA = economiaMensal > 0 ? custoInstalacao / economiaMensal : null;
  const economiaComIPVAMensal = economiaMensal + economiaIPVA / 12;
  const retornoComIPVA = economiaComIPVAMensal > 0 ? custoInstalacao / economiaComIPVAMensal : null;

  const mensagemRetorno =
    retornoSemIPVA && retornoComIPVA
      ? `<p><strong>Retorno do investimento:</strong></p>
         <ul>
           <li>✔️ Apenas com economia de combustível: <strong>${retornoSemIPVA.toFixed(1)} meses</strong></li>
           <li>✔️ Com economia de combustível + IPVA: <strong>${retornoComIPVA.toFixed(1)} meses</strong></li>
         </ul>`
      : "<p><strong>Não é possível calcular o retorno (economia insuficiente).</strong></p>";

  document.getElementById("resultadoCenario1").innerHTML = `
    <h4>Resultado</h4>
    <p><strong>Gasto mensal com gasolina:</strong> R$ ${gastoGasolina.toFixed(2)}</p>
    <p><strong>Gasto mensal com etanol:</strong> R$ ${gastoEtanol.toFixed(2)}</p>
    <p><strong>Gasto mensal com GNV:</strong> R$ ${gastoGNV.toFixed(2)}</p>
    <p><strong>Combustível mais econômico:</strong> ${maisEconomico}</p>
    <p><strong>Economia mensal com GNV:</strong> R$ ${economiaMensal.toFixed(2)}</p>
    ${mensagemRetorno}
    <p><strong>Economia anual no IPVA (estimada):</strong> R$ ${economiaIPVA.toFixed(2)}</p>
    ${economiaIPVA > 0
      ? `<p style="color: green;"><strong>💡 Dica:</strong> Só com o desconto no IPVA, você já economiza R$ ${economiaIPVA.toFixed(2)} por ano.</p>`
      : `<p style="color: gray;">IPVA já é isento para este veículo.</p>`}
    <p><em>🖱️ Passe o mouse sobre as barras para ver a economia em 5 anos. 📱 Em celulares, veja o resumo abaixo do gráfico.</em></p>
  `;

  const gasto5AnosGasolina = gastoGasolina * 12 * 5;
  const gasto5AnosEtanol = gastoEtanol * 12 * 5;
  const gasto5AnosGNV = gastoGNV * 12 * 5;
  const economia5AnosGasolina = gasto5AnosGasolina - gasto5AnosGNV;
  const economia5AnosEtanol = gasto5AnosEtanol - gasto5AnosGNV;
  const economiaIPVATotal = economiaIPVA * 5;

  if (window.graficoEconomia && typeof window.graficoEconomia.destroy === "function") {
    window.graficoEconomia.destroy();
  }

  const ctx = document.getElementById("graficoEconomia").getContext("2d");
  window.graficoEconomia = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Gasolina", "Etanol", "GNV"],
      datasets: [
        {
          label: "Gasto acumulado em 5 anos (R$)",
          data: [gasto5AnosGasolina, gasto5AnosEtanol, gasto5AnosGNV],
          backgroundColor: ["#c0392b", "#f39c12", "#27ae60"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Comparativo de gasto acumulado em 5 anos",
        },
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            afterBody: function (context) {
              const label = context[0].label;
              if (label === "GNV") {
                return [
                  `💸 Economia vs Gasolina: R$ ${economia5AnosGasolina.toFixed(2)}`,
                  `💸 Economia vs Etanol: R$ ${economia5AnosEtanol.toFixed(2)}`,
                  economiaIPVA > 0 ? `🎁 Economia IPVA (5 anos): R$ ${economiaIPVATotal.toFixed(2)}` : null,
                ].filter(Boolean);
              }
            },
          },
        },
        datalabels: {
          color: "#000",
          anchor: "end",
          align: "top",
          formatter: (value) => `R$ ${value.toFixed(0)}`,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
    plugins: [ChartDataLabels],
  });

  const resumoComparativo = `
    <h4>Resumo da Economia em 5 Anos</h4>
    <ul>
      <li>💰 Economia GNV vs Gasolina: <strong>R$ ${economia5AnosGasolina.toFixed(2)}</strong></li>
      <li>💰 Economia GNV vs Etanol: <strong>R$ ${economia5AnosEtanol.toFixed(2)}</strong></li>
      ${economiaIPVATotal > 0 ? `<li>🎁 Economia com IPVA: <strong>R$ ${economiaIPVATotal.toFixed(2)}</strong></li>` : ""}
    </ul>
  `;

  document.getElementById("resultadoCenario1").innerHTML += resumoComparativo;
}
