/* Casa Salgado — página de gestão
   Lê e grava o ficheiro products.json diretamente no repositório
   do GitHub. Quando se grava, o GitHub Pages volta a publicar o
   site sozinho (demora cerca de um minuto).

   A chave (token) fica guardada apenas no localStorage do
   computador da loja. Deve ser um "fine-grained token" com acesso
   de leitura/escrita a "Contents" SÓ neste repositório. */

(function () {
  "use strict";

  var REPO_DONO = "joaojosesalgado123";
  var REPO_NOME = "Casa_Salgado";
  var FICHEIRO = "products.json";
  var RAMO = "main";
  var CHAVE_LOCAL = "casaSalgadoToken";

  var API_URL = "https://api.github.com/repos/" + REPO_DONO + "/" + REPO_NOME +
    "/contents/" + FICHEIRO + "?ref=" + RAMO;

  var produtos = [];
  var shaAtual = null;       // versão do ficheiro no GitHub (precisa-se para gravar)
  var haAlteracoes = false;
  var emEdicao = null;       // id do produto a alterar, ou null se for novo

  // ---------- Elementos ----------
  var $ = function (id) { return document.getElementById(id); };
  var mensagem = $("mensagem");
  var lista = $("listaProdutos");
  var painelForm = $("painelFormulario");
  var resumo = $("resumoAlteracoes");
  var botaoPublicar = $("botaoPublicar");

  // ---------- Mensagens grandes e claras ----------
  function avisar(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = "estado-msg estado-msg--" + (tipo || "info");
    mensagem.scrollIntoView({ block: "nearest" });
  }

  // ---------- Chave de acesso ----------
  function tokenGuardado() {
    return localStorage.getItem(CHAVE_LOCAL) || "";
  }

  $("botaoGuardarToken").addEventListener("click", function () {
    var t = $("campoToken").value.trim();
    if (!t) {
      avisar("Escreva a chave na caixa antes de guardar.", "erro");
      return;
    }
    localStorage.setItem(CHAVE_LOCAL, t);
    $("campoToken").value = "";
    avisar("Chave guardada neste computador. Já pode gerir os produtos.", "ok");
    carregarProdutos();
  });

  $("botaoApagarToken").addEventListener("click", function () {
    localStorage.removeItem(CHAVE_LOCAL);
    avisar("Chave apagada deste computador.", "info");
  });

  // ---------- Ler os produtos do GitHub ----------
  function decifrarBase64(b64) {
    var binario = atob(b64.replace(/\n/g, ""));
    var bytes = new Uint8Array(binario.length);
    for (var i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }

  function cifrarBase64(texto) {
    var bytes = new TextEncoder().encode(texto);
    var binario = "";
    bytes.forEach(function (b) { binario += String.fromCharCode(b); });
    return btoa(binario);
  }

  function cabecalhos() {
    var h = { "Accept": "application/vnd.github+json" };
    var t = tokenGuardado();
    if (t) h["Authorization"] = "Bearer " + t;
    return h;
  }

  function carregarProdutos() {
    avisar("A ler a lista de produtos…", "info");
    fetch(API_URL, { headers: cabecalhos(), cache: "no-store" })
      .then(function (r) {
        if (r.status === 401 || r.status === 403) {
          throw new Error("chave");
        }
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (dados) {
        shaAtual = dados.sha;
        var conteudo = JSON.parse(decifrarBase64(dados.content));
        produtos = Array.isArray(conteudo.produtos) ? conteudo.produtos : [];
        haAlteracoes = false;
        atualizarResumo();
        desenharLista();
        avisar("Lista carregada. " + produtos.length + " produto(s).", "ok");
      })
      .catch(function (erro) {
        if (erro.message === "chave") {
          avisar("A chave de acesso está em falta ou já não é válida. Verifique o passo 1.", "erro");
        } else {
          avisar("Não consegui ler os produtos do site. Verifique a ligação à internet e tente outra vez.", "erro");
        }
        desenharLista();
      });
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
        if (confirm("Apagar «" + p.nome + "» da lista?")) {
          produtos = produtos.filter(function (x) { return x.id !== p.id; });
          marcarAlteracao();
          desenharLista();
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
    if (emEdicao) {
      var p = produtos.find(function (x) { return x.id === emEdicao; });
      Object.assign(p, dados);
    } else {
      var maiorId = produtos.reduce(function (m, x) { return Math.max(m, x.id || 0); }, 0);
      dados.id = maiorId + 1;
      produtos.push(dados);
    }
    marcarAlteracao();
    fecharFormulario();
    desenharLista();
    avisar("Produto guardado na lista. Não se esqueça do botão verde em baixo para enviar para o site.", "ok");
  });

  // ---------- Publicar no site ----------
  function marcarAlteracao() {
    haAlteracoes = true;
    atualizarResumo();
  }

  function atualizarResumo() {
    botaoPublicar.disabled = !haAlteracoes;
    resumo.textContent = haAlteracoes
      ? "Há alterações por enviar para o site."
      : "Sem alterações por enviar.";
  }

  botaoPublicar.addEventListener("click", function () {
    if (!tokenGuardado()) {
      avisar("Falta a chave de acesso (passo 1) para poder gravar.", "erro");
      return;
    }
    botaoPublicar.disabled = true;
    avisar("A enviar as alterações para o site…", "info");

    var corpo = {
      atualizado: new Date().toISOString().slice(0, 10),
      produtos: produtos
    };
    var pedido = {
      message: "Atualização de produtos (página de gestão)",
      content: cifrarBase64(JSON.stringify(corpo, null, 2) + "\n"),
      branch: RAMO
    };
    if (shaAtual) pedido.sha = shaAtual;

    fetch(API_URL, {
      method: "PUT",
      headers: cabecalhos(),
      body: JSON.stringify(pedido)
    })
      .then(function (r) {
        if (r.status === 401 || r.status === 403) throw new Error("chave");
        if (r.status === 409) throw new Error("conflito");
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (resposta) {
        shaAtual = resposta.content.sha;
        haAlteracoes = false;
        atualizarResumo();
        avisar("Feito! As alterações foram enviadas. O site atualiza-se dentro de um minuto.", "ok");
      })
      .catch(function (erro) {
        botaoPublicar.disabled = false;
        if (erro.message === "chave") {
          avisar("A chave de acesso não deixou gravar. Verifique o passo 1 ou peça uma chave nova ao João.", "erro");
        } else if (erro.message === "conflito") {
          avisar("Alguém alterou os produtos noutro sítio ao mesmo tempo. Recarregue a página e tente de novo.", "erro");
        } else {
          avisar("Não consegui gravar. Verifique a internet e tente outra vez.", "erro");
        }
      });
  });

  // ---------- Arranque ----------
  if (!tokenGuardado()) {
    avisar("Bem-vindo! Comece pelo passo 1: guardar a chave de acesso.", "info");
  }
  carregarProdutos();
})();
