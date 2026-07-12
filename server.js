/* Casa Salgado — servidor
   Serve o site (pasta public/) e a API de produtos.
   A escrita (criar/alterar/apagar) exige sessão iniciada com a
   password da loja, definida no ficheiro .env (SENHA_GESTAO). */

require("dotenv").config();

const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");
const bd = require("./db");

const PORTA = process.env.PORT || 3000;
const SENHA_GESTAO = process.env.SENHA_GESTAO;
const SEGREDO_SESSAO = process.env.SEGREDO_SESSAO;

if (!SENHA_GESTAO || !SEGREDO_SESSAO) {
  console.error(
    "Faltam variáveis no ficheiro .env (SENHA_GESTAO e SEGREDO_SESSAO).\n" +
    "Copie o .env.example para .env e preencha os valores."
  );
  process.exit(1);
}

// A password nunca fica em claro na memória do servidor além do arranque:
// guarda-se só o hash e compara-se com bcrypt no login
const HASH_SENHA = bcrypt.hashSync(SENHA_GESTAO, 10);

const app = express();

app.use(express.json());
app.use(session({
  secret: SEGREDO_SESSAO,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 8 // 8 horas: chega para um dia de loja
  }
}));

// ---------- Autenticação ----------

function exigirSessao(req, res, next) {
  if (req.session && req.session.autenticada) return next();
  res.status(401).json({ erro: "É preciso iniciar sessão." });
}

app.post("/api/login", function (req, res) {
  const senha = (req.body && req.body.senha) || "";
  if (!bcrypt.compareSync(senha, HASH_SENHA)) {
    return res.status(401).json({ erro: "Password errada." });
  }
  req.session.autenticada = true;
  res.json({ autenticada: true });
});

app.post("/api/logout", exigirSessao, function (req, res) {
  req.session.destroy(function () {
    res.json({ autenticada: false });
  });
});

app.get("/api/sessao", function (req, res) {
  res.json({ autenticada: !!(req.session && req.session.autenticada) });
});

// ---------- Produtos ----------

app.get("/api/produtos", function (req, res) {
  // Mesmo formato do antigo products.json, para o site não notar a diferença
  res.json({ produtos: bd.listarProdutos() });
});

function validarProduto(corpo) {
  if (!corpo || typeof corpo.nome !== "string" || corpo.nome.trim() === "") {
    return null;
  }
  return {
    nome: corpo.nome.trim(),
    categoria: typeof corpo.categoria === "string" ? corpo.categoria.trim() : "Outros",
    preco: typeof corpo.preco === "string" ? corpo.preco.trim() : "",
    descricao: typeof corpo.descricao === "string" ? corpo.descricao.trim() : "",
    disponivel: corpo.disponivel !== false
  };
}

app.post("/api/produtos", exigirSessao, function (req, res) {
  const produto = validarProduto(req.body);
  if (!produto) {
    return res.status(400).json({ erro: "O produto precisa de um nome." });
  }
  res.status(201).json(bd.criarProduto(produto));
});

app.put("/api/produtos/:id", exigirSessao, function (req, res) {
  const produto = validarProduto(req.body);
  if (!produto) {
    return res.status(400).json({ erro: "O produto precisa de um nome." });
  }
  const alterado = bd.alterarProduto(Number(req.params.id), produto);
  if (!alterado) {
    return res.status(404).json({ erro: "Produto não encontrado." });
  }
  res.json(alterado);
});

app.delete("/api/produtos/:id", exigirSessao, function (req, res) {
  if (!bd.apagarProduto(Number(req.params.id))) {
    return res.status(404).json({ erro: "Produto não encontrado." });
  }
  res.json({ apagado: true });
});

// ---------- Site ----------

app.use(express.static(path.join(__dirname, "public")));

app.listen(PORTA, function () {
  console.log("Casa Salgado no ar: http://localhost:" + PORTA);
});