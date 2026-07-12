/* Casa Salgado — site público
   Carrega os produtos de products.json e desenha o catálogo.
   Se o ficheiro não puder ser lido (por ex. ao abrir o index.html
   diretamente do disco), usa uma lista de reserva para nada ficar vazio. */

(function () {
  "use strict";

  var PRODUTOS_RESERVA = [
    { id: 1, nome: "Dobradiças de latão", categoria: "Ferragens", preco: "2,50 € / par", descricao: "Várias medidas disponíveis.", disponivel: true },
    { id: 2, nome: "Varão de cortinado em madeira", categoria: "Cortinados", preco: "15,00 €", descricao: "Cortado à medida na loja.", disponivel: true },
    { id: 3, nome: "Serrote de costa", categoria: "Ferramentas", preco: "14,50 €", descricao: "O símbolo da casa.", disponivel: true }
  ];

  var grelha = document.getElementById("grelhaProdutos");
  var filtros = document.getElementById("filtros");
  var todos = [];
  var categoriaAtiva = "Tudo";

  function referencia(p) {
    // Referência tipo etiqueta de gaveta: FER-001
    var prefixo = (p.categoria || "GER").slice(0, 3).toUpperCase();
    return prefixo + "-" + String(p.id).padStart(3, "0");
  }

  function desenharFiltros() {
    var categorias = ["Tudo"];
    todos.forEach(function (p) {
      if (p.categoria && categorias.indexOf(p.categoria) === -1) {
        categorias.push(p.categoria);
      }
    });
    filtros.innerHTML = "";
    categorias.forEach(function (cat) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = cat;
      if (cat === categoriaAtiva) b.classList.add("ativo");
      b.addEventListener("click", function () {
        categoriaAtiva = cat;
        desenharFiltros();
        desenharProdutos();
      });
      filtros.appendChild(b);
    });
  }

  function desenharProdutos() {
    var visiveis = todos.filter(function (p) {
      return categoriaAtiva === "Tudo" || p.categoria === categoriaAtiva;
    });
    grelha.innerHTML = "";
    if (visiveis.length === 0) {
      var vazio = document.createElement("p");
      vazio.textContent = "Sem produtos nesta categoria por agora.";
      grelha.appendChild(vazio);
      return;
    }
    visiveis.forEach(function (p) {
      var carta = document.createElement("article");
      carta.className = "produto" + (p.disponivel ? "" : " produto--esgotado");

      var topo = document.createElement("div");
      topo.className = "produto__topo";
      var ref = document.createElement("span");
      ref.textContent = referencia(p);
      var cat = document.createElement("span");
      cat.textContent = p.categoria || "";
      topo.appendChild(ref);
      topo.appendChild(cat);

      var corpo = document.createElement("div");
      corpo.className = "produto__corpo";
      var nome = document.createElement("h3");
      nome.className = "produto__nome";
      nome.textContent = p.nome;
      var desc = document.createElement("p");
      desc.className = "produto__descricao";
      desc.textContent = p.descricao || "";
      corpo.appendChild(nome);
      corpo.appendChild(desc);

      var rodape = document.createElement("div");
      rodape.className = "produto__preco";
      var preco = document.createElement("span");
      preco.textContent = p.preco || "sob consulta";
      var estado = document.createElement("span");
      estado.className = "produto__estado " +
        (p.disponivel ? "produto__estado--sim" : "produto__estado--nao");
      estado.textContent = p.disponivel ? "Disponível" : "Esgotado";
      rodape.appendChild(preco);
      rodape.appendChild(estado);

      carta.appendChild(topo);
      carta.appendChild(corpo);
      carta.appendChild(rodape);
      grelha.appendChild(carta);
    });
  }

  function horarioDeHoje() {
    var alvo = document.getElementById("horarioHoje");
    if (!alvo) return;
    var dia = new Date().getDay(); // 0 = domingo
    var textos = {
      0: "Hoje: encerrado",
      1: "Hoje: 9h–13h · 14h–19h",
      2: "Hoje: 9h–12h30 · 14h–19h",
      3: "Hoje: 9h–12h30 · 14h–19h",
      4: "Hoje: 9h–12h30 · 14h–19h",
      5: "Hoje: 9h–12h30 · 14h–19h",
      6: "Hoje: 9h–13h"
    };
    alvo.textContent = textos[dia];
  }

  function iniciar(lista) {
    todos = lista;
    desenharFiltros();
    desenharProdutos();
  }

  horarioDeHoje();

  fetch("products.json", { cache: "no-store" })
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (dados) {
      iniciar(Array.isArray(dados.produtos) ? dados.produtos : PRODUTOS_RESERVA);
    })
    .catch(function () {
      // Abertura direta do ficheiro no browser, sem servidor
      iniciar(PRODUTOS_RESERVA);
    });
})();
