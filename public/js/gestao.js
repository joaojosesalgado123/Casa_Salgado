/* Casa Salgado — página de gestão
   Fala com a API do próprio servidor (/api/...). Para alterar os
   produtos é preciso iniciar sessão com a password da loja; depois
   cada alteração fica gravada no site no momento em que se confirma. */

(function () {
  "use strict";

  var produtos = [];
  var emEdicao = null; // id do produto a alterar, ou null se for novo

  // ---------- Elementos ----------
  var $ = function (id) { return document.getElementById(id); };
  var mensagem = $("mensagem");
  var lista = $("listaProdutos");
  var painelLogin = $("painelLogin");
  var painelProdutos = $("painelProdutos");
  var painelForm = $("painelFormulario");

  // ---------- Mensagens grandes e claras ----------
  function avisar(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = "estado-msg estado-msg--" + (tipo || "info");
    mensagem.scrollIntoView({ block: "nearest" });
  }

  // ---------- Pedidos à API ----------
  function pedirJson(url, opcoes) {
    opcoes = opcoes || {};
    opcoes.headers = { "Content-Type": "application/json" };
    opcoes.cache = "no-store";
    return fetch(url, opcoes).then(function (r) {
      if (r.status === 401) throw new Error("sessao");
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function tratarErro(erro) {
    if (erro.message === "sessao") {
      mostrarLogin();
      avisar("A sessão terminou. Escreva a password outra vez para continuar.", "erro");
    } else {
      avisar("Não consegui falar com o servidor. Verifique se o site está a funcionar e tente outra vez.", "erro");
    }
  }

  // ---------- Entrar e sair ----------
  function mostrarLogin() {
    painelLogin.hidden = false;
    painelProdutos.hidden = true;
    painelForm.hidden = true;
    $("campoSenha").focus();
  }

  function mostrarGestao() {
    painelLogin.hidden = true;
    painelProdutos.hidden = false;
    carregarProdutos();
  }

  function entrar() {
    var senha = $("campoSenha").value;
    if (!senha) {
      avisar("Escreva a password na caixa antes de carregar em «Entrar».", "erro");
      $("campoSenha").focus();
      return;
    }
    avisar("A verificar…", "info");
    fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha: senha })
    })
      .then(function (r) {
        if (r.status === 401) throw new Error("errada");
        if (!r.ok) throw new Error("HTTP " + r.status);
        $("campoSenha").value = "";
        avisar("Bem-vindo! Já pode gerir os produtos.", "ok");
        mostrarGestao();
      })
      .catch(function (erro) {
        if (erro.message === "errada") {
          avisar("A password não está certa. Tente outra vez, com calma.", "erro");
          $("campoSenha").select();
        } else {
          avisar("Não consegui falar com o servidor. Tente outra vez daqui a um momento.", "erro");
        }
      });
  }

  $("botaoEntrar").addEventListener("click", entrar);
  $("campoSenha").addEventListener("keydown", function (e) {
    if (e.key === "Enter") entrar();
  });

  $("botaoSair").addEventListener("click", function () {
    pedirJson("/api/logout", { method: "POST" })
      .catch(function () { /* mesmo que falhe, sai-se localmente */ })
      .then(function () {
        mostrarLogin();
        avisar("Sessão terminada. Até à próxima!", "info");
      });
  });

  // ---------- Ler os produtos ----------
  function carregarProdutos() {
    avisar("A ler a lista de produtos…", "info");
    pedirJson("/api/produtos")
      .then(function (dados) {
        produtos = Array.isArray(dados.produtos) ? dados.produtos : [];
        desenharLista();
        avisar("Lista carregada. " + produtos.length + " produto(s).", "ok");
      })
      .catch(tratarErro);
  }

  // ---------- Desenhar a lista ----------
  function desenharLista() {
    lista.innerHTML = "";
    if (produtos.length === 0) {
      var vazio = document.createElement("p");
      vazio.textContent = "Ainda não há produtos. Carregue em «Acrescentar produto» para começar.";
      lista.appendChild(vazio);
      return;
    }
    produtos.forEach(function (p) {
      var item = document.createElement("div");
      item.className = "item-gestao" + (p.disponivel ? "" : " item-gestao--esgotado");

      var info = document.createElement("div");
      info.className = "item-gestao__info";
      var nome = document.createElement("strong");
      nome.textContent = p.nome;
      var meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = p.categoria + " · " + (p.preco || "sem preço") +
        (p.disponivel ? "" : " · ESGOTADO");
      info.appendChild(nome);
      info.appendChild(meta);

      var acoes = document.createElement("div");
      acoes.className = "item-gestao__acoes";

      var bAlterar = document.createElement("button");
      bAlterar.className = "botao botao--secundario";
      bAlterar.textContent = "✏️ Alterar";
      bAlterar.addEventListener("click", function () { abrirFormulario(p.id); });

      var bApagar = document.createElement("button");
      bApagar.className = "botao botao--perigo";
      bApagar.textContent = "🗑️ Apagar";
      bApagar.addEventListener("click", function () {
        if (confirm("Apagar «" + p.nome + "» do site?")) {
          apagarProduto(p);
        }
      });

      acoes.appendChild(bAlterar);
      acoes.appendChild(bApagar);
      item.appendChild(info);
      item.appendChild(acoes);
      lista.appendChild(item);
    });
  }

  // ---------- Formulário ----------
  function abrirFormulario(id) {
    emEdicao = id || null;
    $("tituloFormulario").textContent = emEdicao ? "Alterar produto" : "Acrescentar produto";
    var p = emEdicao ? produtos.find(function (x) { return x.id === emEdicao; }) : null;
    $("fNome").value = p ? p.nome : "";
    $("fCategoria").value = p ? p.categoria : "Ferragens";
    $("fPreco").value = p ? p.preco : "";
    $("fDescricao").value = p ? p.descricao : "";
    $("fDisponivel").value = p && !p.disponivel ? "nao" : "sim";
    painelForm.hidden = false;
    painelForm.scrollIntoView({ behavior: "smooth", block: "start" });
    $("fNome").focus();
  }

  function fecharFormulario() {
    painelForm.hidden = true;
    emEdicao = null;
  }

  $("botaoNovo").addEventListener("click", function () { abrirFormulario(null); });
  $("botaoCancelarProduto").addEventListener("click", fecharFormulario);

  // ---------- Gravar no site ----------
  $("botaoConfirmarProduto").addEventListener("click", function () {
    var nome = $("fNome").value.trim();
    if (!nome) {
      avisar("O produto precisa de um nome.", "erro");
      $("fNome").focus();
      return;
    }
    var dados = {
      nome: nome,
      categoria: $("fCategoria").value,
      preco: $("fPreco").value.trim(),
      descricao: $("fDescricao").value.trim(),
      disponivel: $("fDisponivel").value === "sim"
    };
    avisar("A guardar…", "info");
    var pedido = emEdicao
      ? pedirJson("/api/produtos/" + emEdicao, { method: "PUT", body: JSON.stringify(dados) })
      : pedirJson("/api/produtos", { method: "POST", body: JSON.stringify(dados) });

    pedido
      .then(function () {
        fecharFormulario();
        return pedirJson("/api/produtos");
      })
      .then(function (resposta) {
        produtos = Array.isArray(resposta.produtos) ? resposta.produtos : [];
        desenharLista();
        avisar("Feito! O produto já está no site.", "ok");
      })
      .catch(tratarErro);
  });

  function apagarProduto(p) {
    avisar("A apagar…", "info");
    pedirJson("/api/produtos/" + p.id, { method: "DELETE" })
      .then(function () {
        return pedirJson("/api/produtos");
      })
      .then(function (resposta) {
        produtos = Array.isArray(resposta.produtos) ? resposta.produtos : [];
        desenharLista();
        avisar("«" + p.nome + "» foi apagado do site.", "ok");
      })
      .catch(tratarErro);
  }

  // ---------- Arranque ----------
  // Vê-se primeiro se já há sessão iniciada neste browser
  pedirJson("/api/sessao")
    .then(function (dados) {
      if (dados.autenticada) {
        mostrarGestao();
      } else {
        mostrarLogin();
        avisar("Bem-vindo! Escreva a password da loja para começar.", "info");
      }
    })
    .catch(function () {
      mostrarLogin();
      avisar("Não consegui falar com o servidor. Verifique se o site está a funcionar.", "erro");
    });
})();