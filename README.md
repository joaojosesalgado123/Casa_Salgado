# Casa Salgado — site e gestão de produtos

App web da Casa Salgado (ferragens e drogaria, Viana do Castelo, desde 1954):
site público com o catálogo da loja e uma área de gestão simples para
atualizar os produtos sem tocar em código.

## Estrutura

```
server.js            → servidor Express: site + API + sessões
db.js                → base de dados SQLite (data/loja.db) e seed inicial
public/index.html    → site público (catálogo, história, contactos, mapa)
public/gestao.html   → área de gestão de produtos (para o pai)
public/css/          → estilos partilhados
public/js/site.js    → lógica do site público
public/js/gestao.js  → lógica da gestão (login + API)
public/assets/       → fotografia da fachada
products.json        → catálogo inicial (só é importado na primeira execução)
data/loja.db         → a base de dados (criada sozinha; fora do git)
```

## Correr no computador

Precisa do [Node.js](https://nodejs.org) instalado (versão 20 ou mais recente).

1. Instalar as dependências (só na primeira vez):
   ```
   npm install
   ```
2. Criar o ficheiro de configuração (só na primeira vez):
   copiar `.env.example` para `.env` e preencher a password da gestão
   (`SENHA_GESTAO`) e o segredo das sessões (`SEGREDO_SESSAO`).
3. Arrancar o servidor:
   ```
   npm start
   ```
   e abrir `http://localhost:3000`. Durante o desenvolvimento pode usar-se
   `npm run dev`, que reinicia sozinho quando o código muda.

Na primeira execução, a base de dados é criada e o catálogo inicial é
importado de `products.json`. A partir daí a fonte de dados é a base de
dados — o `products.json` fica apenas como semente.

## A API

| Método | Rota               | Sessão | Descrição            |
|--------|--------------------|--------|----------------------|
| GET    | /api/produtos      | não    | Lista de produtos    |
| POST   | /api/produtos      | sim    | Criar produto        |
| PUT    | /api/produtos/:id  | sim    | Alterar produto      |
| DELETE | /api/produtos/:id  | sim    | Apagar produto       |
| POST   | /api/login         | não    | Iniciar sessão       |
| POST   | /api/logout        | sim    | Terminar sessão      |
| GET    | /api/sessao        | não    | Há sessão ativa?     |

## Como o pai usa (dia a dia)

1. Abrir a página **Gestão** (guardar nos favoritos do browser da loja).
2. Escrever a password da loja e carregar em **Entrar**.
3. Carregar em **➕ Acrescentar produto** ou **✏️ Alterar** / **🗑️ Apagar**.
4. Ao confirmar, a alteração fica logo no site — não é preciso mais nada.

## Alojar na internet

O servidor precisa de um sítio onde o Node.js corra de forma permanente e o
ficheiro `data/loja.db` persista entre reinícios — por exemplo um VPS pequeno,
ou serviços como Render/Railway/Fly.io **com disco persistente**. Passos:

1. Instalar as dependências (`npm install`) e criar o `.env` no servidor,
   com uma password forte e um segredo de sessão aleatório.
2. Arrancar com `npm start` (idealmente atrás de um gestor de processos,
   por ex. `pm2`, e de HTTPS — os cookies de sessão viajam nos pedidos).

⚠️ O GitHub Pages deixou de servir: agora há um backend, e páginas estáticas
não chegam.