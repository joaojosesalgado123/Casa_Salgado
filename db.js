/* Casa Salgado — base de dados
   Liga ao ficheiro SQLite em data/loja.db, cria a tabela de produtos
   se ainda não existir e, na primeira execução, importa o catálogo
   inicial de products.json (que a partir daí serve apenas de seed). */

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const PASTA_DADOS = path.join(__dirname, "data");
const FICHEIRO_BD = path.join(PASTA_DADOS, "loja.db");
const FICHEIRO_SEED = path.join(__dirname, "products.json");

if (!fs.existsSync(PASTA_DADOS)) {
  fs.mkdirSync(PASTA_DADOS);
}

const bd = new Database(FICHEIRO_BD);
bd.pragma("journal_mode = WAL");

bd.exec(`
  CREATE TABLE IF NOT EXISTS produtos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nome       TEXT NOT NULL,
    categoria  TEXT NOT NULL DEFAULT 'Outros',
    preco      TEXT NOT NULL DEFAULT '',
    descricao  TEXT NOT NULL DEFAULT '',
    disponivel INTEGER NOT NULL DEFAULT 1
  )
`);

// Importação inicial: só quando a tabela está vazia e o seed existe
function importarSeed() {
  const total = bd.prepare("SELECT COUNT(*) AS n FROM produtos").get().n;
  if (total > 0 || !fs.existsSync(FICHEIRO_SEED)) return;

  let dados;
  try {
    dados = JSON.parse(fs.readFileSync(FICHEIRO_SEED, "utf-8"));
  } catch (erro) {
    console.warn("Não consegui ler o products.json inicial:", erro.message);
    return;
  }
  const produtos = Array.isArray(dados.produtos) ? dados.produtos : [];
  if (produtos.length === 0) return;

  const inserir = bd.prepare(`
    INSERT INTO produtos (id, nome, categoria, preco, descricao, disponivel)
    VALUES (@id, @nome, @categoria, @preco, @descricao, @disponivel)
  `);
  const inserirTodos = bd.transaction(function (lista) {
    lista.forEach(function (p) {
      inserir.run({
        id: p.id || null,
        nome: p.nome,
        categoria: p.categoria || "Outros",
        preco: p.preco || "",
        descricao: p.descricao || "",
        disponivel: p.disponivel ? 1 : 0
      });
    });
  });
  inserirTodos(produtos);
  console.log("Catálogo inicial importado de products.json: " + produtos.length + " produto(s).");
}

importarSeed();

// A BD guarda disponivel como 0/1; cá fora usa-se true/false
function paraFora(linha) {
  return {
    id: linha.id,
    nome: linha.nome,
    categoria: linha.categoria,
    preco: linha.preco,
    descricao: linha.descricao,
    disponivel: linha.disponivel === 1
  };
}

function listarProdutos() {
  return bd.prepare("SELECT * FROM produtos ORDER BY id").all().map(paraFora);
}

function obterProduto(id) {
  const linha = bd.prepare("SELECT * FROM produtos WHERE id = ?").get(id);
  return linha ? paraFora(linha) : null;
}

function criarProduto(p) {
  const resultado = bd.prepare(`
    INSERT INTO produtos (nome, categoria, preco, descricao, disponivel)
    VALUES (@nome, @categoria, @preco, @descricao, @disponivel)
  `).run({
    nome: p.nome,
    categoria: p.categoria || "Outros",
    preco: p.preco || "",
    descricao: p.descricao || "",
    disponivel: p.disponivel ? 1 : 0
  });
  return obterProduto(resultado.lastInsertRowid);
}

function alterarProduto(id, p) {
  const resultado = bd.prepare(`
    UPDATE produtos
    SET nome = @nome, categoria = @categoria, preco = @preco,
        descricao = @descricao, disponivel = @disponivel
    WHERE id = @id
  `).run({
    id: id,
    nome: p.nome,
    categoria: p.categoria || "Outros",
    preco: p.preco || "",
    descricao: p.descricao || "",
    disponivel: p.disponivel ? 1 : 0
  });
  return resultado.changes > 0 ? obterProduto(id) : null;
}

function apagarProduto(id) {
  return bd.prepare("DELETE FROM produtos WHERE id = ?").run(id).changes > 0;
}

module.exports = {
  listarProdutos: listarProdutos,
  obterProduto: obterProduto,
  criarProduto: criarProduto,
  alterarProduto: alterarProduto,
  apagarProduto: apagarProduto
};